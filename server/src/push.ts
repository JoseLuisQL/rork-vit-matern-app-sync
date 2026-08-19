/**
 * VITMATERNA — Despachador de notificaciones Push remotas (Expo Push Service / FCM).
 * Permite despertar dispositivos Android en segundo plano o con la app cerrada
 * para mensajes de chat, emergencias SOS, alertas y avisos de citas/medicamentos.
 */
import type { Queryable } from "./db";

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | string | null;
  channelId?: "mensajes" | "avisos" | "emergencias" | "recordatorios" | string;
  priority?: "default" | "normal" | "high";
  badge?: number;
  _displayInForeground?: boolean;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Envía un lote de notificaciones a través de los servidores de Expo Push.
 * Divide los envíos en bloques de hasta 100 mensajes.
 */
export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (!messages || messages.length === 0) return;

  const validMessages = messages.filter((m) => typeof m.to === "string" && m.to.trim().length > 0);
  if (validMessages.length === 0) return;

  // Lotes de 100 mensajes máximo por petición
  const CHUNK_SIZE = 100;
  for (let i = 0; i < validMessages.length; i += CHUNK_SIZE) {
    const chunk = validMessages.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn(`[Push] Expo Push API respondió HTTP ${res.status}: ${text}`);
      }
    } catch (err) {
      console.error("[Push] Error enviando notificaciones push a Expo:", err);
    }
  }
}

/**
 * Obtiene los tokens push activos asociados a una lista de DNIs.
 */
export async function getPushTokensForDnis(
  db: Queryable,
  dnis: string[],
): Promise<{ dni: string; token: string; platform: string }[]> {
  if (dnis.length === 0) return [];
  const res = await db.query<{ dni: string; token: string; platform: string }>(
    "SELECT dni, token, platform FROM push_tokens WHERE dni = ANY($1::text[])",
    [dnis],
  );
  return res.rows;
}

/**
 * Notifica a un usuario por su DNI.
 */
export async function notifyUserByDni(
  db: Queryable,
  dni: string,
  payload: Omit<ExpoPushMessage, "to">,
): Promise<void> {
  if (!dni) return;
  const tokens = await getPushTokensForDnis(db, [dni]);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    sound: payload.sound ?? "default",
    channelId: payload.channelId ?? "avisos",
    priority: payload.priority ?? "high",
    data: payload.data,
    badge: payload.badge,
    _displayInForeground: payload._displayInForeground,
  }));

  await sendExpoPush(messages);
}

/**
 * Notifica a una paciente a través de su patientId (resuelve DNI de paciente y usuario).
 */
export async function notifyPatientByPatientId(
  db: Queryable,
  patientId: string,
  payload: Omit<ExpoPushMessage, "to">,
): Promise<void> {
  if (!patientId) return;
  const res = await db.query<{ dni: string }>(
    "SELECT dni FROM patients WHERE id = $1 UNION SELECT dni FROM users WHERE patient_id = $1",
    [patientId],
  );
  const dnis = res.rows.map((r) => r.dni);
  if (dnis.length === 0) return;

  const tokens = await getPushTokensForDnis(db, dnis);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    sound: payload.sound ?? "default",
    channelId: payload.channelId ?? "avisos",
    priority: payload.priority ?? "high",
    data: payload.data,
  }));

  await sendExpoPush(messages);
}

/**
 * Notifica a todos los obstetras activos del establecimiento.
 * Si se especifica `excludeDni`, ese DNI no recibirá la notificación (ej. el obstetra que originó el mensaje).
 */
export async function notifyActiveObstetras(
  db: Queryable,
  payload: Omit<ExpoPushMessage, "to">,
  excludeDni?: string,
): Promise<void> {
  const res = await db.query<{ dni: string }>(
    "SELECT dni FROM users WHERE role = 'obstetra' AND active = TRUE AND ($1::text IS NULL OR dni <> $1)",
    [excludeDni ?? null],
  );
  const dnis = res.rows.map((r) => r.dni);
  if (dnis.length === 0) return;

  const tokens = await getPushTokensForDnis(db, dnis);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    sound: payload.sound ?? "default",
    channelId: payload.channelId ?? "mensajes",
    priority: payload.priority ?? "high",
    data: payload.data,
  }));

  await sendExpoPush(messages);
}
