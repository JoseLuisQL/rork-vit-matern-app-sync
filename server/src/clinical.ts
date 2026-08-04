/**
 * VITMATERNA — Motor clínico del servidor.
 * Todos los cálculos se hacen aquí (no en el teléfono): edad gestacional,
 * FPP por Naegele, corrección de hemoglobina por altitud (norma MINSA),
 * clasificación de anemia y semáforo de riesgo.
 *
 * Las fechas clínicas se manejan como claves de día locales de Perú
 * (YYYY-MM-DD, UTC-5 fijo, Lima no tiene horario de verano).
 */
import type { AnemiaClass, Patient, RiskLevel } from "./types";

/** Altitud del Centro de Salud Talavera (Andahuaylas). */
export const ALTITUDE_MSNM = 2926;

/** Factor de corrección MINSA de hemoglobina a 2 926 msnm (g/dL). */
export const HB_CORRECTION_FACTOR = -1.8;

/** Esquema MINSA: semanas objetivo de los 8 controles prenatales. */
export const MINSA_WEEKS = [12, 18, 23, 27, 31, 34, 37, 39] as const;

/** Horarios de atención de la agenda (08:00–16:30, cada 30 min). */
export const AGENDA_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 16; h++) {
    out.push(`${`${h}`.padStart(2, "0")}:00`);
    out.push(`${`${h}`.padStart(2, "0")}:30`);
  }
  return out;
})();

const PERU_OFFSET_MS = -5 * 3600000;

function pad(n: number): string {
  return `${n}`.padStart(2, "0");
}

/** Clave de día local Perú (YYYY-MM-DD) para un instante dado. */
export function peruDayKey(at: Date = new Date()): string {
  const p = new Date(at.getTime() + PERU_OFFSET_MS);
  return `${p.getUTCFullYear()}-${pad(p.getUTCMonth() + 1)}-${pad(p.getUTCDate())}`;
}

/** Hora local Perú HH:MM para un instante dado. */
export function peruTime(at: Date = new Date()): string {
  const p = new Date(at.getTime() + PERU_OFFSET_MS);
  return `${pad(p.getUTCHours())}:${pad(p.getUTCMinutes())}`;
}

/** Parse de una clave YYYY-MM-DD a Date UTC-medianoche (solo para aritmética). */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map((s) => parseInt(s, 10));
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

export function keyFromUTCDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDaysToKey(key: string, days: number): string {
  const d = dateFromKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return keyFromUTCDate(d);
}

/** Diferencia a − b en días completos. */
export function diffDaysKeys(a: string, b: string): number {
  return Math.round((dateFromKey(a).getTime() - dateFromKey(b).getTime()) / 86400000);
}

/** Clave de día válida: formato YYYY-MM-DD y fecha real del calendario. */
export function isValidDayKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return keyFromUTCDate(dateFromKey(key)) === key;
}

/** Semanas completas de gestación desde la FUM (0–42). */
export function gestationalWeeks(fumKey: string, todayKey: string): number {
  const diff = diffDaysKeys(todayKey, fumKey);
  if (diff < 0) return 0;
  return Math.min(42, Math.floor(diff / 7));
}

/** Días dentro de la semana actual (p.ej. semana 26 + 3 días). */
export function gestationalDays(fumKey: string, todayKey: string): number {
  const diff = diffDaysKeys(todayKey, fumKey);
  if (diff < 0) return 0;
  return diff % 7;
}

/** FPP por regla de Naegele: FUM + 7 días − 3 meses + 1 año. */
export function fppKeyFromFum(fumKey: string): string {
  const base = dateFromKey(fumKey);
  base.setUTCDate(base.getUTCDate() + 7);
  const fpp = new Date(Date.UTC(base.getUTCFullYear() + 1, base.getUTCMonth() - 3, base.getUTCDate()));
  return keyFromUTCDate(fpp);
}

export function trimester(weeks: number): 1 | 2 | 3 {
  if (weeks <= 13) return 1;
  if (weeks <= 27) return 2;
  return 3;
}

/** Hb corregida por altitud (el factor es negativo). */
export function correctedHb(observed: number): number {
  return Math.round((observed + HB_CORRECTION_FACTOR) * 10) / 10;
}

/** Clasificación de anemia sobre la Hb corregida. */
export function anemiaClass(hbCorrected: number): AnemiaClass {
  if (hbCorrected >= 11) return "normal";
  if (hbCorrected >= 10) return "leve";
  if (hbCorrected >= 7) return "moderada";
  return "severa";
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  factors: string[];
}

/**
 * Semáforo de riesgo obstétrico:
 * score ≥ 4 → rojo · ≥ 2 → amarillo · resto → verde.
 */
export function assessRisk(p: Patient): RiskAssessment {
  let score = 0;
  const factors: string[] = [];
  const add = (points: number, label: string) => {
    score += points;
    factors.push(label);
  };

  if (p.age < 15 || p.age > 40) add(3, `Edad de alto riesgo (${p.age} años)`);
  else if (p.age < 18 || p.age > 35) add(2, `Edad de riesgo (${p.age} años)`);

  if (p.imc < 18.5) add(2, `Bajo peso (IMC ${p.imc})`);
  else if (p.imc >= 35) add(3, `Obesidad II (IMC ${p.imc})`);
  else if (p.imc >= 30) add(2, `Obesidad (IMC ${p.imc})`);

  const anemia = anemiaClass(correctedHb(p.hbObserved));
  if (anemia === "severa") add(4, "Anemia severa");
  else if (anemia === "moderada") add(2, "Anemia moderada");
  else if (anemia === "leve") add(1, "Anemia leve");

  if (p.bpSys >= 160 || p.bpDia >= 110) add(4, `Presión muy alta (${p.bpSys}/${p.bpDia})`);
  else if (p.bpSys >= 140 || p.bpDia >= 90) add(3, `Presión alta (${p.bpSys}/${p.bpDia})`);

  if (p.cesareas >= 2) add(3, `${p.cesareas} cesáreas previas`);
  else if (p.cesareas === 1) add(1, "1 cesárea previa");

  if (p.abortos >= 3) add(3, "Aborto habitual");
  if (p.obitoFetal) add(3, "Óbito fetal previo");
  if (p.gestas > 5) add(2, `Gran multigesta (G${p.gestas})`);
  if (p.rhSensibilizado) add(3, "Rh sensibilizado");

  p.antecedentes.forEach((a) => add(3, a));

  const level: RiskLevel = score >= 4 ? "rojo" : score >= 2 ? "amarillo" : "verde";
  return { score, level, factors };
}
