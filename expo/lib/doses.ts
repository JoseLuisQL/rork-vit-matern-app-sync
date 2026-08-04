/**
 * Ayudas de tomas diarias: cuántas veces al día se toma cada medicamento y
 * cuántas tomas van marcadas. Espeja las reglas del servidor para que la
 * vista optimista y las pantallas calculen igual que el motor clínico.
 */
import type { Supplement } from "@/types";

export const MAX_TIMES_PER_DAY = 6;

/** Tomas por día de un medicamento (1–6; registros antiguos valen 1). */
export function timesPerDayOf(s: Supplement): number {
  return Math.max(1, Math.min(MAX_TIMES_PER_DAY, Math.round(s.timesPerDay ?? 1)));
}

/** El medicamento solo se espera desde el día en que fue asignado. */
export function isSupplementActiveOn(s: Supplement, dayKey: string): boolean {
  return !s.startKey || s.startKey <= dayKey;
}

/** Cuántas tomas de este medicamento hay marcadas en el día. */
export function countDoses(dayLogs: string[] | undefined, supplementId: string): number {
  if (!dayLogs) return 0;
  let n = 0;
  for (const id of dayLogs) if (id === supplementId) n += 1;
  return n;
}

/** Totales del día: tomas esperadas y marcadas (avance, celebración, puntos). */
export function dayDoseTotals(
  supplements: Supplement[],
  dayLogs: string[] | undefined,
  dayKey: string,
): { taken: number; total: number } {
  let taken = 0;
  let total = 0;
  for (const s of supplements) {
    if (!isSupplementActiveOn(s, dayKey)) continue;
    const times = timesPerDayOf(s);
    total += times;
    taken += Math.min(countDoses(dayLogs, s.id), times);
  }
  return { taken, total };
}

/** Frecuencia en palabras: "1 vez al día", "2 veces al día"… */
export function timesLabel(times: number): string {
  return times === 1 ? "1 vez al día" : `${times} veces al día`;
}

/** Nombre amigable de cada toma según su posición (mañana/tarde/noche). */
export function doseName(index: number, times: number): string {
  if (times === 2) return index === 0 ? "Toma de la mañana" : "Toma de la noche";
  if (times === 3) {
    const names = ["Toma de la mañana", "Toma de la tarde", "Toma de la noche"] as const;
    return names[index] ?? `Toma ${index + 1}`;
  }
  return `Toma ${index + 1} de ${times}`;
}
