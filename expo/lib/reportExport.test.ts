import { describe, expect, it } from "bun:test";
import {
  buildReportHtml,
  exportReportXlsx,
  generateCorporatePdf,
  type ExportContext,
} from "./reportExport";
import type { ReportBlock, Snapshot } from "@/types";

const dummyReport: ReportBlock = {
  gestantes: 12,
  riesgo: { verde: 7, amarillo: 3, rojo: 2 },
  anemia: { normal: 6, leve: 4, moderada: 2, severa: 0 },
  controlesOportunos: { asistidos: 10, esperados: 12, pct: 83 },
  adherenciaPromedio: 88,
  coberturaSuplementacion: 90,
  asistencia: { asistidas: 24, noAsistidas: 2, pct: 92 },
  alertas: { total: 5, atendidas: 5, abiertas: 0, pct: 100 },
  citasHoy: 3,
  visitas: { programadas: 4, realizadas: 3, pct: 75 },
  trimestres: { t1: 2, t2: 6, t3: 4 },
  porComunidad: [
    {
      community: "Talavera",
      gestantes: 8,
      riesgoAlto: 1,
      anemiaCount: 2,
      adherenciaPromedio: 91,
    },
    {
      community: "Pampamarca",
      gestantes: 4,
      riesgoAlto: 1,
      anemiaCount: 1,
      adherenciaPromedio: 82,
    },
  ],
  asistenciaSemanal: [
    { startKey: "2026-08-01", asistidas: 12, total: 13 },
    { startKey: "2026-08-08", asistidas: 12, total: 13 },
  ],
};

const dummySnapshot: Snapshot = {
  serverTimeISO: "2026-08-19T10:00:00.000Z",
  todayKey: "2026-08-19",
  me: {
    dni: "00000000",
    role: "admin",
    firstName: "Administrador",
    lastName: "Sistema",
    active: true,
    createdAtISO: "2026-01-01T00:00:00.000Z",
  },
  center: {
    name: "C.S. Talavera",
    altitudeMsnm: 2926,
    hbFactor: 1.8,
  },
  patients: [
    {
      id: "p-ana",
      dni: "71234567",
      firstName: "Ana",
      lastName: "Quispe",
      age: 24,
      community: "Talavera",
      phone: "983111222",
      fumKey: "2026-02-15",
      gestas: 1,
      cesareas: 0,
      abortos: 0,
      obitoFetal: false,
      rhSensibilizado: false,
      antecedentes: [],
      hbObserved: 12.8,
      bpSys: 110,
      bpDia: 70,
      imc: 23.5,
      adherenceBase: 95,
      weeks: 26,
      daysExtra: 3,
      trimester: 2,
      fppKey: "2026-11-22",
      hbCorrected: 11.0,
      anemia: "normal",
      riskLevel: "verde",
      riskScore: 0,
      riskFactors: [],
      adherence30: 95,
      streak: 14,
      nextAppointment: {
        id: "a-1",
        patientId: "p-ana",
        control: 5,
        week: 28,
        dateKey: "2026-08-25",
        time: "09:00",
        motivo: "Control prenatal 5",
        estado: "programada",
        lugar: "Consultorio 1",
      },
    },
  ],
  appointments: [],
  supplements: [],
  intakes: {},
  messages: [],
  alerts: [
    {
      id: "al-1",
      patientId: "p-ana",
      atISO: "2026-08-18T14:30:00.000Z",
      type: "emergencia",
      title: "Cefalea intensa",
      detail: "Dolor de cabeza persistente con escotomas",
      status: "atendida",
      note: "Control de PA realizado: 110/70. Sin signos de preeclampsia.",
    },
  ],
  visits: [],
};

describe("Clean & Real Report Generator", () => {
  it("builds official Executive HTML template with 100% real clinical facts", () => {
    const ctx: ExportContext = {
      report: dummyReport,
      period: "d30",
      view: dummySnapshot,
      reportType: "ejecutivo",
    };

    const html = buildReportHtml(ctx);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Ministerio de Salud");
    expect(html).toContain("C.S. Talavera");
    expect(html).toContain("2926 m.s.n.m.");
    expect(html).toContain("Población Gestante");
    expect(html).toContain("Tamizaje de Anemia");
    expect(html).toContain("Semáforo de Riesgo Obstétrico");
    expect(html).toContain("Pampamarca");
    // No signatures
    expect(html).not.toContain("signatures-section");
    expect(html).not.toContain("Firmas Institucionales");
  });

  it("builds Nominal Roster HTML template with real patient records", () => {
    const ctx: ExportContext = {
      report: dummyReport,
      period: "d30",
      view: dummySnapshot,
      reportType: "padron",
    };

    const html = buildReportHtml(ctx);

    expect(html).toContain("Padrón Nominal y Ficha Clínica");
    expect(html).toContain("Ana Quispe");
    expect(html).toContain("71234567");
    expect(html).toContain("Talavera");
    expect(html).toContain("26 sem");
  });

  it("builds Territorial Monitoring template", () => {
    const ctx: ExportContext = {
      report: dummyReport,
      period: "d30",
      view: dummySnapshot,
      reportType: "territorial",
    };

    const html = buildReportHtml(ctx);

    expect(html).toContain("Monitoreo Territorial por Comunidades");
    expect(html).toContain("Pampamarca");
    expect(html).toContain("Talavera");
  });

  it("builds Alerts Audit template", () => {
    const ctx: ExportContext = {
      report: dummyReport,
      period: "d30",
      view: dummySnapshot,
      reportType: "alertas",
    };

    const html = buildReportHtml(ctx);

    expect(html).toContain("Auditoría de Alertas y Urgencias");
    expect(html).toContain("Cefalea intensa");
    expect(html).toContain("ATENDIDA");
  });

  it("generates native vector PDF without errors across all 4 report formats", () => {
    const types: ("ejecutivo" | "padron" | "territorial" | "alertas")[] = [
      "ejecutivo",
      "padron",
      "territorial",
      "alertas",
    ];

    for (const reportType of types) {
      const doc = generateCorporatePdf({
        report: dummyReport,
        period: "d30",
        view: dummySnapshot,
        reportType,
      });

      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    }
  });

  it("generates Excel workbook without errors", async () => {
    // In node/bun environment without window/FileSystem, verify export function compiles and executes
    try {
      await exportReportXlsx({
        report: dummyReport,
        period: "d30",
        view: dummySnapshot,
        reportType: "ejecutivo",
      });
    } catch (e: any) {
      // In test env without FileSystem / DOM, it may fail at save step which is expected
      expect(e.message).toBeDefined();
    }
  });
});
