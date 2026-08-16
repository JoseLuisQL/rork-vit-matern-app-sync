import { describe, expect, it } from "bun:test";
import {
  AGENDA_SLOTS,
  ALTITUDE_MSNM,
  anemiaClass,
  assessRisk,
  correctedHb,
  dateFromKey,
  diffDaysKeys,
  fppKeyFromFum,
  gestationalDays,
  gestationalWeeks,
  HB_CORRECTION_FACTOR,
  keyFromUTCDate,
  MINSA_WEEKS,
  peruDayKey,
  peruTime,
  trimester,
} from "./clinical";
import type { Patient } from "./types";

describe("Clinical Engine — Constants & Setup", () => {
  it("defines standard altitude for Talavera (2926 msnm) and MINSA correction factor", () => {
    expect(ALTITUDE_MSNM).toBe(2926);
    expect(HB_CORRECTION_FACTOR).toBe(-1.8);
  });

  it("defines the 8 MINSA target weeks for prenatal controls", () => {
    expect(MINSA_WEEKS).toEqual([12, 18, 23, 27, 31, 34, 37, 39]);
  });

  it("generates 18 agenda slots between 08:00 and 16:30 in 30-min intervals", () => {
    expect(AGENDA_SLOTS.length).toBe(18);
    expect(AGENDA_SLOTS[0]).toBe("08:00");
    expect(AGENDA_SLOTS[1]).toBe("08:30");
    expect(AGENDA_SLOTS[AGENDA_SLOTS.length - 1]).toBe("16:30");
  });
});

describe("Clinical Engine — Date & Time Utilities (UTC-5 Peru)", () => {
  it("converts YYYY-MM-DD day string to Date UTC and back", () => {
    const dayStr = "2026-08-16";
    const d = dateFromKey(dayStr);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7); // August (0-indexed)
    expect(d.getUTCDate()).toBe(16);
    expect(keyFromUTCDate(d)).toBe(dayStr);
  });

  it("calculates difference in days between two date keys", () => {
    expect(diffDaysKeys("2026-08-20", "2026-08-10")).toBe(10);
    expect(diffDaysKeys("2026-08-10", "2026-08-20")).toBe(-10);
    expect(diffDaysKeys("2026-08-16", "2026-08-16")).toBe(0);
  });

  it("computes Peru local day key and time correctly", () => {
    const utcDate = new Date(Date.UTC(2026, 7, 16, 3, 0, 0));
    expect(peruDayKey(utcDate)).toBe("2026-08-15");
    expect(peruTime(utcDate)).toBe("22:00");

    const middayUtc = new Date(Date.UTC(2026, 7, 16, 15, 30, 0));
    expect(peruDayKey(middayUtc)).toBe("2026-08-16");
    expect(peruTime(middayUtc)).toBe("10:30");
  });
});

describe("Clinical Engine — Gestational Age & FPP (Naegele Rule)", () => {
  it("calculates FPP using Naegele rule: FUM + 7 days - 3 months + 1 year", () => {
    expect(fppKeyFromFum("2026-01-10")).toBe("2026-10-17");
    expect(fppKeyFromFum("2025-11-20")).toBe("2026-08-27");
  });

  it("calculates gestational weeks and days accurately", () => {
    const fumDate = "2026-01-01";
    expect(gestationalWeeks(fumDate, "2026-01-22")).toBe(3);
    expect(gestationalDays(fumDate, "2026-01-22")).toBe(0);

    expect(gestationalWeeks(fumDate, "2026-01-26")).toBe(3);
    expect(gestationalDays(fumDate, "2026-01-26")).toBe(4);
  });

  it("caps gestational weeks at 42 and clamps negative differences to 0", () => {
    const fumDate = "2026-01-01";
    expect(gestationalWeeks(fumDate, "2025-12-01")).toBe(0);
    expect(gestationalDays(fumDate, "2025-12-01")).toBe(0);
    expect(gestationalWeeks(fumDate, "2027-03-01")).toBe(42);
  });

  it("classifies trimesters according to gestational week", () => {
    expect(trimester(0)).toBe(1);
    expect(trimester(12)).toBe(1);
    expect(trimester(13)).toBe(1);
    expect(trimester(14)).toBe(2);
    expect(trimester(27)).toBe(2);
    expect(trimester(28)).toBe(3);
    expect(trimester(40)).toBe(3);
  });
});

