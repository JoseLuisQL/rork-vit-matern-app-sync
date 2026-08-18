/**
 * VITMATERNA — Despachador de notificaciones y eventos de WhatsApp.
 * Ejecuta los envíos en segundo plano de manera no bloqueante y registra
 * los intentos en la tabla `whatsapp_logs`.
 */
import type { Queryable } from "../db";
import { formatDateSpanish } from "./formatter";
import { sendWhatsAppLocation, sendWhatsAppText } from "./client";
import {
  templateAlarmAlert,
  templateAppointmentRescheduled,
  templateAppointmentScheduled,
  templateChatFallback,
  templateSosAlert,
  templateSupplementAssigned,
} from "./templates";
import type {
  Appointment,
  Patient,
  Supplement,
  UserRecord,
  WhatsAppConfig,
} from "../types";

/**
 * Guarda una entrada de auditoría en la tabla `whatsapp_logs`.
 */
export async function logWhatsAppDelivery(
  db: Queryable,
  phone: string,
  kind: string,
  status: "sent" | "failed" | "skipped",
  error?: string,
): Promise<void> {
  try {
    const id = `wl-${crypto.randomUUID().slice(0, 8)}`;
    await db.query(
      `INSERT INTO whatsapp_logs (id, phone, kind, status, error, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [id, phone, kind, status, error ?? null],
    );
  } catch (e) {
    console.warn("[whatsapp-log] No se pudo registrar log:", e);
  }
}

/**
 * Despacha notificación por nueva cita o reprogramación al WhatsApp de la gestante.
 */
export async function dispatchAppointmentNotification(
  db: Queryable,
  config: WhatsAppConfig,
  patient: Patient,
  appt: Appointment,
  isReschedule = false,
  obstetrician?: UserRecord,
): Promise<void> {
  if (!config.enabled || !config.notifyAppointments) return;
  if (!patient.phone || !patient.phone.trim()) return;

  const dateStr = formatDateSpanish(appt.dateKey);
  const obstetraName = obstetrician
    ? `Obst. ${obstetrician.firstName} ${obstetrician.lastName}`.trim()
    : undefined;

  const message = isReschedule
    ? templateAppointmentRescheduled({
        patientName: patient.firstName,
        dateStr,
        time: appt.time,
        reason: appt.motivo,
        location: appt.lugar,
      })
    : templateAppointmentScheduled({
        patientName: patient.firstName,
        dateStr,
        time: appt.time,
        reason: appt.motivo,
        location: appt.lugar,
        obstetricianName: obstetraName,
      });

  // Ejecución no bloqueante
  sendWhatsAppText(config, patient.phone, message)
    .then(async (res) => {
      await logWhatsAppDelivery(
        db,
        patient.phone,
        isReschedule ? "reprogramacion_cita" : "nueva_cita",
        res.ok ? "sent" : res.skipped ? "skipped" : "failed",
        res.error,
      );
    })
    .catch((err) => console.warn("[whatsapp] Error en dispatch de cita:", err));
}

/**
 * Despacha notificación por nuevo suplemento asignado al WhatsApp de la gestante.
 */
export async function dispatchSupplementNotification(
  db: Queryable,
  config: WhatsAppConfig,
  patient: Patient,
  supplement: Supplement,
): Promise<void> {
  if (!config.enabled || !config.notifySupplements) return;
  if (!patient.phone || !patient.phone.trim()) return;

  const message = templateSupplementAssigned({
    patientName: patient.firstName,
    supplementName: supplement.name,
    dose: supplement.dose,
    schedule: supplement.schedule,
    timesPerDay: supplement.timesPerDay ?? 1,
  });

  sendWhatsAppText(config, patient.phone, message)
    .then(async (res) => {
      await logWhatsAppDelivery(
        db,
        patient.phone,
        "nuevo_medicamento",
        res.ok ? "sent" : res.skipped ? "skipped" : "failed",
        res.error,
      );
    })
    .catch((err) => console.warn("[whatsapp] Error en dispatch de medicamento:", err));
}

/**
 * Despacha un mensaje de chat al WhatsApp de la gestante cuando está offline en la app.
 */
export async function dispatchChatFallbackNotification(
  db: Queryable,
  config: WhatsAppConfig,
  senderUser: UserRecord,
  patient: Patient,
  text: string,
): Promise<void> {
  if (!config.enabled || !config.chatOfflineFallback) return;
  if (!patient.phone || !patient.phone.trim()) return;

  const senderName = `Obst. ${senderUser.firstName} ${senderUser.lastName}`.trim();
  const message = templateChatFallback({
    senderName,
    patientName: patient.firstName,
    text,
  });

  sendWhatsAppText(config, patient.phone, message)
    .then(async (res) => {
      await logWhatsAppDelivery(
        db,
        patient.phone,
        "chat_fallback_offline",
        res.ok ? "sent" : res.skipped ? "skipped" : "failed",
        res.error,
      );
    })
    .catch((err) => console.warn("[whatsapp] Error en chat fallback:", err));
}

/**
 * Despacha alerta de emergencia SOS a los obstetras registrados cuando están offline.
 */
export async function dispatchSosEmergencyNotification(
  db: Queryable,
  config: WhatsAppConfig,
  patient: Patient,
  obstetras: UserRecord[],
  lat?: number | null,
  lng?: number | null,
  gestationalWeeks?: number,
  riskLevel?: string,
): Promise<void> {
  if (!config.enabled || !config.sosOfflineAlerts) return;

  const message = templateSosAlert({
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientDni: patient.dni,
    phone: patient.phone,
    community: patient.community,
    gestationalWeeks,
    riskLevel,
    lat,
    lng,
  });

  for (const obs of obstetras) {
    if (!obs.phone || !obs.phone.trim()) continue;

    sendWhatsAppText(config, obs.phone, message)
      .then(async (res) => {
        await logWhatsAppDelivery(
          db,
          obs.phone ?? "",
          "alerta_sos_urgente",
          res.ok ? "sent" : res.skipped ? "skipped" : "failed",
          res.error,
        );

        // Si tenemos coordenadas GPS válidas y Open-WA soporta sendLocation
        if (lat != null && lng != null && res.ok) {
          await sendWhatsAppLocation(
            config,
            obs.phone,
            lat,
            lng,
            `SOS: ${patient.firstName} ${patient.lastName}`,
            `Comunidad ${patient.community}`,
          ).catch(() => {});
        }
      })
      .catch((err) => console.warn("[whatsapp] Error en SOS dispatch:", err));
  }
}

/**
 * Despacha reporte de signos de alarma a los obstetras registrados cuando están offline.
 */
export async function dispatchAlarmSignsNotification(
  db: Queryable,
  config: WhatsAppConfig,
  patient: Patient,
  obstetras: UserRecord[],
  signs: string[],
  note?: string,
  lat?: number | null,
  lng?: number | null,
): Promise<void> {
  if (!config.enabled || !config.sosOfflineAlerts) return;

  const signsText = signs.length > 0 ? signs.join(", ") : "Malestar general";
  const message = templateAlarmAlert({
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientDni: patient.dni,
    phone: patient.phone,
    community: patient.community,
    signsText,
    note,
    lat,
    lng,
  });

  for (const obs of obstetras) {
    if (!obs.phone || !obs.phone.trim()) continue;

    sendWhatsAppText(config, obs.phone, message)
      .then(async (res) => {
        await logWhatsAppDelivery(
          db,
          obs.phone ?? "",
          "alerta_signos_alarma",
          res.ok ? "sent" : res.skipped ? "skipped" : "failed",
          res.error,
        );
      })
      .catch((err) => console.warn("[whatsapp] Error en alarma dispatch:", err));
  }
}
