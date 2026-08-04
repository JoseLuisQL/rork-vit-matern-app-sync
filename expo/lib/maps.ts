/**
 * Apertura profesional de ubicaciones GPS: intenta la app de mapas del
 * teléfono (Apple Maps / Google Maps) con el punto marcado y su nombre, y si
 * no se puede cae a Google Maps en el navegador. También resuelve la
 * ubicación de un mensaje SOS/alarma: usa las coordenadas del propio mensaje
 * o, para avisos antiguos guardados sin coordenadas, las de su alerta
 * correspondiente (misma paciente, mismo tipo y hora cercana).
 */
import { Linking, Platform } from "react-native";
import type { Alert, Message } from "@/types";

/** Enlace universal de Google Maps (funciona en web y como respaldo). */
export function gpsWebUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;
}

/** "-13.65470, -73.42880" — coordenadas legibles para mostrar en la interfaz. */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Abre el punto en la app de mapas nativa con el pin y su etiqueta
 * (ej. "SOS de María"); si el teléfono no puede, abre Google Maps web.
 */
export async function openInMaps(lat: number, lng: number, label = "Ubicación"): Promise<void> {
  const web = gpsWebUrl(lat, lng);
  if (Platform.OS === "web") {
    Linking.openURL(web).catch((e) => console.log("[VitMaterna] mapa web:", e));
    return;
  }
  const encoded = encodeURIComponent(label);
  const native =
    Platform.OS === "ios"
      ? `maps:0,0?q=${encoded}@${lat},${lng}`
      : `geo:0,0?q=${lat},${lng}(${encoded})`;
  try {
    const canOpen = await Linking.canOpenURL(native);
    await Linking.openURL(canOpen ? native : web);
  } catch (e) {
    console.log("[VitMaterna] mapa nativo, usando respaldo web:", e);
    Linking.openURL(web).catch(() => {});
  }
}

/** Tolerancia para emparejar un aviso antiguo con su alerta (misma acción). */
const MATCH_WINDOW_MS = 5 * 60_000;

/**
 * Coordenadas de un mensaje de emergencia/alarma. Prefiere las del propio
 * mensaje; si no las trae (avisos previos a esta función), busca la alerta
 * generada por la misma acción: primero por id correlacionado y luego por
 * tipo + paciente + hora cercana.
 */
export function messageLocation(
  msg: Message,
  alerts: Alert[] | undefined,
): { lat: number; lng: number } | null {
  if (msg.lat != null && msg.lng != null) return { lat: msg.lat, lng: msg.lng };
  if (msg.kind !== "emergencia" && msg.kind !== "alarma") return null;
  const raw = msg.id.startsWith("m-") ? msg.id.slice(2) : msg.id;
  const wantedType = msg.kind === "emergencia" ? "emergencia" : "alarma";
  const byId = alerts?.find((a) => a.id === `al-sos-${raw}` || a.id === `al-alarma-${raw}`);
  const candidate =
    byId ??
    alerts?.find(
      (a) =>
        a.type === wantedType &&
        a.patientId === msg.convId &&
        a.lat != null &&
        a.lng != null &&
        Math.abs(Date.parse(a.atISO) - Date.parse(msg.atISO)) <= MATCH_WINDOW_MS,
    );
  return candidate?.lat != null && candidate?.lng != null
    ? { lat: candidate.lat, lng: candidate.lng }
    : null;
}
