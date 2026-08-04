/**
 * VITMATERNA — Sonidos diferenciados dentro de la app.
 *
 * Tres sonidos cortos hechos a medida (en assets/sounds):
 * - "mensaje": pop cálido cuando llega un mensaje del chat.
 * - "aviso":   campanita para avisos del sistema (citas, medicamentos).
 * - "sos":     tono urgente cuando entra una emergencia o signo de alarma.
 *
 * Suenan solo con la app abierta (primer plano). Cuando la app está en
 * segundo plano suena la notificación nativa del teléfono, que usa estos
 * mismos archivos por canal en la app instalada (ver lib/notifications.ts).
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { AppState, Platform } from "react-native";
import type { Message, Snapshot } from "@/types";

export type AppSound = "mensaje" | "aviso" | "sos";

/* eslint-disable @typescript-eslint/no-require-imports */
const SOURCES: Record<AppSound, number> = {
  mensaje: require("../assets/sounds/mensaje.wav") as number,
  aviso: require("../assets/sounds/aviso.wav") as number,
  sos: require("../assets/sounds/sos.wav") as number,
};
/* eslint-enable @typescript-eslint/no-require-imports */

const VOLUMES: Record<AppSound, number> = { mensaje: 0.85, aviso: 0.9, sos: 1 };

const players: Partial<Record<AppSound, AudioPlayer>> = {};
let audioModeSet = false;

/** Sonidos cortos que se mezclan con otra música sin interrumpirla. */
function ensureAudioMode(): void {
  if (audioModeSet) return;
  audioModeSet = true;
  setAudioModeAsync({
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    interruptionMode: "mixWithOthers",
    interruptionModeAndroid: "duckOthers",
  }).catch((e) => console.log("[VitMaterna] modo de audio:", e));
}

/**
 * Reproduce un sonido corto de la app. Solo suena con la app en primer
 * plano; en segundo plano el sonido lo pone la notificación nativa.
 */
export function playAppSound(kind: AppSound): void {
  if (AppState.currentState !== "active") return;
  try {
    ensureAudioMode();
    let player = players[kind];
    if (!player) {
      player = createAudioPlayer(SOURCES[kind]);
      player.volume = VOLUMES[kind];
      players[kind] = player;
    }
    player.seekTo(0).catch(() => {});
    player.play();
  } catch (e) {
    console.log("[VitMaterna] sonido:", e);
  }
  if (kind === "sos" && Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }
}

/**
 * Compara el snapshot anterior con el nuevo y reproduce el sonido que
 * corresponde a lo que acaba de llegar. Para no saturar, suena solo el
 * más importante por sincronización: SOS > mensaje > aviso del sistema.
 */
export function playSnapshotSounds(prev: Snapshot | null, next: Snapshot): void {
  if (!prev) return;
  const role = next.me.role;
  if (role === "admin") return;

  const prevMessageIds = new Set(prev.messages.map((m) => m.id));
  const unreadByMe = (m: Message): boolean =>
    role === "gestante" ? !m.readByGestante : !m.readByObstetra;
  const hasFreshMessage = next.messages.some(
    (m) => !prevMessageIds.has(m.id) && m.sender !== role && unreadByMe(m),
  );

  let hasSos = false;
  if (role === "obstetra") {
    const prevAlertIds = new Set(prev.alerts.map((a) => a.id));
    hasSos = next.alerts.some(
      (a) =>
        !prevAlertIds.has(a.id) &&
        a.status === "abierta" &&
        (a.type === "emergencia" || a.type === "alarma"),
    );
  }

  let hasAviso = false;
  if (role === "gestante") {
    const prevSuppIds = new Set(prev.supplements.map((s) => s.id));
    hasAviso = next.supplements.some((s) => !prevSuppIds.has(s.id));
    if (!hasAviso) {
      const prevAppointments = new Map(prev.appointments.map((a) => [a.id, a]));
      hasAviso = next.appointments.some((a) => {
        const before = prevAppointments.get(a.id);
        if (before) return before.dateKey !== a.dateKey || before.time !== a.time;
        return a.estado === "programada" || a.estado === "confirmada";
      });
    }
  }

  if (hasSos) playAppSound("sos");
  else if (hasFreshMessage) playAppSound("mensaje");
  else if (hasAviso) playAppSound("aviso");
}
