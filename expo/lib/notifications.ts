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
import { dateFromKey } from "@/lib/format";

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
        title: "Tu tratamiento de hoy",
        body: "¿Ya tomaste tu hierro y ácido fólico? Márcalo en VitMaterna.",
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
