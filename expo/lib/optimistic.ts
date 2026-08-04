/**
 * Espejo mínimo del motor clínico del servidor, SOLO para la vista optimista
 * (mientras una actualización de ficha viaja o espera señal). El servidor
 * sigue siendo la única fuente de verdad: su snapshot reemplaza estos valores
 * en la siguiente sincronización.
 */
import { dateFromKey, dayKey } from "@/lib/format";
import type { AnemiaClass } from "@/types";

/** Hb corregida por altitud usando el factor que reporta el servidor. */
export function correctedHbLocal(observed: number, hbFactor: number): number {
  return Math.round((observed + hbFactor) * 10) / 10;
}

/** Clasificación de anemia sobre la Hb corregida (norma MINSA). */
export function anemiaClassLocal(hbCorrected: number): AnemiaClass {
  if (hbCorrected >= 11) return "normal";
  if (hbCorrected >= 10) return "leve";
  if (hbCorrected >= 7) return "moderada";
  return "severa";
}

/** Semanas completas de gestación desde la FUM (0–42). */
export function weeksLocal(fumKey: string, todayKey: string): number {
  const diff = Math.round(
    (dateFromKey(todayKey).getTime() - dateFromKey(fumKey).getTime()) / 86400000,
  );
  if (diff < 0) return 0;
  return Math.min(42, Math.floor(diff / 7));
}

/** FPP por regla de Naegele: FUM + 7 días − 3 meses + 1 año. */
export function fppKeyLocal(fumKey: string): string {
  const base = dateFromKey(fumKey);
  base.setDate(base.getDate() + 7);
  const fpp = new Date(base.getFullYear() + 1, base.getMonth() - 3, base.getDate());
  return dayKey(fpp);
}
