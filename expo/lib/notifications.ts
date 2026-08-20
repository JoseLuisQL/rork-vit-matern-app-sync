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
import { api } from "@/lib/api";
import { dateFromKey, fechaLarga } from "@/lib/format";
import { areSoundsEnabled } from "@/lib/sounds";
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

let cachedPushToken: string | null = null;

/**
 * Disponibilidad de recordatorios locales en este entorno.
 * En web no hay soporte y en Expo Go para Android el módulo fue retirado.
 */
export const REMINDERS_SUPPORTED: boolean =
  Platform.OS !== "web" && !(Platform.OS === "android" && isExpoGo);

/**
 * Tipos de aviso con sonido y canal propios:
 * - "mensaje": mensajes del chat (pop cálido).
 * - "aviso":   avisos del sistema — citas, medicamentos, recordatorios (campanita).
 * - "sos":     emergencias y signos de alarma (tono urgente).
 */
export type NotificationKind = "mensaje" | "aviso" | "sos";

const ANDROID_CHANNEL: Record<NotificationKind, string> = {
  mensaje: "mensajes",
  aviso: "avisos",
  sos: "emergencias",
};

const SOUND_FILE: Record<NotificationKind, string> = {
  mensaje: "mensaje.wav",
  aviso: "aviso.wav",
  sos: "sos.wav",
};

/**
 * Sonido nativo por tipo de aviso. Expo Go no incluye archivos de sonido
 * personalizados (usa el del sistema); en la app instalada suenan los
 * archivos a medida declarados en app.json (assets/sounds). Si la usuaria
 * apagó los sonidos personalizados en su perfil, se usa el sonido estándar
 * del teléfono (en Android instalado, el canal conserva su sonido propio
 * porque el sistema no permite cambiarlo después de crearlo).
 */
