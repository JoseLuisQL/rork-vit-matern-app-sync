/**
 * Formato de fechas en español (determinista en todos los motores JS).
 * Acepta tanto claves de día "YYYY-MM-DD" (fechas clínicas del servidor)
 * como timestamps ISO completos.
 */

const DAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse local de una clave YYYY-MM-DD (sin corrimiento UTC). */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map((s) => parseInt(s, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function asDate(isoOrKey: string): Date {
  return KEY_RE.test(isoOrKey) ? dateFromKey(isoOrKey) : new Date(isoOrKey);
}

export function capitalize(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** "lunes 4 de agosto" */
export function fechaLarga(isoOrKey: string): string {
  const d = asDate(isoOrKey);
  if (isNaN(d.getTime())) return "Fecha por definir";
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** "4 ago" */
export function fechaCorta(isoOrKey: string): string {
  const d = asDate(isoOrKey);
  if (isNaN(d.getTime())) return "--";
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "4 de agosto de 2026" */
export function fechaCompleta(isoOrKey: string): string {
  const d = asDate(isoOrKey);
  if (isNaN(d.getTime())) return "--";
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "Lun 4" (para selectores de día). */
export function diaCorto(key: string): string {
  const d = dateFromKey(key);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()}`;
}

/** Clave de día local YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKeyLocal(): string {
  return dayKey(new Date());
}

export function addDaysToKey(key: string, days: number): string {
  const d = dateFromKey(key);
  d.setDate(d.getDate() + days);
  return dayKey(d);
}

/** Etiqueta relativa contra una clave de hoy: Hoy / Mañana / "En 5 días" / fecha corta. */
export function etiquetaRelativa(targetKey: string, todayKey: string): string {
  const key = KEY_RE.test(targetKey) ? targetKey : dayKey(new Date(targetKey));
  const diff = Math.round(
    (dateFromKey(key).getTime() - dateFromKey(todayKey).getTime()) / 86400000,
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff > 1 && diff <= 14) return `En ${diff} días`;
  if (diff === -1) return "Ayer";
  return fechaCorta(key);
}

/** "09:00" → "9:00 de la mañana" (hora en palabras, lectura fácil). */
export function horaAmigable(time: string): string {
  const h = parseInt(time.slice(0, 2), 10);
  if (isNaN(h)) return time;
  const min = time.slice(3, 5) || "00";
  const suffix = h < 12 ? "de la mañana" : h < 19 ? "de la tarde" : "de la noche";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${suffix}`;
}

/** "09:24" a partir de un ISO completo. */
export function horaDeISO(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  return `${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
}

/**
 * Última conexión estilo WhatsApp: "Últ. vez hoy a las 14:05",
 * "Últ. vez ayer a las 20:12" o "Últ. vez el 2 ago".
 */
export function ultimaConexion(iso: string | null | undefined): string {
  if (!iso) return "Sin conexión reciente";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Sin conexión reciente";
  const key = dayKey(d);
  const hoy = todayKeyLocal();
  if (key === hoy) return `Últ. vez hoy a las ${horaDeISO(iso)}`;
  if (key === addDaysToKey(hoy, -1)) return `Últ. vez ayer a las ${horaDeISO(iso)}`;
  return `Últ. vez el ${fechaCorta(iso)}`;
}

/** "hace 2 h" / "hace 5 min" / hora si es de hoy / fecha corta. */
export function tiempoRelativo(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 12) return `hace ${hours} h`;
  if (dayKey(d) === todayKeyLocal()) return horaDeISO(iso);
  return fechaCorta(iso);
}

