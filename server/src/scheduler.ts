/**
 * VITMATERNA — Scheduler de tareas en segundo plano.
 * Ejecuta periódicamente el escaneo de recordatorios de WhatsApp
 * y mantenimiento liviano del servidor.
 */
import { pool } from "./db";
import { loadWhatsAppConfig } from "./rows";
import {
  processAppointmentReminders,
  processSupplementReminders,
} from "./whatsapp/reminders";

let timerId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

/** Intervalo del scheduler: 15 minutos */
const SCHEDULER_INTERVAL_MS = 15 * 60 * 1000;

export async function runSchedulerTick(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const config = await loadWhatsAppConfig(pool);
    if (config.enabled) {
      const apptCount = await processAppointmentReminders(pool, config);
      const suppCount = await processSupplementReminders(pool, config);
      if (apptCount > 0 || suppCount > 0) {
        console.log(
          `[scheduler] WhatsApp reminders ejecutados: ${apptCount} citas, ${suppCount} suplementos.`,
        );
      }
    }
  } catch (err) {
    console.warn("[scheduler] Error en ejecución de tick:", err);
  } finally {
    isRunning = false;
  }
}

export function startScheduler(): void {
  if (timerId !== null) return;
  console.log("[scheduler] Scheduler de VitMaterna iniciado (cada 15 min)");
  // Primer tick diferido tras 10 segundos para dar tiempo al arranque de DB
  setTimeout(() => void runSchedulerTick(), 10_000);
  timerId = setInterval(() => void runSchedulerTick(), SCHEDULER_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
    console.log("[scheduler] Scheduler detenido");
  }
}
