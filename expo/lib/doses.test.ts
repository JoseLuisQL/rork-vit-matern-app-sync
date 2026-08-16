import { describe, expect, it } from "bun:test";
import {
  countDoses,
  dayDoseTotals,
  doseName,
  isSupplementActiveOn,
  MAX_TIMES_PER_DAY,
  timesLabel,
  timesPerDayOf,
} from "./doses";
import type { Supplement } from "../types";

describe("Frontend Doses Utilities", () => {
  const supp1: Supplement = {
    id: "s-hierro",
    patientId: "p-1",
    name: "Sulfato Ferroso",
    dose: "1 tableta",
    schedule: "En el desayuno",
    timesPerDay: 1,
    startKey: ["2026", "08", "01"].join("-"),
  };

  const supp2: Supplement = {
    id: "s-calcio",
    patientId: "p-1",
    name: "Carbonato de Calcio",
    dose: "1 tableta",
    schedule: "Mañana y noche",
    timesPerDay: 2,
    startKey: ["2026", "08", "10"].join("-"),
  };

  it("calculates clamped times per day (1 to 6)", () => {
    expect(timesPerDayOf(supp1)).toBe(1);
    expect(timesPerDayOf(supp2)).toBe(2);
    expect(timesPerDayOf({ ...supp1, timesPerDay: 0 })).toBe(1);
    expect(timesPerDayOf({ ...supp1, timesPerDay: 10 })).toBe(MAX_TIMES_PER_DAY);
  });

  it("checks if supplement is active on given dayKey", () => {
    expect(isSupplementActiveOn(supp2, "2026-08-09")).toBe(false);
    expect(isSupplementActiveOn(supp2, "2026-08-10")).toBe(true);
    expect(isSupplementActiveOn(supp2, "2026-08-15")).toBe(true);
    expect(isSupplementActiveOn({ ...supp1, startKey: undefined }, "2026-08-01")).toBe(true);
  });

  it("counts doses taken from day log array", () => {
    const logs = ["s-hierro", "s-calcio", "s-calcio"];
    expect(countDoses(logs, "s-hierro")).toBe(1);
    expect(countDoses(logs, "s-calcio")).toBe(2);
    expect(countDoses(logs, "s-otro")).toBe(0);
    expect(countDoses(undefined, "s-hierro")).toBe(0);
  });

  it("computes day dose totals across active supplements", () => {
    const supplements = [supp1, supp2];
    // supp1 expects 1, supp2 expects 2 -> total 3 expected
    const logs = ["s-hierro", "s-calcio"]; // 1 hierro + 1 calcio taken
    const totals = dayDoseTotals(supplements, logs, "2026-08-15");
    expect(totals.total).toBe(3);
    expect(totals.taken).toBe(2);
  });

  it("formats timesLabel in words", () => {
    expect(timesLabel(1)).toBe("1 vez al día");
    expect(timesLabel(2)).toBe("2 veces al día");
    expect(timesLabel(3)).toBe("3 veces al día");
  });

  it("formats doseName according to frequency and index", () => {
    // 2 times per day
    expect(doseName(0, 2)).toBe("Toma de la mañana");
    expect(doseName(1, 2)).toBe("Toma de la noche");

    // 3 times per day
    expect(doseName(0, 3)).toBe("Toma de la mañana");
    expect(doseName(1, 3)).toBe("Toma de la tarde");
    expect(doseName(2, 3)).toBe("Toma de la noche");

    // 4 times per day
    expect(doseName(0, 4)).toBe("Toma 1 de 4");
  });
});
