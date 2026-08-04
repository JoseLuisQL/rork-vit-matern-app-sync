/**
 * VITMATERNA — Recordatorios locales (suplementos y cita del día siguiente).
 * Usa notificaciones locales del teléfono: funcionan sin señal.
 *
 * `expo-notifications` se carga de forma diferida: en Expo Go para Android
 * (SDK 53+) el solo hecho de importar el módulo lanza el error de
 * "push notifications removed from Expo Go", así que aquí nunca se importa
 * estáticamente. En web y en Expo Go Android todas las funciones son
 * no-op seguras; en la app instalada funcionan con normalidad.
 */
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { dateFromKey, fechaLarga } from "@/lib/format";
import type { Message, Snapshot } from "@/types";

export interface ReminderSettings {
  /** Recordatorio diario de tomas de hierro/ácido fólico. */
  tomas: boolean;
  /** Hora local del recordatorio diario (0–23). */
  hora: number;
  /** Aviso el día anterior a cada cita. */
  citas: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = { tomas: false, hora: 8, citas: false };

export const REMINDER_HOURS = [7, 8, 12, 18, 20] as const;

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Disponibilidad de recordatorios locales en este entorno.
 * En web no hay soporte y en Expo Go para Android el módulo fue retirado.
 */
export const REMINDERS_SUPPORTED: boolean =
  Platform.OS !== "web" && !(Platform.OS === "android" && isExpoGo);

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null | undefined;

/** Carga expo-notifications solo cuando el entorno lo soporta. */
function getNotifications(): NotificationsModule | null {
  if (!REMINDERS_SUPPORTED) return null;
  if (notificationsModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      notificationsModule = require("expo-notifications") as NotificationsModule;
    } catch (e) {
      console.log("[VitMaterna] expo-notifications no disponible:", e);
      notificationsModule = null;
    }
  }
  return notificationsModule;
}

export function initNotifications(): void {
  const notifications = getNotifications();
  if (!notifications) return;
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    notifications
      .setNotificationChannelAsync("recordatorios", {
        name: "Recordatorios",
        importance: notifications.AndroidImportance.DEFAULT,
      })
      .catch((e) => console.log("[VitMaterna] canal de notificaciones:", e));
    notifications
      .setNotificationChannelAsync("avisos", {
        name: "Avisos y mensajes",
        importance: notifications.AndroidImportance.MAX,
      })
      .catch((e) => console.log("[VitMaterna] canal de avisos:", e));
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const notifications = getNotifications();
  if (!notifications) return false;
  const current = await notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelAllReminders(): Promise<void> {
  const notifications = getNotifications();
  if (!notifications) return;
  await notifications.cancelAllScheduledNotificationsAsync();
}

/** Presenta una notificación inmediata en la bandeja del teléfono. */
async function presentNow(
  notifications: NotificationsModule,
  title: string,
  body: string,
): Promise<void> {
  await notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: Platform.OS === "android" ? { channelId: "avisos" } : null,
  });
}

/**
 * Compara el snapshot anterior con el nuevo y avisa en la bandeja nativa
 * del teléfono lo que llegó mientras tanto: mensajes nuevos, emergencias y
 * signos de alarma (obstetra) y cambios de cita (gestante).
 */