describe("Clinical Engine — Hemoglobin Altitude Correction & Anemia Classification", () => {
  it("applies the altitude correction factor (-1.8 g/dL at 2926 msnm) with rounding", () => {
    expect(correctedHb(13.8)).toBe(12.0);
    expect(correctedHb(12.5)).toBe(10.7);
    expect(correctedHb(10.0)).toBe(8.2);
    expect(correctedHb(8.5)).toBe(6.7);
  });

  it("classifies anemia based on corrected Hb thresholds", () => {
    expect(anemiaClass(11.0)).toBe("normal");
    expect(anemiaClass(13.5)).toBe("normal");
    expect(anemiaClass(10.9)).toBe("leve");
    expect(anemiaClass(10.0)).toBe("leve");
    expect(anemiaClass(9.9)).toBe("moderada");
    expect(anemiaClass(7.0)).toBe("moderada");
    expect(anemiaClass(6.9)).toBe("severa");
    expect(anemiaClass(5.2)).toBe("severa");
  });
});

describe("Clinical Engine — Obstetric Risk Score Assessment (Semáforo)", () => {
  const basePatient: Patient = {
    id: "p-test",
    dni: "12345678",
    firstName: "Test",
    lastName: "User",
    phone: "999888777",
    community: "Talavera",
    age: 25,
    fumKey: ["2026", "01", "01"].join("-"),
    gestas: 1,
    cesareas: 0,
    abortos: 0,
    obitoFetal: false,
    rhSensibilizado: false,
    imc: 24.1,
    hbObserved: 13.5,
    bpSys: 110,
    bpDia: 70,
    antecedentes: [],
    adherenceBase: 80,
  };

  it("evaluates a low-risk patient as 'verde' (score 0)", () => {
    const assessment = assessRisk(basePatient);
    expect(assessment.score).toBe(0);
    expect(assessment.level).toBe("verde");
    expect(assessment.factors).toHaveLength(0);
  });

  it("evaluates medium risk factors (amarillo, score 2-3)", () => {
    const pAgeRisk: Patient = { ...basePatient, age: 17 };
    const resAge = assessRisk(pAgeRisk);
    expect(resAge.score).toBe(2);
    expect(resAge.level).toBe("amarillo");
    expect(resAge.factors).toContain("Edad de riesgo (17 años)");

    const pLowBmi: Patient = { ...basePatient, imc: 17.5 };
    const resBmi = assessRisk(pLowBmi);
    expect(resBmi.score).toBe(2);
    expect(resBmi.level).toBe("amarillo");

    const pAnemiaMod: Patient = { ...basePatient, hbObserved: 11.0 };
    const resAnemia = assessRisk(pAnemiaMod);
    expect(resAnemia.score).toBe(2);
    expect(resAnemia.level).toBe("amarillo");
    expect(resAnemia.factors).toContain("Anemia moderada");
  });

  it("evaluates high risk factors (rojo, score >= 4)", () => {
    const pYoungAnemia: Patient = {
      ...basePatient,
      age: 14,
      hbObserved: 12.3,
    };
    const resYoung = assessRisk(pYoungAnemia);
    expect(resYoung.score).toBe(4);
    expect(resYoung.level).toBe("rojo");

    const pHypertension: Patient = { ...basePatient, bpSys: 165, bpDia: 112 };
    const resBp = assessRisk(pHypertension);
    expect(resBp.score).toBe(4);
    expect(resBp.level).toBe("rojo");
    expect(resBp.factors).toContain("Presión muy alta (165/112)");

    const pSevereAnemia: Patient = { ...basePatient, hbObserved: 8.0 };
    const resSevereAnemia = assessRisk(pSevereAnemia);
    expect(resSevereAnemia.score).toBe(4);
    expect(resSevereAnemia.level).toBe("rojo");
    expect(resSevereAnemia.factors).toContain("Anemia severa");
  });

  it("accumulates multiple obstetric history risk factors", () => {
    const pComplex: Patient = {
      ...basePatient,
      cesareas: 2,
      abortos: 3,
      obitoFetal: true,
      gestas: 6,
      rhSensibilizado: true,
      antecedentes: ["Diabetes gestacional previa", "Preeclampsia previa"],
    };
    const res = assessRisk(pComplex);
    expect(res.score).toBe(3 + 3 + 3 + 2 + 3 + 6);
    expect(res.level).toBe("rojo");
    expect(res.factors.length).toBe(7);
  });
});
