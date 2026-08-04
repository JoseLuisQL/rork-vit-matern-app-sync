/**
 * VITMATERNA — Reductor optimista de la cola offline.
 * Aplica las acciones pendientes sobre el último snapshot del servidor para
 * que la app responda al instante aun sin señal. El servidor sigue siendo la
 * fuente de verdad: al sincronizar, su snapshot reemplaza esta vista.
 */
import type { Alert, ClientAction, Message, Snapshot, User } from "@/types";

function cloneForMutation(snapshot: Snapshot): Snapshot {
  return {
    ...snapshot,
    appointments: snapshot.appointments.map((a) => ({ ...a })),
    messages: snapshot.messages.map((m) => ({ ...m })),
    alerts: snapshot.alerts.map((a) => ({ ...a })),
    visits: snapshot.visits.map((v) => ({ ...v })),
    intakes: Object.fromEntries(
      Object.entries(snapshot.intakes).map(([pid, days]) => [
        pid,
        Object.fromEntries(Object.entries(days).map(([k, ids]) => [k, [...ids]])),
      ]),
    ),
  };
}

export function applyOutbox(snapshot: Snapshot, actions: ClientAction[], user: User): Snapshot {
  if (actions.length === 0) return snapshot;
  const s = cloneForMutation(snapshot);

  for (const action of actions) {
    switch (action.type) {
      case "confirm_appointment":
      case "request_reschedule": {
        const appt = s.appointments.find((a) => a.id === action.appointmentId);
        if (appt && appt.estado !== "asistida" && appt.estado !== "no_asistida") {
          appt.estado =
            action.type === "confirm_appointment" ? "confirmada" : "solicitud_reprogramacion";
        }
        break;
      }
      case "set_appointment_status": {
        const appt = s.appointments.find((a) => a.id === action.appointmentId);
        if (appt) appt.estado = action.estado;
        break;
      }
      case "toggle_intake": {
        const perPatient = s.intakes[action.patientId] ?? (s.intakes[action.patientId] = {});
        const day = perPatient[action.dayKey] ?? (perPatient[action.dayKey] = []);
        const has = day.includes(action.supplementId);
        if (action.taken && !has) day.push(action.supplementId);
        if (!action.taken && has) {
          perPatient[action.dayKey] = day.filter((id) => id !== action.supplementId);
        }
        break;
      }
      case "send_message": {
        const msg: Message = {
          id: `m-${action.id}`,
          convId: action.convId,
          sender: user.role === "gestante" ? "gestante" : "obstetra",
          kind: "text",
          text: action.text.trim(),
          atISO: action.atISO,
          readByGestante: user.role === "gestante",
          readByObstetra: user.role === "obstetra",
          pending: true,
        };
        s.messages.push(msg);
        break;
      }
      case "mark_read": {
        s.messages.forEach((m) => {
          if (m.convId !== action.convId) return;
          if (user.role === "gestante") m.readByGestante = true;
          if (user.role === "obstetra") m.readByObstetra = true;
        });
        break;
      }
      case "report_alarm": {
        if (!user.patientId) break;
        const signsText = action.signs.length > 0 ? action.signs.join(", ") : "Malestar general";
        const alert: Alert = {
          id: `al-alarma-${action.id}`,
          type: "alarma",
          patientId: user.patientId,
          atISO: action.atISO,
          title: "Reporte de signos de alarma",
          detail: action.note?.trim() ? `${signsText}. Nota: ${action.note.trim()}` : signsText,
          status: "abierta",
          lat: action.lat ?? null,
          lng: action.lng ?? null,
          pending: true,
        };
        s.alerts.push(alert);
        s.messages.push({
          id: `m-${action.id}`,
          convId: user.patientId,
          sender: "gestante",
          kind: "alarma",
          text: `Reporte de signos de alarma: ${signsText.toLowerCase()}${
            action.note?.trim() ? `. ${action.note.trim()}` : ""
          }`,
          atISO: action.atISO,
          readByGestante: true,
          readByObstetra: false,
          pending: true,
        });
        break;
      }
      case "panic": {
        if (!user.patientId) break;
        s.alerts.push({
          id: `al-sos-${action.id}`,
          type: "emergencia",
          patientId: user.patientId,
          atISO: action.atISO,
          title: "Botón de emergencia",
          detail:
            action.lat != null && action.lng != null
              ? "Emergencia activada con ubicación GPS."
              : "Emergencia activada (sin ubicación disponible).",
          status: "abierta",
          lat: action.lat,
          lng: action.lng,
          pending: true,
        });
        s.messages.push({
          id: `m-${action.id}`,
          convId: user.patientId,
          sender: "gestante",
          kind: "emergencia",
          text: "Botón de emergencia activado. Necesito ayuda.",
          atISO: action.atISO,
          readByGestante: true,
          readByObstetra: false,
          pending: true,
        });
        break;
      }
      case "attend_alert": {
        const alert = s.alerts.find((a) => a.id === action.alertId);
        if (alert) {
          alert.status = "atendida";
          alert.note = action.note;
          alert.attendedAtISO = action.atISO;
        }
        break;
      }
      case "complete_visit": {
        const visit = s.visits.find((v) => v.id === action.visitId);
        if (visit) {
          visit.estado = "realizada";
          visit.resultado = action.resultado;
        }
        break;
      }
    }
  }
  return s;
}