export async function notifySnapshotDelta(
  prev: Snapshot | null,
  next: Snapshot,
): Promise<void> {
  const notifications = getNotifications();
  if (!notifications || !prev) return;
  const role = next.me.role;
  if (role === "admin") return;
  const permission = await notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const nameOf = (patientId: string): string => {
    const p = next.patients.find((x) => x.id === patientId);
    return p ? p.firstName : "una paciente";
  };

  const prevMessageIds = new Set(prev.messages.map((m) => m.id));
  const unreadByMe = (m: Message): boolean =>
    role === "gestante" ? !m.readByGestante : !m.readByObstetra;
  const freshMessages = next.messages.filter(
    (m) => !prevMessageIds.has(m.id) && m.sender !== role && unreadByMe(m),
  );
  if (freshMessages.length === 1) {
    const m = freshMessages[0];
    await presentNow(
      notifications,
      role === "gestante" ? "Mensaje de tu obstetra" : `Mensaje de ${nameOf(m.convId)}`,
      m.text.slice(0, 140),
    );
  } else if (freshMessages.length > 1) {
    await presentNow(
      notifications,
      "Mensajes nuevos",
      `Tienes ${freshMessages.length} mensajes nuevos en VitMaterna.`,
    );
  }

  if (role === "obstetra") {
    const prevAlertIds = new Set(prev.alerts.map((a) => a.id));
    const urgentNew = next.alerts.filter(
      (a) =>
        !prevAlertIds.has(a.id) &&
        a.status === "abierta" &&
        (a.type === "emergencia" || a.type === "alarma"),
    );
    for (const alert of urgentNew.slice(0, 3)) {
      await presentNow(
        notifications,
        alert.type === "emergencia"
          ? `🚨 Emergencia · ${nameOf(alert.patientId)}`
          : `Signos de alarma · ${nameOf(alert.patientId)}`,
        alert.detail.slice(0, 140),
      );
    }
  }

  if (role === "gestante") {
    const prevSuppIds = new Set(prev.supplements.map((s) => s.id));
    const newSupplements = next.supplements.filter((s) => !prevSuppIds.has(s.id));
    for (const supp of newSupplements.slice(0, 2)) {
      const times = Math.max(1, Math.min(6, Math.round(supp.timesPerDay ?? 1)));
      await presentNow(
        notifications,
        "Tienes un medicamento nuevo",
        `Tu obstetra te asignó ${supp.name}: ${
          times === 1 ? "1 vez al día" : `${times} veces al día`
        }. Márcalo cada día en Pastillas.`,
      );
    }

    const prevAppointments = new Map(prev.appointments.map((a) => [a.id, a]));
    for (const appt of next.appointments) {
      const before = prevAppointments.get(appt.id);
      if (before && (before.dateKey !== appt.dateKey || before.time !== appt.time)) {
        await presentNow(
          notifications,
          "Tu cita cambió de fecha",
          `Ahora es el ${fechaLarga(appt.dateKey)} a las ${appt.time}.`,
        );
      } else if (!before && (appt.estado === "programada" || appt.estado === "confirmada")) {
        await presentNow(
          notifications,
          "Tienes una cita nueva",
          `${fechaLarga(appt.dateKey)} a las ${appt.time} · ${appt.motivo}`,
        );
      }
    }
  }
}

interface NextAppointmentInfo {
  dateKey: string;
  time: string;
}

/**
 * Reprograma todos los recordatorios según la configuración actual.
 * - Toma diaria a la hora elegida.
 * - Cita: aviso el día anterior a las 18:00 (si aún está en el futuro).
 */
export async function syncReminders(
  settings: ReminderSettings,
  nextAppointment: NextAppointmentInfo | null,
): Promise<void> {
  const notifications = getNotifications();
  if (!notifications) return;
  await notifications.cancelAllScheduledNotificationsAsync();

  if (settings.tomas) {
    await notifications.scheduleNotificationAsync({
      content: {
        title: "Tus pastillas de hoy",
        body: "¿Ya marcaste todas tus tomas de hoy? Ábrelo en VitMaterna.",
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hora,
        minute: 0,
        channelId: Platform.OS === "android" ? "recordatorios" : undefined,
      },
    });
  }

  if (settings.citas && nextAppointment) {
    const when = dateFromKey(nextAppointment.dateKey);
    when.setDate(when.getDate() - 1);
    when.setHours(18, 0, 0, 0);
    if (when.getTime() > Date.now()) {
      await notifications.scheduleNotificationAsync({
        content: {
          title: "Tu control prenatal es mañana",
          body: `Te esperamos mañana a las ${nextAppointment.time}. No faltes, tu salud y la de tu bebé son primero.`,
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: Platform.OS === "android" ? "recordatorios" : undefined,
        },
      });
    }
  }
}