function nativeSound(kind: NotificationKind): string {
  return isExpoGo || !areSoundsEnabled() ? "default" : SOUND_FILE[kind];
}

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
    handleNotification: async (notification) => ({
      shouldShowBanner: true,
      shouldShowList: true,
      // Con la app abierta, los avisos en vivo suenan dentro de la app con su
      // sonido diferenciado (lib/sounds.ts); los recordatorios programados
      // sí usan su sonido nativo porque no pasan por la sincronización.
      shouldPlaySound: notification.request.content.data?.reminder === true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    const channelSound = (kind: NotificationKind): string | undefined =>
      isExpoGo ? undefined : SOUND_FILE[kind];
    notifications
      .setNotificationChannelAsync("mensajes", {
        name: "Mensajes del chat",
        importance: notifications.AndroidImportance.MAX,
        sound: channelSound("mensaje"),
        vibrationPattern: [0, 200, 120, 200],
      })
      .catch((e) => console.log("[VitMaterna] canal mensajes:", e));
    notifications
      .setNotificationChannelAsync("avisos", {
        name: "Avisos de citas y medicamentos",
        importance: notifications.AndroidImportance.MAX,
        sound: channelSound("aviso"),
      })
      .catch((e) => console.log("[VitMaterna] canal avisos:", e));
    notifications
      .setNotificationChannelAsync("emergencias", {
        name: "Emergencias (SOS)",
        importance: notifications.AndroidImportance.MAX,
        sound: channelSound("sos"),
        vibrationPattern: [0, 400, 150, 400, 150, 600],
        bypassDnd: true,
      })
      .catch((e) => console.log("[VitMaterna] canal emergencias:", e));
    notifications
      .setNotificationChannelAsync("recordatorios", {
        name: "Recordatorios",
        importance: notifications.AndroidImportance.DEFAULT,
        sound: channelSound("aviso"),
      })
      .catch((e) => console.log("[VitMaterna] canal recordatorios:", e));
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

/**
 * Registra el dispositivo en Expo Push Notifications y envía el token al backend.
 * Permite recibir notificaciones con la app cerrada / segundo plano.
 */
export async function registerForPushNotificationsAsync(
  authToken: string,
): Promise<string | null> {
  const notifications = getNotifications();
  if (!notifications || Platform.OS === "web" || isExpoGo) return null;

  try {
    const permission = await notifications.getPermissionsAsync();
    let finalStatus = permission.status;
    if (permission.status !== "granted") {
      const asked = await notifications.requestPermissionsAsync();
      finalStatus = asked.status;
    }

    if (finalStatus !== "granted") {
      console.log("[VitMaterna] Permiso de notificaciones denegado");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      "9c570af3-937c-4d13-a87e-391294f3c3c2";

    const pushTokenData = await notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = pushTokenData.data;
    cachedPushToken = token;

    // Enviar el token al backend asociado al usuario autenticado
    await api("/api/push-token", {
      token: authToken,
      body: { pushToken: token, platform: Platform.OS },
    });

    console.log("[VitMaterna] Push token registrado en servidor:", token);
    return token;
  } catch (error) {
    console.warn("[VitMaterna] Error registrando push token:", error);
    return null;
  }
}

/**
 * Desvincula el Push Token del backend al cerrar sesión.
 */
export async function unregisterPushTokenAsync(authToken: string): Promise<void> {
  if (Platform.OS === "web" || isExpoGo) return;
  try {
    await api("/api/push-token/delete", {
      token: authToken,
      body: { pushToken: cachedPushToken },
    });
    cachedPushToken = null;
  } catch (error) {
    console.warn("[VitMaterna] Error desregistrando push token:", error);
  }
}

/**
 * Escucha cuando el usuario pulsa sobre una notificación nativa
 * recibida en segundo plano para llevarlo a la pantalla correcta.
 */
export function setupNotificationListeners(
  onNavigate: (route: string) => void,
): () => void {
  const notifications = getNotifications();
  if (!notifications || Platform.OS === "web") return () => {};

  const subscription = notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | Record<string, unknown>
      | undefined;
    if (!data) return;

    if (data.kind === "mensaje" && typeof data.convId === "string") {
      onNavigate(`/(obstetra)/chat/${data.convId}`);
    } else if (data.kind === "sos" || data.kind === "alarma") {
      onNavigate("/(obstetra)/(tabs)/alertas");
    } else if (data.kind === "medicamento") {
      onNavigate("/(gestante)/(tabs)/tratamiento");
    } else if (data.kind === "cita") {
      onNavigate("/(obstetra)/(tabs)/agenda");
    }
  });

  return () => {
    subscription.remove();
  };
}

export async function cancelAllReminders(): Promise<void> {
  const notifications = getNotifications();
  if (!notifications) return;
  await notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Presenta una notificación inmediata en la bandeja del teléfono con el
 * sonido y canal que corresponden a su tipo.
 */
async function presentNow(
  notifications: NotificationsModule,
  kind: NotificationKind,
  title: string,
  body: string,
): Promise<void> {
  await notifications.scheduleNotificationAsync({
    content: { title, body, sound: nativeSound(kind) },
    trigger: Platform.OS === "android" ? { channelId: ANDROID_CHANNEL[kind] } : null,
  });
}

/**
 * Compara el snapshot anterior con el nuevo y avisa en la bandeja nativa
 * del teléfono lo que llegó mientras tanto: mensajes nuevos, emergencias y
 * signos de alarma (obstetra) y cambios de cita (gestante).
 * `activeConvId`: conversación abierta en pantalla — sus mensajes no se
 * notifican (ya se están viendo en vivo), igual que WhatsApp.
 */
export async function notifySnapshotDelta(
  prev: Snapshot | null,
  next: Snapshot,
  activeConvId: string | null = null,
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
    (m) =>
      !prevMessageIds.has(m.id) &&
      m.sender !== role &&
      unreadByMe(m) &&
      m.convId !== activeConvId,
  );
  if (freshMessages.length === 1) {
    const m = freshMessages[0];
    await presentNow(
      notifications,
      "mensaje",
      role === "gestante" ? "Mensaje de tu obstetra" : `Mensaje de ${nameOf(m.convId)}`,
      m.text.slice(0, 140),
    );
  } else if (freshMessages.length > 1) {
    await presentNow(
      notifications,
      "mensaje",
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
        "sos",
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
        "aviso",
        "Tienes un medicamento nuevo",
        `Tu obstetra te asignó ${supp.name}: ${
          times === 1 ? "1 vez al día" : `${times} veces al día`
        }. Márcalo cada día en Medicamentos.`,
      );
    }

    const prevAppointments = new Map(prev.appointments.map((a) => [a.id, a]));
    for (const appt of next.appointments) {
      const before = prevAppointments.get(appt.id);
      if (before && (before.dateKey !== appt.dateKey || before.time !== appt.time)) {
        await presentNow(
          notifications,
          "aviso",
          "Tu cita cambió de fecha",
          `Ahora es el ${fechaLarga(appt.dateKey)} a las ${appt.time}.`,
        );
      } else if (!before && (appt.estado === "programada" || appt.estado === "confirmada")) {
        await presentNow(
          notifications,
          "aviso",
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
        title: "Tus medicamentos de hoy",
        body: "¿Ya marcaste todas tus tomas de hoy? Ábrelo en VitMaterna.",
        sound: nativeSound("aviso"),
        data: { reminder: true },
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
          sound: nativeSound("aviso"),
          data: { reminder: true },
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
