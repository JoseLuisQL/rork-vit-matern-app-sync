/**
 * VITMATERNA — Motor de recordatorios de citas y medicamentos por WhatsApp.
 * Realiza escaneos periódicos idempotentes utilizando la tabla `sent_reminders`.
 */
import type { Queryable } from "../db";
import { addDaysToKey, peruDayKey, peruTime } from "../clinical";
import { formatDateSpanish } from "./formatter";
import { logWhatsAppDelivery } from "./dispatcher";
import { sendWhatsAppText } from "./client";
import {
  templateAppointmentReminder,
  templateSupplementReminder,
} from "./templates";
import type {
  Patient,
  Supplement,
  WhatsAppConfig,
} from "../types";

interface ApptReminderRow {
  id: string;
  patient_id: string;
  control: number | null;
  week: number | null;
  date_key: string;
  time: string;
  motivo: string;
  estado: string;
  lugar: string;
  phone: string;
  first_name: string;
  last_name: string;
}

/**
 * Revisa citas del día siguiente y de las próximas horas para enviar recordatorios.
 */
export async function processAppointmentReminders(
  db: Queryable,
  config: WhatsAppConfig,
): Promise<number> {
  if (!config.enabled || !config.remindAppointments) return 0;

  const todayKey = peruDayKey();
  const tomorrowKey = addDaysToKey(todayKey, 1);
  const currentTime = peruTime();

  let sentCount = 0;

  // 1. Recordatorio 24 horas antes (citas de mañana)
  const tomorrowAppts = await db.query<ApptReminderRow>(
    `SELECT a.*, p.phone, p.first_name, p.last_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
      WHERE a.date_key = $1
        AND a.estado IN ('programada', 'confirmada')
        AND p.phone IS NOT NULL AND p.phone <> ''`,
    [tomorrowKey],
  );

  for (const appt of tomorrowAppts.rows) {
    const reminderId = `appt-${appt.id}-24h`;
    const check = await db.query(
      "SELECT 1 FROM sent_reminders WHERE id = $1",
      [reminderId],
    );
    if ((check.rowCount ?? 0) > 0) continue;

    const message = templateAppointmentReminder({
      patientName: appt.first_name,
      dateStr: formatDateSpanish(appt.date_key),
      time: appt.time,
      reason: appt.motivo,
      location: appt.lugar,
      hoursNotice: 24,
    });

    const res = await sendWhatsAppText(config, appt.phone, message);
    await logWhatsAppDelivery(
      db,
      appt.phone,
      "recordatorio_cita_24h",
      res.ok ? "sent" : res.skipped ? "skipped" : "failed",
      res.error,
    );

    if (res.ok) {
      await db.query(
        `INSERT INTO sent_reminders (id, patient_id, kind, sent_at)
         VALUES ($1, $2, 'recordatorio_cita_24h', now())
         ON CONFLICT (id) DO NOTHING`,
        [reminderId, appt.patient_id],
      );
      sentCount++;
    }
  }

  // 2. Recordatorio del mismo día (próximas 2 horas)
  const todayAppts = await db.query<ApptReminderRow>(
    `SELECT a.*, p.phone, p.first_name, p.last_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
      WHERE a.date_key = $1
        AND a.estado IN ('programada', 'confirmada')
        AND a.time >= $2
        AND p.phone IS NOT NULL AND p.phone <> ''`,
    [todayKey, currentTime],
  );

  for (const appt of todayAppts.rows) {
    const reminderId = `appt-${appt.id}-2h`;
    const check = await db.query(
      "SELECT 1 FROM sent_reminders WHERE id = $1",
      [reminderId],
    );
    if ((check.rowCount ?? 0) > 0) continue;

    // Calculamos si está dentro de la ventana de ~2 horas
    const [hAppt, mAppt] = appt.time.split(":").map(Number);
    const [hNow, mNow] = currentTime.split(":").map(Number);
    const diffMinutes = (hAppt * 60 + mAppt) - (hNow * 60 + mNow);

    if (diffMinutes > 0 && diffMinutes <= 150) {
      const message = templateAppointmentReminder({
        patientName: appt.first_name,
        dateStr: "Hoy",
        time: appt.time,
        reason: appt.motivo,
        location: appt.lugar,
        hoursNotice: 2,
      });

      const res = await sendWhatsAppText(config, appt.phone, message);
      await logWhatsAppDelivery(
        db,
        appt.phone,
        "recordatorio_cita_2h",
        res.ok ? "sent" : res.skipped ? "skipped" : "failed",
        res.error,
      );

      if (res.ok) {
        await db.query(
          `INSERT INTO sent_reminders (id, patient_id, kind, sent_at)
           VALUES ($1, $2, 'recordatorio_cita_2h', now())
           ON CONFLICT (id) DO NOTHING`,
          [reminderId, appt.patient_id],
        );
        sentCount++;
      }
    }
  }

  return sentCount;
}

/**
 * Revisa pacientes con medicamentos activos que no hayan registrado su toma hoy.
 */
export async function processSupplementReminders(
  db: Queryable,
  config: WhatsAppConfig,
): Promise<number> {
  if (!config.enabled || !config.remindSupplements) return 0;

  const todayKey = peruDayKey();
  const currentHour = parseInt(peruTime().split(":")[0] ?? "0", 10);

  // Enviamos los recordatorios matutinos preferentemente a partir de las 8:00 AM
  if (currentHour < 8 || currentHour >= 20) return 0;

  let sentCount = 0;

  // Pacientes con suplementos activos
  const patientsRes = await db.query<Patient>(
    `SELECT DISTINCT p.*
       FROM patients p
       JOIN supplements s ON s.patient_id = p.id
      WHERE p.phone IS NOT NULL AND p.phone <> ''`,
  );

  for (const patient of patientsRes.rows) {
    const reminderId = `supp-${patient.id}-${todayKey}`;
    const check = await db.query(
      "SELECT 1 FROM sent_reminders WHERE id = $1",
      [reminderId],
    );
    if ((check.rowCount ?? 0) > 0) continue;

    // Verificar si ya tomó todos sus suplementos hoy
    const suppsRes = await db.query<Supplement>(
      "SELECT * FROM supplements WHERE patient_id = $1",
      [patient.id],
    );
    const intakesRes = await db.query<{ supplement_id: string; count: number }>(
      "SELECT supplement_id, count FROM intakes WHERE patient_id = $1 AND day_key = $2",
      [patient.id, todayKey],
    );

    const takenMap = new Map(intakesRes.rows.map((r) => [r.supplement_id, r.count]));
    const pendingSupps = suppsRes.rows.filter(
      (s) => (takenMap.get(s.id) ?? 0) < (s.timesPerDay ?? 1),
    );

    if (pendingSupps.length === 0) continue;

    const suppList = pendingSupps
      .map((s) => `• *${s.name}* (${s.dose}) · ${s.timesPerDay ?? 1} vez al día`)
      .join("\n");

    const message = templateSupplementReminder({
      patientName: patient.firstName,
      supplementsList: suppList,
    });

    const res = await sendWhatsAppText(config, patient.phone, message);
    await logWhatsAppDelivery(
      db,
      patient.phone,
      "recordatorio_medicamento_diario",
      res.ok ? "sent" : res.skipped ? "skipped" : "failed",
      res.error,
    );

    if (res.ok) {
      await db.query(
        `INSERT INTO sent_reminders (id, patient_id, kind, sent_at)
         VALUES ($1, $2, 'recordatorio_medicamento_diario', now())
         ON CONFLICT (id) DO NOTHING`,
        [reminderId, patient.id],
      );
      sentCount++;
    }
  }

  return sentCount;
}
