import { describe, expect, it } from "bun:test";
import {
  addDaysToKey,
  capitalize,
  dateFromKey,
  dayKey,
  diaCorto,
  etiquetaRelativa,
  fechaCompleta,
  fechaCorta,
  fechaLarga,
  horaAmigable,
  horaDeISO,
  tiempoRelativo,
  todayKeyLocal,
  ultimaConexion,
} from "./format";

describe("Frontend Format Utilities — Dates & Spanish Formatting", () => {
  it("capitalizes words properly", () => {
    expect(capitalize("gestante")).toBe("Gestante");
    expect(capitalize("")).toBe("");
    expect(capitalize("a")).toBe("A");
  });

  it("parses date keys correctly without UTC offset drift", () => {
    const d = dateFromKey("2026-08-16");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // August
    expect(d.getDate()).toBe(16);
  });

  it("converts Date object to day key format YYYY-MM-DD", () => {
    const d = new Date(2026, 7, 16);
    expect(dayKey(d)).toBe("2026-08-16");
  });

  it("adds days to a day key", () => {
    expect(addDaysToKey("2026-08-16", 5)).toBe("2026-08-21");
    expect(addDaysToKey("2026-08-16", -1)).toBe("2026-08-15");
  });

  it("formats long date in Spanish: fechaLarga", () => {
    // 2026-08-16 was Sunday (domingo)
    const formatted = fechaLarga("2026-08-16");
    expect(formatted).toBe("domingo 16 de agosto");
  });

  it("formats short date: fechaCorta", () => {
    expect(fechaCorta("2026-08-16")).toBe("16 ago");
    expect(fechaCorta("2026-01-05")).toBe("5 ene");
  });

  it("formats full date: fechaCompleta", () => {
    expect(fechaCompleta("2026-08-16")).toBe("16 de agosto de 2026");
  });

  it("formats day selector label: diaCorto", () => {
    // 2026-08-16 is Sunday -> "Dom 16"
    expect(diaCorto("2026-08-16")).toBe("Dom 16");
  });

  it("calculates relative labels correctly: etiquetaRelativa", () => {
    const today = "2026-08-16";
    expect(etiquetaRelativa("2026-08-16", today)).toBe("Hoy");
    expect(etiquetaRelativa("2026-08-17", today)).toBe("Mañana");
    expect(etiquetaRelativa("2026-08-15", today)).toBe("Ayer");
    expect(etiquetaRelativa("2026-08-20", today)).toBe("En 4 días");
    expect(etiquetaRelativa("2026-09-10", today)).toBe("10 sep");
  });
});

describe("Frontend Format Utilities — Time & Natural Language", () => {
  it("formats 24h time to friendly Spanish time: horaAmigable", () => {
    expect(horaAmigable("08:30")).toBe("8:30 de la mañana");
    expect(horaAmigable("14:00")).toBe("2:00 de la tarde");
    expect(horaAmigable("20:15")).toBe("8:15 de la noche");
  });

  it("extracts HH:MM from ISO string: horaDeISO", () => {
    const date = new Date(2026, 7, 16, 14, 25);
    expect(horaDeISO(date.toISOString())).toBe("14:25");
  });

  it("handles empty / invalid inputs gracefully", () => {
    expect(fechaLarga("invalid")).toBe("Fecha por definir");
    expect(fechaCorta("invalid")).toBe("--");
    expect(fechaCompleta("invalid")).toBe("--");
    expect(horaDeISO("invalid")).toBe("--:--");
    expect(ultimaConexion(null)).toBe("Sin conexión reciente");
  });
});
