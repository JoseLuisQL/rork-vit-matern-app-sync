/**
 * Exportación profesional de reportes: PDF con plantilla de marca VitMaterna
 * (expo-print) y Excel .xlsx con varias hojas bien ordenadas (SheetJS),
 * compartidos con la hoja nativa del teléfono (expo-sharing). En web el PDF
 * abre el diálogo de impresión y el Excel se descarga directo.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";
import { ALERT_LABEL, ANEMIA_LABEL, RISK_LABEL, STATUS_LABEL } from "@/constants/labels";
import { addDaysToKey, fechaCompleta, fechaCorta } from "@/lib/format";
import type { ReportBlock, Snapshot } from "@/types";

export type ReportPeriod = "d30" | "total";

export interface ExportContext {
  report: ReportBlock;
  period: ReportPeriod;
  view: Snapshot;
}

const BRAND = {
  plum: "#5B2A5E",
  plumSoft: "#F2EAF3",
  teal: "#0C8174",
  tealSoft: "#E3F1EE",
  amber: "#A97613",
  amberSoft: "#FBF1DC",
  rose: "#C25B6A",
  roseSoft: "#FAECEA",
  cream: "#FAF4EA",
  ink: "#33302A",
  inkSoft: "#6E6557",
  border: "#EADFCB",
} as const;

function periodLabel(period: ReportPeriod): string {
  return period === "d30" ? "Últimos 30 días" : "Histórico completo";
}

function pctColor(pct: number): string {
  if (pct >= 75) return BRAND.teal;
  if (pct >= 50) return BRAND.amber;
  return BRAND.rose;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Normaliza campos nuevos por si el teléfono aún guarda un reporte antiguo. */
function safeReport(report: ReportBlock): ReportBlock {
  return {
    ...report,
    visitas: report.visitas ?? { programadas: 0, realizadas: 0, pct: 0 },
    trimestres: report.trimestres ?? { t1: 0, t2: 0, t3: 0 },
    porComunidad: report.porComunidad ?? [],
    asistenciaSemanal: report.asistenciaSemanal ?? [],
  };
}

function patientNameOf(view: Snapshot, patientId: string): string {
  const p = view.patients.find((x) => x.id === patientId);
  return p ? `${p.firstName} ${p.lastName}` : "Paciente";
}

// ---------- Plantilla HTML del PDF ----------

function barRow(label: string, pct: number, detail: string): string {
  const color = pctColor(pct);
  return `
    <tr>
      <td class="ind-label">${esc(label)}</td>
      <td class="ind-bar"><div class="bar"><span style="width:${Math.min(100, Math.max(pct, 2))}%;background:${color}"></span></div></td>
      <td class="ind-pct" style="color:${color}">${pct}%</td>
      <td class="ind-detail">${esc(detail)}</td>
    </tr>`;
}

function distRow(label: string, count: number, total: number, color: string): string {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return `
    <tr>
      <td class="ind-label">${esc(label)}</td>
      <td class="ind-bar"><div class="bar"><span style="width:${Math.max(pct, count > 0 ? 4 : 0)}%;background:${color}"></span></div></td>
      <td class="ind-pct" style="color:${BRAND.ink}">${count}</td>
      <td class="ind-detail">${pct}% del total</td>
    </tr>`;
}

