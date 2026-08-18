/**
 * VITMATERNA — Acciones de la cola offline (idempotentes por id).
 * Cada acción se traduce a SQL puntual dentro de la transacción del sync.
 * Devuelven un mensaje de error de negocio o null si tuvieron éxito
 * (mismos textos y reglas que el backend en la nube).
 */
import type { PoolClient } from "pg";
import { isValidDayKey, peruDayKey } from "./clinical";
import { computePatient, isActiveState, sanitizeSupplementFields } from "./domain";
import { presence } from "./presence";
import { loadWhatsAppConfig, mapPatient, mapUser } from "./rows";
import type { PatientRow, UserRow } from "./rows";
import { insertMessageRow } from "./seed";
import type { AppointmentStatus, ClientAction, Message, UserRecord } from "./types";
import {
  dispatchAlarmSignsNotification,
  dispatchChatFallbackNotification,
  dispatchSosEmergencyNotification,
  dispatchSupplementNotification,
} from "./whatsapp/dispatcher";

/** ISO válido del cliente o el instante actual si viene malformado. */
export function safeISO(value: string | undefined | null): string {
  if (typeof value === "string") {
    const t = Date.parse(value);
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return new Date().toISOString();
}

interface SupplementRef {
  id: string;
  patientId: string;
  timesPerDay: number;
}

async function getSupplementRef(client: PoolClient, id: string): Promise<SupplementRef | null> {
  const res = await client.query<{ id: string; patient_id: string; times_per_day: number }>(
    "SELECT id, patient_id, times_per_day FROM supplements WHERE id = $1",
    [id],
  );
  const row = res.rows[0];
  return row ? { id: row.id, patientId: row.patient_id, timesPerDay: row.times_per_day } : null;
}

async function patientExists(client: PoolClient, id: string): Promise<boolean> {
  const res = await client.query("SELECT 1 FROM patients WHERE id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

/** Inserta un mensaje (idempotente) y poda la conversación a 300 mensajes. */
export async function pushMessage(client: PoolClient, msg: Message): Promise<void> {
  await insertMessageRow(client, msg);
  await client.query(
    `DELETE FROM messages
      WHERE conv_id = $1
        AND seq NOT IN (
          SELECT seq FROM messages WHERE conv_id = $1 ORDER BY seq DESC LIMIT 300
        )`,
    [msg.convId],
  );
}

/** Aplica una acción. Devuelve mensaje de error o null si tuvo éxito. */
export async function applyAction(
  client: PoolClient,
  user: UserRecord,
  action: ClientAction,
): Promise<string | null> {
  const ownPatientId = user.patientId ?? null;

  switch (action.type) {
    case "confirm_appointment":
    case "request_reschedule": {
      const res = await client.query<{ patient_id: string; estado: AppointmentStatus }>(
        "SELECT patient_id, estado FROM appointments WHERE id = $1",
        [action.appointmentId],
      );
      const appt = res.rows[0];
      if (!appt) return "La cita ya no existe";
      if (user.role === "gestante" && appt.patient_id !== ownPatientId) {
        return "Cita de otra paciente";
      }
      if (!isActiveState(appt.estado)) return "La cita ya fue atendida";
      await client.query("UPDATE appointments SET estado = $2 WHERE id = $1", [
        action.appointmentId,
        action.type === "confirm_appointment" ? "confirmada" : "solicitud_reprogramacion",
      ]);
      return null;
    }
    case "set_appointment_status": {
      if (user.role === "gestante") return "Acción no permitida";
      const res = await client.query("UPDATE appointments SET estado = $2 WHERE id = $1", [
        action.appointmentId,
        action.estado,
      ]);
      if ((res.rowCount ?? 0) === 0) return "La cita ya no existe";
      return null;
    }
    case "toggle_intake": {
      const patientId = user.role === "gestante" ? ownPatientId : action.patientId;
      if (!patientId || (user.role === "gestante" && action.patientId !== patientId)) {
        return "Paciente no válida";
      }
      const supplement = await getSupplementRef(client, action.supplementId);
      if (!supplement || supplement.patientId !== patientId) return "Suplemento no válido";
      if (!isValidDayKey(action.dayKey)) return "Fecha no válida";
      if (action.taken) {
        await client.query(
          `INSERT INTO intakes (patient_id, day_key, supplement_id, count)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (patient_id, day_key, supplement_id) DO NOTHING`,
          [patientId, action.dayKey, action.supplementId],
        );
      } else {
        await client.query(
          "DELETE FROM intakes WHERE patient_id = $1 AND day_key = $2 AND supplement_id = $3",
          [patientId, action.dayKey, action.supplementId],
        );
      }
      return null;
    }
    case "set_intake_count": {
      const patientId = user.role === "gestante" ? ownPatientId : action.patientId;
      if (!patientId || (user.role === "gestante" && action.patientId !== patientId)) {
        return "Paciente no válida";
      }
      const supplement = await getSupplementRef(client, action.supplementId);
      if (!supplement || supplement.patientId !== patientId) return "Medicamento no válido";
      if (!isValidDayKey(action.dayKey)) return "Fecha no válida";
      const maxTimes = Math.max(1, Math.min(6, Math.round(supplement.timesPerDay)));
      const count = Math.max(0, Math.min(maxTimes, Math.round(action.count)));
      if (count === 0) {
        await client.query(
          "DELETE FROM intakes WHERE patient_id = $1 AND day_key = $2 AND supplement_id = $3",
          [patientId, action.dayKey, action.supplementId],
        );
      } else {
        await client.query(
          `INSERT INTO intakes (patient_id, day_key, supplement_id, count)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (patient_id, day_key, supplement_id) DO UPDATE SET count = EXCLUDED.count`,
          [patientId, action.dayKey, action.supplementId, count],
        );
      }
      return null;
    }
    case "add_supplement": {
      if (user.role === "gestante") return "Solo el personal de salud puede asignar medicamentos";
      if (!(await patientExists(client, action.patientId))) return "Paciente no encontrada";
      const fields = sanitizeSupplementFields(action.fields);
      if (!fields) return "Escribe el nombre del medicamento";
      await client.query(
        `INSERT INTO supplements (id, patient_id, name, dose, schedule, times_per_day, start_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          `s-${action.id}`,
          action.patientId,
          fields.name,
          fields.dose,
          fields.schedule,
          fields.timesPerDay,
          peruDayKey(),
        ],
      );

      // Notificación por WhatsApp
      const patRes = await client.query<PatientRow>("SELECT * FROM patients WHERE id = $1", [
        action.patientId,
      ]);
      const pRow = patRes.rows[0];
      if (pRow) {
        const waConfig = await loadWhatsAppConfig(client);
        void dispatchSupplementNotification(client, waConfig, mapPatient(pRow), {
          id: `s-${action.id}`,
          patientId: action.patientId,
          name: fields.name,
          dose: fields.dose,
          schedule: fields.schedule,
          timesPerDay: fields.timesPerDay,
        });
      }
      return null;
    }
    case "update_supplement": {
      if (user.role === "gestante") return "Solo el personal de salud puede cambiar medicamentos";
      const fields = sanitizeSupplementFields(action.fields);
      if (!fields) return "Escribe el nombre del medicamento";
      const res = await client.query(
        "UPDATE supplements SET name = $2, dose = $3, schedule = $4, times_per_day = $5 WHERE id = $1",
        [action.supplementId, fields.name, fields.dose, fields.schedule, fields.timesPerDay],
      );
      if ((res.rowCount ?? 0) === 0) return "El medicamento ya no existe";

      // Notificación por WhatsApp
      const suppRef = await getSupplementRef(client, action.supplementId);
      if (suppRef) {
        const patRes = await client.query<PatientRow>("SELECT * FROM patients WHERE id = $1", [
          suppRef.patientId,
        ]);
        const pRow = patRes.rows[0];
        if (pRow) {
          const waConfig = await loadWhatsAppConfig(client);
          void dispatchSupplementNotification(client, waConfig, mapPatient(pRow), {
            id: action.supplementId,
            patientId: suppRef.patientId,
            name: fields.name,
            dose: fields.dose,
            schedule: fields.schedule,
            timesPerDay: fields.timesPerDay,
          });
        }
      }
      return null;
    }
    case "remove_supplement": {
      if (user.role === "gestante") return "Solo el personal de salud puede quitar medicamentos";
      // Las tomas registradas se limpian solas (FK en cascada).
      const res = await client.query("DELETE FROM supplements WHERE id = $1", [
        action.supplementId,
      ]);
      if ((res.rowCount ?? 0) === 0) return "El medicamento ya no existe";
      return null;
    }
    case "send_message": {
      if (user.role === "admin") return "La administración no participa del chat clínico";
      const convId = user.role === "gestante" ? ownPatientId : action.convId;
      if (!convId || !(await patientExists(client, convId))) return "Conversación no válida";
      if (user.role === "gestante" && action.convId !== convId) return "Conversación no válida";
      const text = action.text.trim();
      if (text.length === 0) return "Mensaje vacío";
      await pushMessage(client, {
        id: `m-${action.id}`,
        convId,
        sender: user.role === "gestante" ? "gestante" : "obstetra",
        kind: "text",
        text,
        atISO: safeISO(action.atISO),
        readByGestante: user.role === "gestante",
        readByObstetra: user.role === "obstetra",
      });

      // Fallback a WhatsApp si el obstetra escribe y la gestante está offline en la app
      if (user.role === "obstetra") {
        const patRes = await client.query<PatientRow>("SELECT * FROM patients WHERE id = $1", [
          convId,
        ]);
        const pRow = patRes.rows[0];
        if (pRow && !presence.isOnline(pRow.dni)) {
          const waConfig = await loadWhatsAppConfig(client);
          void dispatchChatFallbackNotification(client, waConfig, user, mapPatient(pRow), text);
        }
      }
      return null;
    }
    case "mark_read": {
      if (user.role === "admin") return null;
      if (user.role === "gestante") {
        await client.query("UPDATE messages SET read_by_gestante = TRUE WHERE conv_id = $1", [
          action.convId,
        ]);
      } else {
        await client.query("UPDATE messages SET read_by_obstetra = TRUE WHERE conv_id = $1", [
          action.convId,
        ]);
      }
      return null;
    }
    case "report_alarm": {
      if (user.role !== "gestante" || !ownPatientId) return "Solo la gestante puede reportar";
      const signs = Array.isArray(action.signs) ? action.signs : [];
      const signsText = signs.length > 0 ? signs.join(", ") : "Malestar general";
      const note = action.note?.trim();
      const atISO = safeISO(action.atISO);
      await client.query(
        `INSERT INTO alerts (id, type, patient_id, at_iso, title, detail, status, lat, lng)
         VALUES ($1, 'alarma', $2, $3, $4, $5, 'abierta', $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          `al-alarma-${action.id}`,
          ownPatientId,
          atISO,
          "Reporte de signos de alarma",
          note ? `${signsText}. Nota: ${note}` : signsText,
          action.lat ?? null,
          action.lng ?? null,
        ],
      );
      await pushMessage(client, {
        id: `m-${action.id}`,
        convId: ownPatientId,
        sender: "gestante",
        kind: "alarma",
        text: `Reporte de signos de alarma: ${signsText.toLowerCase()}${note ? `. ${note}` : ""}`,
        atISO,
        readByGestante: true,
        readByObstetra: false,
        lat: action.lat ?? null,
        lng: action.lng ?? null,
      });

      // Si los obstetras están offline, notificar alerta por WhatsApp
      const obsRes = await client.query<UserRow>(
        "SELECT * FROM users WHERE role = 'obstetra' AND active = TRUE",
      );
      const obstetras = obsRes.rows.map(mapUser);
      const anyObstetraOnline = presence.areAnyOnline(obstetras.map((o) => o.dni));
      if (!anyObstetraOnline && obstetras.length > 0) {
        const patRes = await client.query<PatientRow>("SELECT * FROM patients WHERE id = $1", [
          ownPatientId,
        ]);
        const pRow = patRes.rows[0];
        if (pRow) {
          const waConfig = await loadWhatsAppConfig(client);
          void dispatchAlarmSignsNotification(
            client,
            waConfig,
            mapPatient(pRow),
            obstetras,
            signs,
            note,
            action.lat ?? null,
            action.lng ?? null,
          );
        }
      }
      return null;
    }
    case "panic": {
      if (user.role !== "gestante" || !ownPatientId) return "Solo la gestante puede activar el SOS";
      const atISO = safeISO(action.atISO);
      await client.query(
        `INSERT INTO alerts (id, type, patient_id, at_iso, title, detail, status, lat, lng)
         VALUES ($1, 'emergencia', $2, $3, $4, $5, 'abierta', $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          `al-sos-${action.id}`,
          ownPatientId,
          atISO,
          "Botón de emergencia",
          action.lat != null && action.lng != null
            ? "Emergencia activada con ubicación GPS."
            : "Emergencia activada (sin ubicación disponible).",
          action.lat,
          action.lng,
        ],
      );
      await pushMessage(client, {
        id: `m-${action.id}`,
        convId: ownPatientId,
        sender: "gestante",
        kind: "emergencia",
        text: "Botón de emergencia activado. Necesito ayuda.",
        atISO,
        readByGestante: true,
        readByObstetra: false,
        lat: action.lat,
        lng: action.lng,
      });

      // Si los obstetras están offline, notificar emergencia urgente por WhatsApp
      const obsRes = await client.query<UserRow>(
        "SELECT * FROM users WHERE role = 'obstetra' AND active = TRUE",
      );
      const obstetras = obsRes.rows.map(mapUser);
      const anyObstetraOnline = presence.areAnyOnline(obstetras.map((o) => o.dni));
      if (!anyObstetraOnline && obstetras.length > 0) {
        const patRes = await client.query<PatientRow>("SELECT * FROM patients WHERE id = $1", [
          ownPatientId,
        ]);
        const pRow = patRes.rows[0];
        if (pRow) {
          const waConfig = await loadWhatsAppConfig(client);
          void dispatchSosEmergencyNotification(
            client,
            waConfig,
            mapPatient(pRow),
            obstetras,
            action.lat,
            action.lng,
          );
        }
      }
      return null;
    }
    case "attend_alert": {
      if (user.role === "gestante") return "Acción no permitida";
      const res = await client.query(
        "UPDATE alerts SET status = 'atendida', note = $2, attended_at_iso = $3 WHERE id = $1",
        [action.alertId, action.note.trim(), safeISO(action.atISO)],
      );
      if ((res.rowCount ?? 0) === 0) return "La alerta ya no existe";
      return null;
    }
    case "complete_visit": {
      if (user.role === "gestante") return "Acción no permitida";
      const res = await client.query(
        "UPDATE visits SET estado = 'realizada', resultado = $2 WHERE id = $1",
        [action.visitId, action.resultado.trim()],
      );
      if ((res.rowCount ?? 0) === 0) return "La visita ya no existe";
      return null;
    }
    case "update_patient": {
      if (user.role === "gestante") return "Solo el personal de salud puede actualizar la ficha";
      if (!(await patientExists(client, action.patientId))) return "Paciente no encontrada";
      const f = action.fields ?? {};
      const sets: string[] = [];
      const values: unknown[] = [action.patientId];
      const set = (column: string, value: unknown) => {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      };
      if (f.fumKey !== undefined) {
        if (!isValidDayKey(f.fumKey) || f.fumKey > peruDayKey()) {
          return "La fecha de última menstruación no es válida";
        }
        set("fum_key", f.fumKey);
      }
      if (f.hbObserved !== undefined) {
        set("hb_observed", Math.max(4, Math.min(20, Math.round(f.hbObserved * 10) / 10)));
      }
      if (f.bpSys !== undefined) set("bp_sys", Math.max(70, Math.min(240, Math.round(f.bpSys))));
      if (f.bpDia !== undefined) set("bp_dia", Math.max(40, Math.min(140, Math.round(f.bpDia))));
      if (f.imc !== undefined) set("imc", Math.max(12, Math.min(60, Math.round(f.imc * 10) / 10)));
      if (f.age !== undefined) set("age", Math.max(12, Math.min(60, Math.round(f.age))));
      if (f.gestas !== undefined) set("gestas", Math.max(1, Math.min(20, Math.round(f.gestas))));
      if (f.cesareas !== undefined) {
        set("cesareas", Math.max(0, Math.min(10, Math.round(f.cesareas))));
      }
      if (f.abortos !== undefined) set("abortos", Math.max(0, Math.min(10, Math.round(f.abortos))));
      if (f.community !== undefined && f.community.trim().length > 0) {
        set("community", f.community.trim().slice(0, 60));
      }
      if (f.phone !== undefined) set("phone", f.phone.trim().slice(0, 20));
      if (sets.length > 0) {
        await client.query(`UPDATE patients SET ${sets.join(", ")} WHERE id = $1`, values);
      }
      return null;
    }
    default:
      return "Acción desconocida";
  }
}
