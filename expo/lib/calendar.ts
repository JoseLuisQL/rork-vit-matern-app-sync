/**
 * VITMATERNA — Utilidades de cálculo para el Calendario Clínico.
 * Manejo determinista de cuadrículas de mes (Lunes-Domingo), límites de fechas,
 * atajos clínicos para FUM y formato en español.
 */
import { addDaysToKey, dateFromKey, dayKey, todayKeyLocal } from "@/lib/format";
import { fppKeyLocal, weeksLocal } from "@/lib/optimistic";

export const CALENDAR_MONTHS_FULL = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const CALENDAR_MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Oct",
  "Nov",
  "Dic",
] as const;

export const CALENDAR_DOW_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export interface CalendarDayCell {
  dayNumber: number;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

/**
 * Genera la cuadrícula de 35 o 42 días para un mes dado empezando en Lunes (0).
 */
export function generateMonthGrid(
  year: number,
  month: number, // 0 = Enero, 11 = Diciembre
  selectedKey: string | null,
  todayKey: string = todayKeyLocal(),
  minDate?: string,
  maxDate?: string,
): CalendarDayCell[] {
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Lun...
  // Ajuste para Lunes = 0, ..., Domingo = 6
  const startOffset = (firstDayOfWeek + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarDayCell[] = [];

  // Días del mes anterior
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const key = dayKey(prevMonthDate);
    cells.push({
      dayNumber: d,
      dateKey: key,
      isCurrentMonth: false,
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      isDisabled: (minDate ? key < minDate : false) || (maxDate ? key > maxDate : false),
    });
  }

  // Días del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const key = dayKey(curDate);
    cells.push({
      dayNumber: d,
      dateKey: key,
      isCurrentMonth: true,
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      isDisabled: (minDate ? key < minDate : false) || (maxDate ? key > maxDate : false),
    });
  }

  // Días del siguiente mes para completar semanas (múltiplo de 7)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const key = dayKey(nextMonthDate);
    cells.push({
      dayNumber: d,
      dateKey: key,
      isCurrentMonth: false,
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      isDisabled: (minDate ? key < minDate : false) || (maxDate ? key > maxDate : false),
    });
  }

  return cells;
}

export interface FumCalculations {
  weeks: number;
  extraDays: number;
  fpp: string;
  trimester: "1er trimestre" | "2do trimestre" | "3er trimestre";
}

/**
 * Calcula edad gestacional detallada (semanas + días), trimestre y FPP estimada.
 */
export function calculateFumPreview(
  fumKey: string | null | undefined,
  todayKey: string = todayKeyLocal(),
): FumCalculations | null {
  if (!fumKey || !/^\d{4}-\d{2}-\d{2}$/.test(fumKey)) {
    return null;
  }
  const diffDays = Math.round(
    (dateFromKey(todayKey).getTime() - dateFromKey(fumKey).getTime()) / 86400000,
  );
  if (diffDays < 0) return null;

  const weeks = Math.min(42, Math.floor(diffDays / 7));
  const extraDays = diffDays % 7;
  const fpp = fppKeyLocal(fumKey);
  const trimester =
    weeks < 14 ? "1er trimestre" : weeks < 28 ? "2do trimestre" : "3er trimestre";

  return {
    weeks,
    extraDays,
    fpp,
    trimester,
  };
}

export interface CalendarPreset {
  label: string;
  key: string;
}

/**
 * Genera atajos rápidos según si es FUM o fecha estándar.
 */
export function getCalendarPresets(
  isFum: boolean,
  todayKey: string = todayKeyLocal(),
  minDate?: string,
  maxDate?: string,
): CalendarPreset[] {
  const list: CalendarPreset[] = isFum
    ? [
        { label: "Hoy", key: todayKey },
        { label: "Hace 1 m", key: addDaysToKey(todayKey, -30) },
        { label: "Hace 2 m", key: addDaysToKey(todayKey, -60) },
        { label: "Hace 3 m", key: addDaysToKey(todayKey, -90) },
        { label: "Hace 6 m", key: addDaysToKey(todayKey, -180) },
      ]
    : [
        { label: "Hoy", key: todayKey },
        { label: "Ayer", key: addDaysToKey(todayKey, -1) },
        { label: "Mañana", key: addDaysToKey(todayKey, 1) },
        { label: "+7 días", key: addDaysToKey(todayKey, 7) },
      ];

  return list.filter((p) => {
    if (minDate && p.key < minDate) return false;
    if (maxDate && p.key > maxDate) return false;
    return true;
  });
}