export function buildReportHtml(ctx: ExportContext): string {
  const report = safeReport(ctx.report);
  const { view } = ctx;
  const generado = fechaCompleta(view.todayKey);

  const kpis = [
    { label: "Gestantes activas", value: `${report.gestantes}` },
    { label: "Citas hoy", value: `${report.citasHoy}` },
    { label: "Alertas abiertas", value: `${report.alertas.abiertas}` },
    { label: "Adherencia promedio", value: `${report.adherenciaPromedio}%` },
  ]
    .map(
      (k) => `
      <div class="kpi">
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-label">${esc(k.label)}</div>
      </div>`,
    )
    .join("");

  const comunidadRows = report.porComunidad
    .map(
      (c) => `
      <tr>
        <td>${esc(c.community)}</td>
        <td class="num">${c.gestantes}</td>
        <td class="num" style="color:${c.riesgoAlto > 0 ? BRAND.rose : BRAND.inkSoft}">${c.riesgoAlto}</td>
        <td class="num" style="color:${c.anemiaCount > 0 ? BRAND.amber : BRAND.inkSoft}">${c.anemiaCount}</td>
        <td class="num" style="color:${pctColor(c.adherenciaPromedio)}">${c.adherenciaPromedio}%</td>
      </tr>`,
    )
    .join("");

  const semanalRows = report.asistenciaSemanal
    .map((w) => {
      const pct = w.total > 0 ? Math.round((w.asistidas / w.total) * 100) : 0;
      return barRow(
        `Semana del ${fechaCorta(w.startKey)}`,
        pct,
        `${w.asistidas} de ${w.total} citas asistidas`,
      );
    })
    .join("");

  const gestanteRows = [...view.patients]
    .sort((a, b) => a.firstName.localeCompare(b.firstName))
    .map((p) => {
      const riskColor =
        p.riskLevel === "rojo" ? BRAND.rose : p.riskLevel === "amarillo" ? BRAND.amber : BRAND.teal;
      return `
      <tr>
        <td>${esc(`${p.firstName} ${p.lastName}`)}</td>
        <td class="num">${p.age}</td>
        <td>${esc(p.community)}</td>
        <td class="num">${p.weeks}</td>
        <td class="num">${p.hbCorrected}</td>
        <td>${esc(ANEMIA_LABEL[p.anemia])}</td>
        <td><span class="pill" style="background:${riskColor}18;color:${riskColor};border:1px solid ${riskColor}55">${esc(RISK_LABEL[p.riskLevel])}</span></td>
        <td class="num" style="color:${pctColor(p.adherence30)}">${p.adherence30}%</td>
        <td>${p.nextAppointment ? `${fechaCorta(p.nextAppointment.dateKey)} · ${p.nextAppointment.time}` : "—"}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.ink}; font-size: 12px; }
  .band { background: ${BRAND.plum}; color: #fff; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
  .band h1 { font-size: 21px; font-weight: 800; letter-spacing: .2px; }
  .band .sub { font-size: 12px; opacity: .85; margin-top: 3px; }
  .band .chip { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.35); border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 600; }
  .meta { display: flex; gap: 18px; padding: 12px 28px; background: ${BRAND.cream}; border-bottom: 1px solid ${BRAND.border}; font-size: 11px; color: ${BRAND.inkSoft}; }
  .meta b { color: ${BRAND.ink}; }
  .content { padding: 20px 28px 28px; }
  h2 { font-size: 13px; color: ${BRAND.plum}; text-transform: uppercase; letter-spacing: .8px; margin: 20px 0 8px; border-bottom: 2px solid ${BRAND.plumSoft}; padding-bottom: 4px; }
  .kpis { display: flex; gap: 10px; margin-top: 4px; }
  .kpi { flex: 1; background: ${BRAND.cream}; border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 12px 14px; }
  .kpi-value { font-size: 22px; font-weight: 800; color: ${BRAND.plum}; }
  .kpi-label { font-size: 10.5px; color: ${BRAND.inkSoft}; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  .ind-table td { padding: 6px 6px; border-bottom: 1px solid ${BRAND.cream}; vertical-align: middle; }
  .ind-label { width: 26%; font-weight: 600; }
  .ind-bar { width: 34%; }
  .ind-pct { width: 10%; font-weight: 800; font-size: 13px; text-align: right; }
  .ind-detail { width: 30%; color: ${BRAND.inkSoft}; font-size: 10.5px; padding-left: 10px; }
  .bar { height: 9px; background: #F1E9D8; border-radius: 999px; overflow: hidden; }
  .bar span { display: block; height: 100%; border-radius: 999px; }
  .data-table th { background: ${BRAND.plumSoft}; color: ${BRAND.plum}; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; text-align: left; padding: 7px 8px; }
  .data-table td { padding: 6px 8px; border-bottom: 1px solid ${BRAND.cream}; font-size: 11px; }
  .data-table tr:nth-child(even) td { background: #FDFAF3; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .pill { border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 700; white-space: nowrap; }
  .footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid ${BRAND.border}; display: flex; justify-content: space-between; font-size: 10px; color: ${BRAND.inkSoft}; }
</style>
</head>
<body>
  <div class="band">
    <div>
      <h1>VitMaterna · Reporte de indicadores</h1>
      <div class="sub">${esc(view.center.name)} · Andahuaylas · ${view.center.altitudeMsnm} msnm</div>
    </div>
    <div class="chip">${esc(periodLabel(ctx.period))}</div>
  </div>
  <div class="meta">
    <span>Generado el <b>${esc(generado)}</b></span>
    <span>Gestantes activas: <b>${report.gestantes}</b></span>
    <span>Referencia <b>MINSA</b> · Hb corregida por altitud</span>
  </div>
  <div class="content">
    <div class="kpis">${kpis}</div>

    <h2>Indicadores clave</h2>
    <table class="ind-table">
      ${barRow("Controles a tiempo", report.controlesOportunos.pct, `${report.controlesOportunos.asistidos} de ${report.controlesOportunos.esperados} controles esperados`)}
      ${barRow("Suplementación adecuada", report.coberturaSuplementacion, "Gestantes que cumplen su tratamiento de hierro")}
      ${barRow("Adherencia promedio", report.adherenciaPromedio, "Tomas cumplidas en los últimos 30 días")}
      ${barRow("Asistencia a citas", report.asistencia.pct, `${report.asistencia.asistidas} asistidas · ${report.asistencia.noAsistidas} faltaron o pendientes`)}
      ${barRow("Alertas atendidas", report.alertas.pct, `${report.alertas.atendidas} de ${report.alertas.total} · ${report.alertas.abiertas} abiertas`)}
      ${barRow("Visitas domiciliarias", report.visitas.pct, `${report.visitas.realizadas} realizadas · ${report.visitas.programadas} programadas`)}
    </table>

    <h2>Anemia (Hb corregida por altitud)</h2>
    <table class="ind-table">
      ${distRow(ANEMIA_LABEL.severa, report.anemia.severa, report.gestantes, BRAND.rose)}
      ${distRow(ANEMIA_LABEL.moderada, report.anemia.moderada, report.gestantes, BRAND.rose)}
      ${distRow(ANEMIA_LABEL.leve, report.anemia.leve, report.gestantes, BRAND.amber)}
      ${distRow(ANEMIA_LABEL.normal, report.anemia.normal, report.gestantes, BRAND.teal)}
    </table>

    <h2>Semáforo de riesgo</h2>
    <table class="ind-table">
      ${distRow(RISK_LABEL.rojo, report.riesgo.rojo, report.gestantes, BRAND.rose)}
      ${distRow(RISK_LABEL.amarillo, report.riesgo.amarillo, report.gestantes, BRAND.amber)}
      ${distRow(RISK_LABEL.verde, report.riesgo.verde, report.gestantes, BRAND.teal)}
    </table>

    <h2>Por comunidad</h2>
    <table class="data-table">
      <tr><th>Comunidad</th><th style="text-align:right">Gestantes</th><th style="text-align:right">Riesgo alto</th><th style="text-align:right">Anemia mod./sev.</th><th style="text-align:right">Adherencia</th></tr>
      ${comunidadRows || `<tr><td colspan="5" style="color:${BRAND.inkSoft}">Sin datos registrados.</td></tr>`}
    </table>

    <h2>Asistencia por semana</h2>
    <table class="ind-table">
      ${semanalRows || `<tr><td style="color:${BRAND.inkSoft}">Sin citas en las últimas semanas.</td></tr>`}
    </table>

    <h2>Detalle de gestantes</h2>
    <table class="data-table">
      <tr><th>Nombre</th><th style="text-align:right">Edad</th><th>Comunidad</th><th style="text-align:right">Sem.</th><th style="text-align:right">Hb corr.</th><th>Anemia</th><th>Riesgo</th><th style="text-align:right">Adh. 30d</th><th>Próx. cita</th></tr>
      ${gestanteRows || `<tr><td colspan="9" style="color:${BRAND.inkSoft}">Sin gestantes registradas.</td></tr>`}
    </table>

    <div class="footer">
      <span>VitMaterna · Plataforma de salud prenatal · ${esc(view.center.name)}</span>
      <span>Trimestres: T1 ${report.trimestres.t1} · T2 ${report.trimestres.t2} · T3 ${report.trimestres.t3}</span>
    </div>
  </div>
</body>
</html>`;
}

// ---------- Exportar PDF ----------

/** Genera el PDF con plantilla profesional y abre la hoja para compartir. */
export async function exportReportPdf(ctx: ExportContext): Promise<void> {
  const html = buildReportHtml(ctx);

  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const fileName = `Reporte_VitMaterna_${ctx.view.todayKey}.pdf`;
  let shareUri = uri;
  const cacheDir = FileSystem.cacheDirectory;
  if (cacheDir) {
    const dest = `${cacheDir}${fileName}`;
    try {
      await FileSystem.deleteAsync(dest, { idempotent: true });
      await FileSystem.copyAsync({ from: uri, to: dest });
      shareUri = dest;
    } catch (e) {
      console.log("[VitMaterna] No se pudo renombrar el PDF:", e);
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      mimeType: "application/pdf",
      dialogTitle: "Reporte VitMaterna (PDF)",
      UTI: "com.adobe.pdf",
    });
  }
}

// ---------- Exportar Excel (.xlsx) ----------

/** Hoja de cálculo con anchos de columna prolijos. */
function sheetFromRows(rows: (string | number)[][], widths: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = widths.map((wch) => ({ wch }));
  return ws;
}

export async function exportReportXlsx(ctx: ExportContext): Promise<void> {
  const report = safeReport(ctx.report);
  const { view } = ctx;
  const fromKey = ctx.period === "d30" ? addDaysToKey(view.todayKey, -30) : "0000-00-00";

  const wb = XLSX.utils.book_new();

  // Hoja 1 — Resumen ejecutivo.
  const resumen: (string | number)[][] = [
    ["VITMATERNA — REPORTE DE INDICADORES"],
    ["Centro", `${view.center.name} (${view.center.altitudeMsnm} msnm)`],
    ["Periodo", periodLabel(ctx.period)],
    ["Generado", fechaCompleta(view.todayKey)],
    [],
    ["INDICADORES CLAVE", "Valor", "Detalle"],
    ["Gestantes activas", report.gestantes, ""],
    ["Citas hoy", report.citasHoy, ""],
    [
      "Controles a tiempo",
      `${report.controlesOportunos.pct}%`,
      `${report.controlesOportunos.asistidos} de ${report.controlesOportunos.esperados} esperados`,
    ],
    ["Suplementación adecuada", `${report.coberturaSuplementacion}%`, "Adherencia ≥ 75%"],
    ["Adherencia promedio", `${report.adherenciaPromedio}%`, "Tomas de los últimos 30 días"],
    [
      "Asistencia a citas",
      `${report.asistencia.pct}%`,
      `${report.asistencia.asistidas} asistidas · ${report.asistencia.noAsistidas} faltas/pendientes`,
    ],
    [
      "Alertas atendidas",
      `${report.alertas.pct}%`,
      `${report.alertas.atendidas} de ${report.alertas.total} · ${report.alertas.abiertas} abiertas`,
    ],
    [
      "Visitas domiciliarias",
      `${report.visitas.pct}%`,
      `${report.visitas.realizadas} realizadas · ${report.visitas.programadas} programadas`,
    ],
    [],
    ["SEMÁFORO DE RIESGO", "Gestantes"],
    [RISK_LABEL.rojo, report.riesgo.rojo],
    [RISK_LABEL.amarillo, report.riesgo.amarillo],
    [RISK_LABEL.verde, report.riesgo.verde],
    [],
    ["ANEMIA (Hb corregida)", "Gestantes"],
    [ANEMIA_LABEL.severa, report.anemia.severa],
    [ANEMIA_LABEL.moderada, report.anemia.moderada],
    [ANEMIA_LABEL.leve, report.anemia.leve],
    [ANEMIA_LABEL.normal, report.anemia.normal],
    [],
    ["TRIMESTRE DE EMBARAZO", "Gestantes"],
    ["Primer trimestre", report.trimestres.t1],
    ["Segundo trimestre", report.trimestres.t2],
    ["Tercer trimestre", report.trimestres.t3],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(resumen, [30, 22, 44]), "Resumen");

  // Hoja 2 — Por comunidad.
  const comunidades: (string | number)[][] = [
    ["Comunidad", "Gestantes", "Riesgo alto", "Anemia mod./sev.", "Adherencia promedio (%)"],
    ...report.porComunidad.map((c) => [
      c.community,
      c.gestantes,
      c.riesgoAlto,
      c.anemiaCount,
      c.adherenciaPromedio,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(comunidades, [24, 12, 12, 16, 22]), "Comunidades");

  // Hoja 3 — Detalle de gestantes.
  const gestantes: (string | number)[][] = [
    [
      "DNI",
      "Nombres y apellidos",
      "Edad",
      "Comunidad",
      "Teléfono",
      "Semana",
      "Trimestre",
      "FPP",
      "Hb observada",
      "Hb corregida",
      "Anemia",
      "Riesgo",
      "Factores de riesgo",
      "Adherencia 30d (%)",
      "Próxima cita",
    ],
    ...[...view.patients]
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
      .map((p) => [
        p.dni,
        `${p.firstName} ${p.lastName}`,
        p.age,
        p.community,
        p.phone,
        p.weeks,
        p.trimester,
        p.fppKey,
        p.hbObserved,
        p.hbCorrected,
        ANEMIA_LABEL[p.anemia],
        RISK_LABEL[p.riskLevel],
        p.riskFactors.join("; "),
        p.adherence30,
        p.nextAppointment ? `${p.nextAppointment.dateKey} ${p.nextAppointment.time}` : "—",
      ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(gestantes, [11, 30, 6, 16, 14, 8, 9, 12, 12, 12, 16, 13, 34, 16, 18]),
    "Gestantes",
  );

  // Hoja 4 — Citas del periodo.
  const citas: (string | number)[][] = [
    ["Fecha", "Hora", "Paciente", "Motivo", "Control", "Estado", "Lugar"],
    ...[...view.appointments]
      .filter((a) => a.dateKey >= fromKey)
      .sort((a, b) =>
        a.dateKey === b.dateKey ? a.time.localeCompare(b.time) : a.dateKey.localeCompare(b.dateKey),
      )
      .map((a) => [
        a.dateKey,
        a.time,
        patientNameOf(view, a.patientId),
        a.motivo,
        a.control ? `${a.control} de 8` : "Adicional",
        STATUS_LABEL[a.estado],
        a.lugar,
      ]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(citas, [12, 7, 28, 32, 11, 14, 16]), "Citas");

  // Hoja 5 — Alertas del periodo.
  const alertas: (string | number)[][] = [
    ["Fecha", "Paciente", "Tipo", "Título", "Detalle", "Estado", "Nota de atención"],
    ...[...view.alerts]
      .filter((a) => a.atISO.slice(0, 10) >= fromKey)
      .sort((a, b) => b.atISO.localeCompare(a.atISO))
      .map((a) => [
        a.atISO.slice(0, 16).replace("T", " "),
        patientNameOf(view, a.patientId),
        ALERT_LABEL[a.type],
        a.title,
        a.detail,
        a.status === "abierta" ? "Abierta" : "Atendida",
        a.note ?? "",
      ]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(alertas, [17, 28, 16, 24, 44, 10, 30]), "Alertas");

  const fileName = `Reporte_VitMaterna_${view.todayKey}.xlsx`;

  if (Platform.OS === "web") {
    XLSX.writeFile(wb, fileName);
    return;
  }

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error("No hay carpeta temporal disponible");
  const dest = `${cacheDir}${fileName}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Reporte VitMaterna (Excel)",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });
  }
}
