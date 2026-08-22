/**
 * Sistema Profesional de Exportación de Reportes Clínicos y de Gestión — VitMaterna.
 * Diseño institucional sobrio, estructurado y 100% armonizado con los tokens del frontend:
 * - Paleta oficial VitMaterna: Ciruela institucional (#5B2A5E), Teal salud (#0C8174),
 *   papel crema (#FAF4EA), tinta cálida (#33302A) y semáforo clínico oficial.
 * - Formato tabular profesional: tablas estructuradas, limpias y sin saturación visual.
 * - PDF vectorial nativo (jsPDF + jspdf-autotable) con tipografía nítida y sin solapamientos.
 * - Cuaderno Excel (.xlsx) estilizado con ExcelJS con colores del tema, bordes cálidos,
 *   cabeceras fusionadas, paneles fijos y celdas semánticas.
 */
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ALERT_LABEL,
  ANEMIA_LABEL,
  RISK_LABEL,
  STATUS_LABEL,
} from "@/constants/labels";
import { addDaysToKey, fechaCompleta, fechaCorta } from "@/lib/format";
import type { ReportBlock, Snapshot } from "@/types";

export type ReportPeriod = "d30" | "total";
export type ReportType = "ejecutivo" | "padron" | "territorial" | "alertas";

export interface ExportContext {
  report: ReportBlock;
  period: ReportPeriod;
  view: Snapshot;
  reportType?: ReportType;
}

export const REPORT_TYPE_LABELS: Record<ReportType, { title: string; subtitle: string }> = {
  ejecutivo: {
    title: "Informe Ejecutivo Consolidado",
    subtitle: "Resumen de población gestante, citas, anemia y riesgo obstétrico",
  },
  padron: {
    title: "Padrón Nominal y Ficha Clínica",
    subtitle: "Detalle nominal de gestantes, semanas de gestación y controles",
  },
  territorial: {
    title: "Monitoreo Territorial por Comunidades",
    subtitle: "Seguimiento epidemiológico por comunidades y sectores",
  },
  alertas: {
    title: "Auditoría de Alertas y Urgencias",
    subtitle: "Registro de emergencias SOS, señales de alarma y resolución",
  },
};

/** Paleta oficial VitMaterna (frontend design tokens) */
const THEME = {
  plum: "#5B2A5E", // warmPlum.main (Ciruela Institucional)
  plumDeep: "#48214B", // warmPlum.deep
  plumSoft: "#F4ECF5", // warmPlum.soft
  teal: "#0C8174", // warmTeal.main (Teal Salud)
  tealDeep: "#0A6B60", // warmTeal.deep
  tealSoft: "#E3F1EE", // warmTeal.soft
  ink: "#33302A", // gwarm.ink (Tinta oscura)
  inkSoft: "#6E6557", // gwarm.inkSoft (Tinta secundaria)
  inkFaint: "#9C9078", // gwarm.inkFaint
  bgWarm: "#FAF4EA", // gwarm.bg (Papel crema)
  surface: "#FFFFFF",
  surfaceSoft: "#FFFDF7",
  border: "#EADCC6", // gwarm.border
  borderLight: "#F0E6D4",
  borderStrong: "#DFD1B8",
  green: "#1F9D6B",
  greenSoft: "#EAF7F0",
  greenBorder: "#BBEAD3",
  amber: "#A97613",
  amberSoft: "#FBF4E3",
  amberBorder: "#F3E0B4",
  red: "#D64545",
  redSoft: "#FBEDED",
  redBorder: "#F2C4C4",
} as const;

export function periodLabel(period: ReportPeriod): string {
  return period === "d30"
    ? "Últimos 30 días"
    : "Histórico consolidado";
}

function esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

function patientPhoneOf(view: Snapshot, patientId: string): string {
  const p = view.patients.find((x) => x.id === patientId);
  return p?.phone || "—";
}

function patientDniOf(view: Snapshot, patientId: string): string {
  const p = view.patients.find((x) => x.id === patientId);
  return p?.dni || "—";
}

// ============================================================================
// 1. GENERADOR DE PLANTILLA HTML (Vista Previa en Vivo con Tokens VitMaterna)
// ============================================================================

export function buildReportHtml(ctx: ExportContext): string {
  const report = safeReport(ctx.report);
  const { view } = ctx;
  const type: ReportType = ctx.reportType || "ejecutivo";
  const generado = fechaCompleta(view.todayKey);
  const fromKey = ctx.period === "d30" ? addDaysToKey(view.todayKey, -30) : "0000-00-00";

  const gestantesSorted = [...view.patients].sort((a, b) =>
    a.firstName.localeCompare(b.firstName),
  );

  const totalGestantes = report.gestantes;
  const pctOf = (count: number) =>
    totalGestantes > 0 ? `${Math.round((count / totalGestantes) * 100)}%` : "0%";

  // Filas del padrón nominal
  const gestanteRows = gestantesSorted
    .map((p, idx) => {
      const riskBadge =
        p.riskLevel === "rojo"
          ? `<span class="badge badge-red">${esc(RISK_LABEL[p.riskLevel])}</span>`
          : p.riskLevel === "amarillo"
          ? `<span class="badge badge-amber">${esc(RISK_LABEL[p.riskLevel])}</span>`
          : `<span class="badge badge-green">${esc(RISK_LABEL[p.riskLevel])}</span>`;

      const anemiaBadge =
        p.anemia === "severa" || p.anemia === "moderada"
          ? `<span class="badge badge-red">${esc(ANEMIA_LABEL[p.anemia])}</span>`
          : p.anemia === "leve"
          ? `<span class="badge badge-amber">${esc(ANEMIA_LABEL[p.anemia])}</span>`
          : `<span class="badge badge-green">${esc(ANEMIA_LABEL[p.anemia])}</span>`;

      return `
      <tr>
        <td class="text-center font-mono text-muted">${idx + 1}</td>
        <td class="font-mono font-medium">${esc(p.dni)}</td>
        <td class="font-bold">${esc(`${p.firstName} ${p.lastName}`)}</td>
        <td class="text-center">${p.age} a</td>
        <td>${esc(p.community)}</td>
        <td class="text-center font-semibold">${p.weeks} sem</td>
        <td class="text-center font-mono">${fechaCorta(p.fppKey)}</td>
        <td class="text-right font-mono font-bold">${p.hbCorrected}</td>
        <td class="text-center">${anemiaBadge}</td>
        <td class="text-center">${riskBadge}</td>
        <td class="text-right font-mono font-bold">${p.adherence30}%</td>
        <td class="text-muted">${p.nextAppointment ? `${fechaCorta(p.nextAppointment.dateKey)} · ${p.nextAppointment.time}` : "—"}</td>
      </tr>`;
    })
    .join("");

  // Filas de comunidades
  const totalRiesgoAlto = report.porComunidad.reduce((acc, c) => acc + c.riesgoAlto, 0);
  const totalAnemia = report.porComunidad.reduce((acc, c) => acc + c.anemiaCount, 0);

  const comunidadRows = report.porComunidad
    .map(
      (c) => `
      <tr>
        <td class="font-bold">${esc(c.community)}</td>
        <td class="text-right font-mono">${c.gestantes}</td>
        <td class="text-right font-mono ${c.riesgoAlto > 0 ? "text-danger font-bold" : "text-muted"}">
          ${c.riesgoAlto}
        </td>
        <td class="text-right font-mono ${c.anemiaCount > 0 ? "text-warning font-bold" : "text-muted"}">
          ${c.anemiaCount}
        </td>
        <td class="text-right font-mono font-bold">${c.adherenciaPromedio}%</td>
      </tr>`,
    )
    .join("");

  // Filas de alertas
  const periodAlerts = [...view.alerts]
    .filter((a) => a.atISO.slice(0, 10) >= fromKey)
    .sort((a, b) => b.atISO.localeCompare(a.atISO));

  const alertRows = periodAlerts
    .map((a) => {
      const isUrgent = a.type === "emergencia" || a.type === "alarma";
      return `
      <tr>
        <td class="font-mono text-muted" style="white-space:nowrap;">${a.atISO.slice(0, 16).replace("T", " ")}</td>
        <td class="font-bold">${esc(patientNameOf(view, a.patientId))}</td>
        <td class="font-mono text-muted">${esc(patientDniOf(view, a.patientId))}</td>
        <td><span class="badge ${isUrgent ? "badge-red" : "badge-amber"}">${esc(ALERT_LABEL[a.type])}</span></td>
        <td>
          <div class="font-semibold">${esc(a.title)}</div>
          <div class="text-muted" style="font-size:9px;">${esc(a.detail)}</div>
        </td>
        <td class="text-center">
          <span class="badge ${a.status === "abierta" ? "badge-red" : "badge-green"}">
            ${a.status === "abierta" ? "PENDIENTE" : "ATENDIDA"}
          </span>
        </td>
        <td class="text-muted">${esc(a.note || "Sin observaciones")}</td>
      </tr>`;
    })
    .join("");

  let mainBodyContent = "";

  if (type === "ejecutivo") {
    const totalCitas = report.asistencia.asistidas + report.asistencia.noAsistidas;
    mainBodyContent = `
      <!-- 1. Tabla de Resumen de Gestión y Población Gestante -->
      <div class="section-title">1. Resumen de Gestión y Población Gestante</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 28%;">Indicador / Área</th>
            <th style="width: 42%;">Detalle Clínico y Operativo</th>
            <th class="text-right" style="width: 15%;">Cantidad</th>
            <th class="text-right" style="width: 15%;">Tasa / %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-bold">Población Gestante Activa</td>
            <td>Gestantes bajo control y monitoreo continuo</td>
            <td class="text-right font-mono font-bold">${report.gestantes}</td>
            <td class="text-right font-mono">100%</td>
          </tr>
          <tr>
            <td class="font-bold">Distribución Gestacional</td>
            <td>1er Trimestre: <b>${report.trimestres.t1}</b> · 2do Trimestre: <b>${report.trimestres.t2}</b> · 3er Trimestre: <b>${report.trimestres.t3}</b></td>
            <td class="text-right font-mono">${report.gestantes}</td>
            <td class="text-right font-mono">100%</td>
          </tr>
          <tr>
            <td class="font-bold">Asistencia a Citas Prenatales</td>
            <td>${report.asistencia.asistidas} citas asistidas de ${totalCitas} programadas (${report.asistencia.noAsistidas} pendientes/no asistidas)</td>
            <td class="text-right font-mono">${report.asistencia.asistidas} / ${totalCitas}</td>
            <td class="text-right font-mono font-bold">${report.asistencia.pct}%</td>
          </tr>
          <tr>
            <td class="font-bold">Adherencia a Suplementación</td>
            <td>Tomas registradas de sulfato ferroso y ácido fólico (${report.coberturaSuplementacion}% adherencia regular &gt;= 75%)</td>
            <td class="text-right font-mono">${report.adherenciaPromedio}%</td>
            <td class="text-right font-mono font-bold">${report.adherenciaPromedio}%</td>
          </tr>
          <tr>
            <td class="font-bold">Alertas y Urgencias Obstétricas</td>
            <td>${report.alertas.atendidas} atendidas oportunamente · ${report.alertas.abiertas} pendientes de seguimiento</td>
            <td class="text-right font-mono">${report.alertas.total}</td>
            <td class="text-right font-mono font-bold">${report.alertas.pct}% efic.</td>
          </tr>
        </tbody>
      </table>

      <!-- 2. Diagnóstico Clínico: Anemia y Riesgo Obstétrico (Tablas Gemelas) -->
      <div class="section-title">2. Diagnóstico Clínico y Estratificación</div>
      <div class="grid-2col">
        <!-- Tabla Anemia -->
        <div>
          <table class="doc-table">
            <thead>
              <tr>
                <th>Tamizaje de Anemia (Hb Corregida)</th>
                <th class="text-center" style="width: 60px;">Rango</th>
                <th class="text-right" style="width: 45px;">Casos</th>
                <th class="text-right" style="width: 45px;">%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Normal</td>
                <td class="text-center font-mono text-muted">&gt;= 11.0</td>
                <td class="text-right font-mono font-bold">${report.anemia.normal}</td>
                <td class="text-right font-mono">${pctOf(report.anemia.normal)}</td>
              </tr>
              <tr>
                <td>Anemia Leve</td>
                <td class="text-center font-mono text-muted">10.0 - 10.9</td>
                <td class="text-right font-mono font-bold">${report.anemia.leve}</td>
                <td class="text-right font-mono">${pctOf(report.anemia.leve)}</td>
              </tr>
              <tr>
                <td>Anemia Moderada</td>
                <td class="text-center font-mono text-muted">7.0 - 9.9</td>
                <td class="text-right font-mono font-bold">${report.anemia.moderada}</td>
                <td class="text-right font-mono">${pctOf(report.anemia.moderada)}</td>
              </tr>
              <tr>
                <td>Anemia Severa</td>
                <td class="text-center font-mono text-muted">&lt; 7.0</td>
                <td class="text-right font-mono font-bold">${report.anemia.severa}</td>
                <td class="text-right font-mono">${pctOf(report.anemia.severa)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="font-bold">Total Evaluadas</td>
                <td class="text-center text-muted">—</td>
                <td class="text-right font-mono font-bold">${report.gestantes}</td>
                <td class="text-right font-mono font-bold">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Tabla Riesgo -->
        <div>
          <table class="doc-table">
            <thead>
              <tr>
                <th>Semáforo de Riesgo Obstétrico</th>
                <th class="text-center" style="width: 65px;">Nivel</th>
                <th class="text-right" style="width: 45px;">Casos</th>
                <th class="text-right" style="width: 45px;">%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bajo Riesgo</td>
                <td class="text-center"><span class="badge badge-green">VERDE</span></td>
                <td class="text-right font-mono font-bold">${report.riesgo.verde}</td>
                <td class="text-right font-mono">${pctOf(report.riesgo.verde)}</td>
              </tr>
              <tr>
                <td>Riesgo Medio</td>
                <td class="text-center"><span class="badge badge-amber">AMARILLO</span></td>
                <td class="text-right font-mono font-bold">${report.riesgo.amarillo}</td>
                <td class="text-right font-mono">${pctOf(report.riesgo.amarillo)}</td>
              </tr>
              <tr>
                <td>Alto Riesgo</td>
                <td class="text-center"><span class="badge badge-red">ROJO</span></td>
                <td class="text-right font-mono font-bold">${report.riesgo.rojo}</td>
                <td class="text-right font-mono">${pctOf(report.riesgo.rojo)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="font-bold">Total Estratificadas</td>
                <td class="text-center text-muted">—</td>
                <td class="text-right font-mono font-bold">${report.gestantes}</td>
                <td class="text-right font-mono font-bold">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 3. Monitoreo Territorial -->
      <div class="section-title">3. Monitoreo Territorial por Comunidades</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Comunidad / Sector</th>
            <th class="text-right" style="width: 18%;">Total Gestantes</th>
            <th class="text-right" style="width: 20%;">Alto Riesgo (Rojo)</th>
            <th class="text-right" style="width: 22%;">Anemia Mod. / Sev.</th>
            <th class="text-right" style="width: 22%;">Adherencia Media</th>
          </tr>
        </thead>
        <tbody>
          ${comunidadRows || `<tr><td colspan="5" class="text-center text-muted" style="padding:10px;">Sin comunidades registradas en este periodo.</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td class="font-bold">TOTAL GENERAL</td>
            <td class="text-right font-mono font-bold">${report.gestantes}</td>
            <td class="text-right font-mono font-bold">${totalRiesgoAlto}</td>
            <td class="text-right font-mono font-bold">${totalAnemia}</td>
            <td class="text-right font-mono font-bold">${report.adherenciaPromedio}%</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else if (type === "padron") {
    mainBodyContent = `
      <div class="section-title">Padrón Nominal y Ficha Clínica de Gestantes</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th class="text-center" style="width:24px;">N°</th>
            <th style="width:72px;">DNI</th>
            <th>Apellidos y Nombres</th>
            <th class="text-center" style="width:36px;">Edad</th>
            <th>Comunidad</th>
            <th class="text-center" style="width:52px;">EG</th>
            <th class="text-center" style="width:68px;">FPP</th>
            <th class="text-right" style="width:52px;">Hb Corr</th>
            <th class="text-center" style="width:72px;">Anemia</th>
            <th class="text-center" style="width:72px;">Riesgo</th>
            <th class="text-right" style="width:50px;">Adh.</th>
            <th style="width:110px;">Próxima Cita</th>
          </tr>
        </thead>
        <tbody>
          ${gestanteRows || `<tr><td colspan="12" class="text-center text-muted" style="padding:12px;">Sin gestantes registradas en el padrón.</td></tr>`}
        </tbody>
      </table>
    `;
  } else if (type === "territorial") {
    mainBodyContent = `
      <div class="section-title">Monitoreo Territorial por Comunidades y Sectores</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Comunidad / Sector</th>
            <th class="text-right" style="width: 20%;">Total Gestantes</th>
            <th class="text-right" style="width: 22%;">Casos Alto Riesgo</th>
            <th class="text-right" style="width: 24%;">Casos Anemia Mod./Sev.</th>
            <th class="text-right" style="width: 24%;">Adherencia Promedio</th>
          </tr>
        </thead>
        <tbody>
          ${comunidadRows || `<tr><td colspan="5" class="text-center text-muted" style="padding:12px;">Sin datos territoriales registrados.</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td class="font-bold">TOTAL GENERAL</td>
            <td class="text-right font-mono font-bold">${report.gestantes}</td>
            <td class="text-right font-mono font-bold">${totalRiesgoAlto}</td>
            <td class="text-right font-mono font-bold">${totalAnemia}</td>
            <td class="text-right font-mono font-bold">${report.adherenciaPromedio}%</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else if (type === "alertas") {
    mainBodyContent = `
      <div class="section-title">Auditoría de Alertas y Urgencias Obstétricas</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th style="width:105px;">Fecha y Hora</th>
            <th>Gestante</th>
            <th style="width:75px;">DNI</th>
            <th style="width:90px;">Tipo de Alerta</th>
            <th>Signos / Síntomas Reportados</th>
            <th class="text-center" style="width:80px;">Estado</th>
            <th>Resolución / Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${alertRows || `<tr><td colspan="7" class="text-center text-muted" style="padding:12px;">No se registraron alertas en este periodo.</td></tr>`}
        </tbody>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${REPORT_TYPE_LABELS[type].title} — VitMaterna</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: ${THEME.ink};
    background-color: #FFFFFF;
    font-size: 10px;
    line-height: 1.4;
    padding: 16px;
  }

  /* Encabezado Institucional VitMaterna */
  .doc-header {
    border-bottom: 2.5px solid ${THEME.plum};
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .doc-institution {
    font-size: 8.5px;
    font-weight: 700;
    color: ${THEME.inkSoft};
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .doc-establishment {
    font-size: 16px;
    font-weight: 800;
    color: ${THEME.plum};
    letter-spacing: -0.2px;
    margin-top: 1px;
  }
  .doc-report-title {
    font-size: 12px;
    font-weight: 700;
    color: ${THEME.plumDeep};
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 2px;
  }

  /* Tabla de Metadatos */
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    background-color: ${THEME.bgWarm};
    border: 1px solid ${THEME.border};
    border-radius: 6px;
  }
  .meta-table td {
    padding: 4px 8px;
    font-size: 9px;
    border: 1px solid ${THEME.borderLight};
    color: ${THEME.ink};
  }
  .meta-label {
    font-weight: 700;
    color: ${THEME.inkSoft};
    width: 15%;
    text-transform: uppercase;
    font-size: 8px;
  }
  .meta-val {
    font-weight: 600;
    width: 35%;
  }

  /* Títulos de Sección */
  .section-title {
    font-size: 10.5px;
    font-weight: 800;
    color: ${THEME.plum};
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin: 12px 0 5px 0;
    border-bottom: 1.5px solid ${THEME.border};
    padding-bottom: 3px;
  }

  /* Tablas Estructuradas Oficiales */
  .doc-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    border: 1px solid ${THEME.border};
  }
  .doc-table th {
    background-color: ${THEME.plum};
    color: #FFFFFF;
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 5px 7px;
    border: 1px solid ${THEME.plumDeep};
    text-align: left;
  }
  .doc-table td {
    padding: 4.5px 7px;
    border: 1px solid ${THEME.borderLight};
    font-size: 9px;
    color: ${THEME.ink};
    vertical-align: middle;
  }
  .doc-table tr:nth-child(even) td {
    background-color: #FAF6EF;
  }
  .doc-table tfoot td {
    background-color: ${THEME.bgWarm};
    font-weight: 700;
    border-top: 1.5px solid ${THEME.border};
  }

  /* Disposición 2 Columnas para Tablas */
  .grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  /* Utilidades Tipográficas */
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  .text-muted { color: ${THEME.inkSoft}; }
  .text-danger { color: ${THEME.red}; }
  .text-warning { color: ${THEME.amber}; }
  .text-success { color: ${THEME.green}; }

  /* Badges Discretos */
  .badge {
    display: inline-block;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  }
  .badge-green { background-color: ${THEME.greenSoft}; color: ${THEME.green}; border: 1px solid ${THEME.greenBorder}; }
  .badge-amber { background-color: ${THEME.amberSoft}; color: ${THEME.amber}; border: 1px solid ${THEME.amberBorder}; }
  .badge-red { background-color: ${THEME.redSoft}; color: ${THEME.red}; border: 1px solid ${THEME.redBorder}; }

  /* Pie de Página */
  .doc-footer {
    margin-top: 14px;
    padding-top: 6px;
    border-top: 1px solid ${THEME.border};
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: ${THEME.inkFaint};
  }

  @media (max-width: 680px) {
    .grid-2col {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>

  <!-- Encabezado Institucional -->
  <div class="doc-header">
    <div class="doc-institution">Ministerio de Salud · DIRESA Apurímac · Red de Salud Andahuaylas</div>
    <div class="doc-establishment">${esc(view.center.name)} (Categoría I-4)</div>
    <div class="doc-report-title">${REPORT_TYPE_LABELS[type].title}</div>
  </div>

  <!-- Ficha de Metadatos -->
  <table class="meta-table">
    <tr>
      <td class="meta-label">Establecimiento</td>
      <td class="meta-val">${esc(view.center.name)}</td>
      <td class="meta-label">Periodo</td>
      <td class="meta-val">${esc(periodLabel(ctx.period))}</td>
    </tr>
    <tr>
      <td class="meta-label">Altitud / Corrección</td>
      <td class="meta-val">${view.center.altitudeMsnm} m.s.n.m. (-${view.center.hbFactor} g/dL Hb)</td>
      <td class="meta-label">Fecha de Emisión</td>
      <td class="meta-val">${esc(generado)}</td>
    </tr>
  </table>

  <!-- Contenido Tabular -->
  ${mainBodyContent}

  <!-- Pie de Página -->
  <div class="doc-footer">
    <span>VitMaterna · Sistema de Gestión Materno-Perinatal</span>
    <span>${esc(view.center.name)} · Red de Salud Andahuaylas</span>
    <span>Documento Clínico Oficial</span>
  </div>

</body>
</html>`;
}

// ============================================================================
// 2. GENERADOR DE PDF CORPORATIVO VECTORIAL NATIVO (jsPDF + jspdf-autotable)
// ============================================================================

function drawDocPdfHeader(doc: jsPDF, ctx: ExportContext): number {
  const { view } = ctx;
  const type = ctx.reportType || "ejecutivo";
  const generado = fechaCompleta(view.todayKey);
  const periodStr = periodLabel(ctx.period);

  // Encabezado institucional oficial
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 101, 87); // inkSoft
  doc.text(
    "MINISTERIO DE SALUD - DIRESA APURIMAC - RED DE SALUD ANDAHUAYLAS",
    14,
    14
  );

  doc.setFontSize(13);
  doc.setTextColor(91, 42, 94); // Plum
  doc.text(`${view.center.name.toUpperCase()} (CATEGORIA I-4)`, 14, 20);

  doc.setFontSize(9.5);
  doc.setTextColor(72, 33, 75); // PlumDeep
  doc.text(REPORT_TYPE_LABELS[type].title.toUpperCase(), 14, 25.5);

  // Tabla compacta de metadatos institucionales
  autoTable(doc, {
    startY: 28,
    margin: { left: 14, right: 14 },
    body: [
      [
        { content: "Establecimiento:", styles: { fontStyle: "bold", textColor: [110, 101, 87] } },
        view.center.name,
        { content: "Periodo:", styles: { fontStyle: "bold", textColor: [110, 101, 87] } },
        periodStr,
      ],
      [
        { content: "Altitud / Hb Corr.:", styles: { fontStyle: "bold", textColor: [110, 101, 87] } },
        `${view.center.altitudeMsnm} m.s.n.m. (-${view.center.hbFactor} g/dL)`,
        { content: "Fecha Emision:", styles: { fontStyle: "bold", textColor: [110, 101, 87] } },
        generado,
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 7,
      cellPadding: 1.3,
      textColor: [51, 48, 42],
      lineColor: [234, 220, 198],
      lineWidth: 0.15,
      fillColor: [250, 244, 234],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 60, fontStyle: "bold" },
      2: { cellWidth: 26 },
      3: { cellWidth: 64, fontStyle: "bold" },
    },
  });

  return ((doc as any).lastAutoTable?.finalY ?? 38) + 4;
}

function drawDocPdfFooter(doc: jsPDF, view: Snapshot): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const y = 287;

    doc.setDrawColor(234, 220, 198);
    doc.setLineWidth(0.2);
    doc.line(14, y - 2, 196, y - 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(156, 144, 120);
    doc.text(
      `VitMaterna - Sistema Integral de Gestion Materno-Perinatal | ${view.center.name}`,
      14,
      y + 2
    );

    doc.setFont("helvetica", "bold");
    doc.text(`Pagina ${i} de ${pageCount}`, 196, y + 2, { align: "right" });
  }
}

export function generateCorporatePdf(ctx: ExportContext): jsPDF {
  const report = safeReport(ctx.report);
  const { view } = ctx;
  const type: ReportType = ctx.reportType || "ejecutivo";
  const fromKey = ctx.period === "d30" ? addDaysToKey(view.todayKey, -30) : "0000-00-00";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  let currentY = drawDocPdfHeader(doc, ctx);

  const baseTableStyles = {
    fontSize: 7.2,
    cellPadding: 1.8,
    textColor: [51, 48, 42] as [number, number, number],
    lineColor: [234, 220, 198] as [number, number, number],
    lineWidth: 0.15,
  };

  const baseHeadStyles = {
    fillColor: [91, 42, 94] as [number, number, number], // warmPlum
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 7.5,
    cellPadding: 2,
    lineColor: [72, 33, 75] as [number, number, number],
    lineWidth: 0.15,
  };

  const baseAlternateStyles = {
    fillColor: [250, 246, 239] as [number, number, number],
  };

  const baseFootStyles = {
    fillColor: [250, 244, 234] as [number, number, number],
    textColor: [51, 48, 42] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 7.2,
    lineColor: [234, 220, 198] as [number, number, number],
    lineWidth: 0.2,
  };

  if (type === "ejecutivo") {
    const totalGestantes = report.gestantes;
    const totalCitas = report.asistencia.asistidas + report.asistencia.noAsistidas;
    const pct = (n: number) => (totalGestantes > 0 ? `${Math.round((n / totalGestantes) * 100)}%` : "0%");

    // 1. Tabla de Resumen de Gestión y Población Gestante
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(91, 42, 94);
    doc.text("1. RESUMEN DE GESTION Y POBLACION GESTANTE", 14, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: 14, right: 14 },
      head: [["Indicador / Area", "Detalle Clinico y Operativo", "Cantidad", "Tasa / %"]],
      body: [
        [
          "Poblacion Gestante Activa",
          "Gestantes bajo control y monitoreo continuo",
          `${report.gestantes}`,
          "100%",
        ],
        [
          "Distribucion Gestacional",
          `1er Trimestre: ${report.trimestres.t1} | 2do Trimestre: ${report.trimestres.t2} | 3er Trimestre: ${report.trimestres.t3}`,
          `${report.gestantes}`,
          "100%",
        ],
        [
          "Asistencia a Citas Prenatales",
          `${report.asistencia.asistidas} citas asistidas de ${totalCitas} programadas (${report.asistencia.noAsistidas} pendientes/no asistidas)`,
          `${report.asistencia.asistidas} / ${totalCitas}`,
          `${report.asistencia.pct}%`,
        ],
        [
          "Adherencia a Medicamentos",
          `Tomas cumplidas de hierro y acido folico (${report.coberturaSuplementacion}% adherencia regular >= 75%)`,
          `${report.adherenciaPromedio}%`,
          `${report.adherenciaPromedio}%`,
        ],
        [
          "Alertas y Urgencias Obstetricas",
          `${report.alertas.atendidas} atendidas oportunamente | ${report.alertas.abiertas} pendientes de seguimiento`,
          `${report.alertas.total}`,
          `${report.alertas.pct}% efic.`,
        ],
      ],
      theme: "plain",
      headStyles: baseHeadStyles,
      bodyStyles: baseTableStyles,
      alternateRowStyles: baseAlternateStyles,
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 84 },
        2: { halign: "right", fontStyle: "bold", cellWidth: 24 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 24 },
      },
    });

    currentY = ((doc as any).lastAutoTable?.finalY ?? currentY + 35) + 6;

    // 2. Diagnóstico Clínico: Anemia y Riesgo Obstétrico
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(91, 42, 94);
    doc.text("2. DIAGNOSTICO CLINICO Y ESTRATIFICACION", 14, currentY);

    const startTablesY = currentY + 2;

    // Tabla de Anemia (Izquierda)
    autoTable(doc, {
      startY: startTablesY,
      margin: { left: 14, right: 108 },
      head: [["Tamizaje Anemia (Hb Corr.)", "Rango", "Casos", "%"]],
      body: [
        ["Normal", ">= 11.0", `${report.anemia.normal}`, pct(report.anemia.normal)],
        ["Anemia Leve", "10.0 - 10.9", `${report.anemia.leve}`, pct(report.anemia.leve)],
        ["Anemia Moderada", "7.0 - 9.9", `${report.anemia.moderada}`, pct(report.anemia.moderada)],
        ["Anemia Severa", "< 7.0", `${report.anemia.severa}`, pct(report.anemia.severa)],
      ],
      foot: [["Total Evaluadas", "-", `${report.gestantes}`, "100%"]],
      theme: "plain",
      headStyles: baseHeadStyles,
      bodyStyles: baseTableStyles,
      footStyles: baseFootStyles,
      alternateRowStyles: baseAlternateStyles,
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: 14, halign: "right", fontStyle: "bold" },
        3: { cellWidth: 14, halign: "right" },
      },
    });

    const finalYAnemia = (doc as any).lastAutoTable?.finalY ?? startTablesY + 30;

    // Tabla de Riesgo Obstétrico (Derecha)
    autoTable(doc, {
      startY: startTablesY,
      margin: { left: 108, right: 14 },
      head: [["Semaforo de Riesgo", "Criterio", "Casos", "%"]],
      body: [
        ["Bajo Riesgo (Verde)", "Habitual", `${report.riesgo.verde}`, pct(report.riesgo.verde)],
        ["Riesgo Medio (Amarillo)", "Vigilancia", `${report.riesgo.amarillo}`, pct(report.riesgo.amarillo)],
        ["Alto Riesgo (Rojo)", "Prioritario", `${report.riesgo.rojo}`, pct(report.riesgo.rojo)],
      ],
      foot: [["Total Estratificadas", "-", `${report.gestantes}`, "100%"]],
      theme: "plain",
      headStyles: baseHeadStyles,
      bodyStyles: baseTableStyles,
      footStyles: baseFootStyles,
      alternateRowStyles: baseAlternateStyles,
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: 14, halign: "right", fontStyle: "bold" },
        3: { cellWidth: 14, halign: "right" },
      },
    });

    const finalYRiesgo = (doc as any).lastAutoTable?.finalY ?? startTablesY + 30;

    currentY = Math.max(finalYAnemia, finalYRiesgo) + 6;

    // 3. Monitoreo Territorial
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(91, 42, 94);
    doc.text("3. MONITOREO TERRITORIAL POR COMUNIDADES", 14, currentY);

    const commRows = report.porComunidad.map((c) => [
      c.community,
      `${c.gestantes}`,
      `${c.riesgoAlto}`,
      `${c.anemiaCount}`,
      `${c.adherenciaPromedio}%`,
    ]);

    const totalRiesgoAlto = report.porComunidad.reduce((acc, c) => acc + c.riesgoAlto, 0);
    const totalAnemia = report.porComunidad.reduce((acc, c) => acc + c.anemiaCount, 0);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: 14, right: 14 },
      head: [["Comunidad / Sector", "Total Gestantes", "Alto Riesgo (Rojo)", "Anemia Mod./Sev.", "Adherencia Media"]],
      body: commRows.length > 0 ? commRows : [["Sin comunidades registradas", "0", "0", "0", "0%"]],
      foot: [["TOTAL GENERAL", `${report.gestantes}`, `${totalRiesgoAlto}`, `${totalAnemia}`, `${report.adherenciaPromedio}%`]],
      theme: "plain",
      headStyles: baseHeadStyles,
      bodyStyles: baseTableStyles,
      footStyles: baseFootStyles,
      alternateRowStyles: baseAlternateStyles,
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right", cellWidth: 30 },
        2: { halign: "right", cellWidth: 32 },
        3: { halign: "right", cellWidth: 34 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 32 },
      },
    });
  } else if (type === "padron") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(91, 42, 94);
    doc.text("PADRON NOMINAL Y FICHA CLINICA DE GESTANTES", 14, currentY);

    const gestantesSorted = [...view.patients].sort((a, b) =>
      a.firstName.localeCompare(b.firstName)
    );

    const rows = gestantesSorted.map((p, idx) => [
      `${idx + 1}`,
      p.dni,
      `${p.firstName} ${p.lastName}`,
      `${p.age}`,
      p.community,
      `${p.weeks}s`,
      fechaCorta(p.fppKey),
      `${p.hbCorrected}`,
      ANEMIA_LABEL[p.anemia],
      RISK_LABEL[p.riskLevel],
      `${p.adherence30}%`,
      p.nextAppointment ? `${fechaCorta(p.nextAppointment.dateKey)}` : "—",
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: 14, right: 14 },
      head: [[
        "N°", "DNI", "Apellidos y Nombres", "Edad", "Comunidad", "EG", "FPP", "Hb", "Anemia", "Riesgo", "Adh.", "Prox. Cita"
      ]],
      body: rows.length > 0 ? rows : [["—", "—", "Sin registros", "—", "—", "—", "—", "—", "—", "—", "—", "—"]],
      theme: "plain",
      headStyles: baseHeadStyles,
      bodyStyles: {
        ...baseTableStyles,
        fontSize: 7,
        cellPadding: 1.5,
      },
      alternateRowStyles: baseAlternateStyles,
      columnStyles: {
        0: { halign: "center", cellWidth: 7 },
        1: { halign: "center", cellWidth: 16 },
        2: { fontStyle: "bold", cellWidth: 36 },
        3: { halign: "center", cellWidth: 9 },
        4: { cellWidth: 20 },
        5: { halign: "center", cellWidth: 9 },
        6: { halign: "center", cellWidth: 15 },
        7: { halign: "right", fontStyle: "bold", cellWidth: 10 },
        8: { halign: "center", cellWidth: 16 },
        9: { halign: "center", cellWidth: 16 },
        10: { halign: "right", cellWidth: 11 },
        11: { halign: "center", cellWidth: 17 },
      },
    });
  } else if (type === "territorial") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(91, 42, 94);
    doc.text("MONITOREO TERRITORIAL POR COMUNIDADES Y SECTORES", 14, currentY);

    const commRows = report.porComunidad.map((c) => [
      c.community,
      `${c.gestantes}`,
      `${c.riesgoAlto}`,
      `${c.anemiaCount}`,
      `${c.adherenciaPromedio}%`,
    ]);

    const totalRiesgoAlto = report.porComunidad.reduce((acc, c) => acc + c.riesgoAlto, 0);
    const totalAnemia = report.porComunidad.reduce((acc, c) => acc + c.anemiaCount, 0);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: 14, right: 14 },
      head: [["Comunidad / Sector", "Total Gestantes", "Casos Alto Riesgo", "Casos Anemia Mod./Sev.", "Adherencia Media"]],
      body: commRows.length > 0 ? commRows : [["Sin comunidades registradas", "0", "0", "0", "0%"]],
      foot: [["TOTAL GENERAL", `${report.gestantes}`, `${totalRiesgoAlto}`, `${totalAnemia}`, `${report.adherenciaPromedio}%`]],
      theme: "plain",
      headStyles: baseHeadStyles,
      bodyStyles: baseTableStyles,
      footStyles: baseFootStyles,
      alternateRowStyles: baseAlternateStyles,
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right", cellWidth: 32 },
        2: { halign: "right", cellWidth: 34 },
        3: { halign: "right", cellWidth: 36 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 32 },
      },
    });
  } else if (type === "alertas") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(91, 42, 94);
    doc.text("AUDITORIA DE ALERTAS Y URGENCIAS OBSTETRICAS", 14, currentY);

    const periodAlerts = [...view.alerts]
      .filter((a) => a.atISO.slice(0, 10) >= fromKey)
      .sort((a, b) => b.atISO.localeCompare(a.atISO));

    const alertRows = periodAlerts.map((a) => [
      a.atISO.slice(0, 16).replace("T", " "),
      patientNameOf(view, a.patientId),
      patientDniOf(view, a.patientId),
      ALERT_LABEL[a.type] || a.type,
      `${a.title}: ${a.detail}`,
      a.status === "abierta" ? "PENDIENTE" : "ATENDIDA",
      a.note || "Sin observaciones",
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: 14, right: 14 },
      head: [["Fecha/Hora", "Gestante", "DNI", "Tipo", "Signos / Sintomas", "Estado", "Resolucion"]],
      body: alertRows.length > 0 ? alertRows : [["—", "Sin alertas", "—", "—", "Sin registros", "—", "—"]],
      theme: "plain",
      headStyles: baseHeadStyles,
      bodyStyles: {
        ...baseTableStyles,
        fontSize: 7,
      },
      alternateRowStyles: baseAlternateStyles,
      columnStyles: {
        0: { cellWidth: 26 },
        1: { fontStyle: "bold", cellWidth: 32 },
        2: { halign: "center", cellWidth: 18 },
        3: { cellWidth: 22 },
        4: { cellWidth: 38 },
        5: { halign: "center", fontStyle: "bold", cellWidth: 20 },
        6: { cellWidth: 26 },
      },
    });
  }

  // Pie de página en todas las páginas generadas
  drawDocPdfFooter(doc, view);

  return doc;
}

/**
 * Exporta el reporte como PDF vectorial empresarial de alta fidelidad.
 */
export async function exportReportPdf(ctx: ExportContext): Promise<void> {
  const type: ReportType = ctx.reportType || "ejecutivo";
  const fileName = `Informe_${type.toUpperCase()}_VitMaterna_${ctx.view.todayKey}.pdf`;
  const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

  const doc = generateCorporatePdf(ctx);

  if (isWeb) {
    doc.save(fileName);
    return;
  }

  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");

  const base64 = doc.output("datauristring").split(",")[1];
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error("No hay carpeta temporal disponible");
  const dest = `${cacheDir}${fileName}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, {
      mimeType: "application/pdf",
      dialogTitle: `Informe ${REPORT_TYPE_LABELS[type].title} (PDF)`,
      UTI: "com.adobe.pdf",
    });
  }
}

/** Abre el diálogo de impresión directa del navegador o sistema */
export async function printReport(ctx: ExportContext): Promise<void> {
  const html = buildReportHtml(ctx);
  const Print = await import("expo-print");
  await Print.printAsync({ html });
}

// ============================================================================
// 3. EXPORTAR EXCEL (.XLSX) PROFESIONAL CON PALETA OFICIAL VITMATERNA (ExcelJS)
// ============================================================================

const XLS_THEME = {
  fontName: "Calibri",
  colors: {
    plum: "FF5B2A5E", // warmPlum.main (Ciruela Institucional)
    plumDeep: "FF48214B", // warmPlum.deep
    plumSoft: "FFF4ECF5", // warmPlum.soft
    teal: "FF0C8174", // warmTeal.main (Teal Salud)
    tealDeep: "FF0A6B60",
    ink: "FF33302A", // gwarm.ink (Tinta oscura)
    inkSoft: "FF6E6557", // gwarm.inkSoft (Tinta secundaria)
    bgWarm: "FFFAF4EA", // gwarm.bg (Papel Crema)
    zebra: "FFFAF6EF", // Crema sutil para filas alternadas
    border: "FFEADCC6", // gwarm.border
    borderStrong: "FFDFD1B8",
    white: "FFFFFFFF",
    green: "FF1F9D6B",
    greenSoft: "FFEAF7F0",
    amber: "FFA97613",
    amberSoft: "FFFBF4E3",
    red: "FFD64545",
    redSoft: "FFFBEDED",
  },
};

const borderWarmThin: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: XLS_THEME.colors.border } },
  bottom: { style: "thin", color: { argb: XLS_THEME.colors.border } },
  left: { style: "thin", color: { argb: XLS_THEME.colors.border } },
  right: { style: "thin", color: { argb: XLS_THEME.colors.border } },
};

const borderWarmDoubleBottom: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: XLS_THEME.colors.borderStrong } },
  bottom: { style: "double", color: { argb: XLS_THEME.colors.plum } },
  left: { style: "thin", color: { argb: XLS_THEME.colors.border } },
  right: { style: "thin", color: { argb: XLS_THEME.colors.border } },
};

function formatHeaderBanner(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  title: string,
  colSpan: number,
  bgColor: string = XLS_THEME.colors.plum,
  fontSize: number = 11
): void {
  ws.mergeCells(rowNum, 1, rowNum, colSpan);
  const row = ws.getRow(rowNum);
  row.height = 24;
  const cell = row.getCell(1);
  cell.value = title;
  cell.font = { name: XLS_THEME.fontName, size: fontSize, bold: true, color: { argb: XLS_THEME.colors.white } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
}

function formatSectionHeader(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  title: string,
  colSpan: number
): void {
  ws.mergeCells(rowNum, 1, rowNum, colSpan);
  const row = ws.getRow(rowNum);
  row.height = 22;
  const cell = row.getCell(1);
  cell.value = title;
  cell.font = { name: XLS_THEME.fontName, size: 10, bold: true, color: { argb: XLS_THEME.colors.white } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLS_THEME.colors.plum } };
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
}

function formatTableHeadRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  headers: string[],
  alignments?: ("left" | "center" | "right")[],
  bgColor: string = XLS_THEME.colors.plumDeep
): void {
  const row = ws.getRow(rowNum);
  row.height = 22;
  headers.forEach((h, idx) => {
    const cell = row.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: XLS_THEME.fontName, size: 9.5, bold: true, color: { argb: XLS_THEME.colors.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.border = borderWarmThin;
    cell.alignment = {
      vertical: "middle",
      horizontal: alignments?.[idx] || "left",
    };
  });
}

function formatDataRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  values: (string | number | undefined | null)[],
  isEven: boolean,
  alignments?: ("left" | "center" | "right")[],
  boldIndices?: number[],
  statusOverrides?: Record<number, { fill: string; color: string }>
): void {
  const row = ws.getRow(rowNum);
  row.height = 19;
  const fillArgb = isEven ? XLS_THEME.colors.zebra : XLS_THEME.colors.white;

  values.forEach((v, idx) => {
    const cell = row.getCell(idx + 1);
    cell.value = v ?? "";
    const isBold = boldIndices?.includes(idx) ?? false;
    const override = statusOverrides?.[idx];

    cell.font = {
      name: XLS_THEME.fontName,
      size: 9.5,
      bold: isBold || !!override,
      color: { argb: override?.color || XLS_THEME.colors.ink },
    };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: override?.fill || fillArgb } };
    cell.border = borderWarmThin;
    cell.alignment = {
      vertical: "middle",
      horizontal: alignments?.[idx] || "left",
    };
  });
}

function formatTotalRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  values: (string | number)[],
  alignments?: ("left" | "center" | "right")[]
): void {
  const row = ws.getRow(rowNum);
  row.height = 21;
  values.forEach((v, idx) => {
    const cell = row.getCell(idx + 1);
    cell.value = v;
    cell.font = { name: XLS_THEME.fontName, size: 9.5, bold: true, color: { argb: XLS_THEME.colors.ink } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLS_THEME.colors.bgWarm } };
    cell.border = borderWarmDoubleBottom;
    cell.alignment = {
      vertical: "middle",
      horizontal: alignments?.[idx] || "left",
    };
  });
}

export async function exportReportXlsx(ctx: ExportContext): Promise<void> {
  const report = safeReport(ctx.report);
  const { view } = ctx;
  const fromKey = ctx.period === "d30" ? addDaysToKey(view.todayKey, -30) : "0000-00-00";

  const totalGestantes = report.gestantes;
  const totalCitas = report.asistencia.asistidas + report.asistencia.noAsistidas;
  const pctOf = (count: number) =>
    totalGestantes > 0 ? `${Math.round((count / totalGestantes) * 100)}%` : "0%";

  const totalRiesgoAlto = report.porComunidad.reduce((acc, c) => acc + c.riesgoAlto, 0);
  const totalAnemia = report.porComunidad.reduce((acc, c) => acc + c.anemiaCount, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = "VitMaterna";
  wb.created = new Date();

  // =========================================================================
  // HOJA 1 — Resumen Ejecutivo (5 Columnas Estilizadas con Paleta VitMaterna)
  // =========================================================================
  const ws1 = wb.addWorksheet("Resumen Ejecutivo", {
    views: [{ showGridLines: true }],
  });
  ws1.columns = [
    { width: 34 },
    { width: 48 },
    { width: 20 },
    { width: 20 },
    { width: 28 },
  ];

  let r1 = 1;
  formatHeaderBanner(ws1, r1++, "MINISTERIO DE SALUD — DIRESA APURÍMAC — RED DE SALUD ANDAHUAYLAS", 5, XLS_THEME.colors.plum, 11);
  formatHeaderBanner(ws1, r1++, "VITMATERNA: INFORME EJECUTIVO CONSOLIDADO DE SALUD MATERNO-PERINATAL", 5, XLS_THEME.colors.plumDeep, 10);
  r1++; // Espacio

  // Bloque de Metadatos
  const metaRowsData = [
    ["Establecimiento:", `${view.center.name} (Categoría I-4)`, "", "Periodo:", periodLabel(ctx.period)],
    ["Altitud / Corrección:", `${view.center.altitudeMsnm} m.s.n.m. (-${view.center.hbFactor} g/dL Hb)`, "", "Fecha Emisión:", fechaCompleta(view.todayKey)],
    ["Población Registrada:", `${totalGestantes} gestantes activas`, "", "Sistema:", "VitMaterna v1.0"],
  ];
  metaRowsData.forEach((mData) => {
    const row = ws1.getRow(r1);
    row.height = 19;
    mData.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      const isLabel = cIdx === 0 || cIdx === 3;
      cell.font = {
        name: XLS_THEME.fontName,
        size: 9,
        bold: isLabel,
        color: { argb: isLabel ? XLS_THEME.colors.inkSoft : XLS_THEME.colors.ink },
      };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLS_THEME.colors.bgWarm } };
      cell.border = borderWarmThin;
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    r1++;
  });
  r1++; // Espacio

  // Sección 1: Gestión y Población
  formatSectionHeader(ws1, r1++, "1. RESUMEN DE GESTIÓN Y POBLACIÓN GESTANTE", 5);
  formatTableHeadRow(ws1, r1++, ["Indicador / Área", "Detalle Clínico y Operativo", "Cantidad / Casos", "Tasa / Proporción", "Estado / Cobertura"], ["left", "left", "right", "right", "left"]);
  const sec1Rows = [
    ["Población Gestante Activa", "Gestantes bajo control y monitoreo continuo", totalGestantes, "100%", "En seguimiento"],
    ["Distribución Gestacional", `1er Trim: ${report.trimestres.t1} | 2do Trim: ${report.trimestres.t2} | 3er Trim: ${report.trimestres.t3}`, totalGestantes, "100%", "Padrón activo"],
    ["Asistencia a Citas Prenatales", `${report.asistencia.asistidas} citas asistidas de ${totalCitas} programadas`, `${report.asistencia.asistidas} / ${totalCitas}`, `${report.asistencia.pct}%`, `${report.asistencia.noAsistidas} faltas/pendientes`],
    ["Adherencia a Suplementación", `Tomas cumplidas de hierro y ácido fólico (${report.coberturaSuplementacion}% regular >= 75%)`, `${report.adherenciaPromedio}%`, `${report.adherenciaPromedio}%`, "Monitoreo diario"],
    ["Alertas y Urgencias Obstétricas", `${report.alertas.atendidas} atendidas oportunamente | ${report.alertas.abiertas} pendientes`, report.alertas.total, `${report.alertas.pct}% efic.`, report.alertas.abiertas > 0 ? "Requiere atención" : "Controlado"],
  ];
  sec1Rows.forEach((rowVals, idx) => {
    formatDataRow(ws1, r1++, rowVals, idx % 2 === 1, ["left", "left", "right", "right", "left"], [0, 2, 3]);
  });
  r1++; // Espacio

  // Sección 2: Tamizaje de Anemia
  formatSectionHeader(ws1, r1++, "2. TAMIZAJE DE ANEMIA GESTACIONAL (Hb Corregida a 2,926 msnm)", 5);
  formatTableHeadRow(ws1, r1++, ["Diagnóstico Clínico", "Criterio de Hemoglobina Corregida", "Casos Evaluados", "% Población", "Nivel de Severidad"], ["left", "center", "right", "right", "left"]);
  const sec2Rows = [
    ["Normal (Sin Anemia)", ">= 11.0 g/dL", report.anemia.normal, pctOf(report.anemia.normal), "Fisiológico"],
    ["Anemia Leve", "10.0 - 10.9 g/dL", report.anemia.leve, pctOf(report.anemia.leve), "Suplementación"],
    ["Anemia Moderada", "7.0 - 9.9 g/dL", report.anemia.moderada, pctOf(report.anemia.moderada), "Tratamiento terapéutico"],
    ["Anemia Severa", "< 7.0 g/dL", report.anemia.severa, pctOf(report.anemia.severa), "Alerta crítica / Referencia"],
  ];
  sec2Rows.forEach((rowVals, idx) => {
    const override =
      idx === 0
        ? { 4: { fill: XLS_THEME.colors.greenSoft, color: XLS_THEME.colors.green } }
        : idx === 1
        ? { 4: { fill: XLS_THEME.colors.amberSoft, color: XLS_THEME.colors.amber } }
        : { 4: { fill: XLS_THEME.colors.redSoft, color: XLS_THEME.colors.red } };
    formatDataRow(ws1, r1++, rowVals, idx % 2 === 1, ["left", "center", "right", "right", "left"], [0, 2], override);
  });
  formatTotalRow(ws1, r1++, ["TOTAL EVALUADAS", "Todas las gestantes con tamizaje", totalGestantes, "100%", "Tamizaje completo"], ["left", "center", "right", "right", "left"]);
  r1++; // Espacio

  // Sección 3: Riesgo Obstétrico
  formatSectionHeader(ws1, r1++, "3. ESTRATIFICACIÓN DE RIESGO OBSTÉTRICO (Semáforo MINSA)", 5);
  formatTableHeadRow(ws1, r1++, ["Nivel de Riesgo", "Criterio Clínico y Plan de Acción", "Casos Identificados", "% Población", "Plan de Intervención"], ["left", "left", "right", "right", "left"]);
  const sec3Rows = [
    ["Bajo Riesgo (Verde)", "Score 0 - Sin factores de riesgo críticos", report.riesgo.verde, pctOf(report.riesgo.verde), "Control prenatal habitual"],
    ["Riesgo Medio (Amarillo)", "Score 2-3 - Factores sociodemográficos / antecedentes", report.riesgo.amarillo, pctOf(report.riesgo.amarillo), "Vigilancia estrecha"],
    ["Alto Riesgo (Rojo)", "Score >= 4 - Patologías activas / alarma obstétrica", report.riesgo.rojo, pctOf(report.riesgo.rojo), "Atención prioritaria / Referencia"],
  ];
  sec3Rows.forEach((rowVals, idx) => {
    const override =
      idx === 0
        ? { 0: { fill: XLS_THEME.colors.greenSoft, color: XLS_THEME.colors.green } }
        : idx === 1
        ? { 0: { fill: XLS_THEME.colors.amberSoft, color: XLS_THEME.colors.amber } }
        : { 0: { fill: XLS_THEME.colors.redSoft, color: XLS_THEME.colors.red } };
    formatDataRow(ws1, r1++, rowVals, idx % 2 === 1, ["left", "left", "right", "right", "left"], [0, 2], override);
  });
  formatTotalRow(ws1, r1++, ["TOTAL ESTRATIFICADAS", "Población total con score calculado", totalGestantes, "100%", "Estratificación 100%"], ["left", "left", "right", "right", "left"]);
  r1++; // Espacio

  // Sección 4: Monitoreo Territorial Resumido
  formatSectionHeader(ws1, r1++, "4. MONITOREO TERRITORIAL POR COMUNIDADES", 5);
  formatTableHeadRow(ws1, r1++, ["Comunidad / Sector", "Total Gestantes", "Alto Riesgo (Rojo)", "Anemia Mod./Sev.", "Adherencia Promedio (%)"], ["left", "right", "right", "right", "right"], XLS_THEME.colors.teal);
  report.porComunidad.forEach((c, idx) => {
    formatDataRow(ws1, r1++, [c.community, c.gestantes, c.riesgoAlto, c.anemiaCount, `${c.adherenciaPromedio}%`], idx % 2 === 1, ["left", "right", "right", "right", "right"], [0, 1]);
  });
  formatTotalRow(ws1, r1++, ["TOTAL GENERAL", totalGestantes, totalRiesgoAlto, totalAnemia, `${report.adherenciaPromedio}%`], ["left", "right", "right", "right", "right"]);

  // =========================================================================
  // HOJA 2 — Padrón Nominal Completo de Gestantes
  // =========================================================================
  const ws2 = wb.addWorksheet("Padrón Gestantes", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
  });
  ws2.columns = [
    { width: 6 },
    { width: 14 },
    { width: 34 },
    { width: 8 },
    { width: 24 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
    { width: 22 },
    { width: 20 },
    { width: 18 },
    { width: 36 },
  ];

  let r2 = 1;
  formatHeaderBanner(ws2, r2++, "MINISTERIO DE SALUD — DIRESA APURÍMAC — RED DE SALUD ANDAHUAYLAS", 16, XLS_THEME.colors.plum, 11);
  formatHeaderBanner(ws2, r2++, "PADRÓN NOMINAL Y FICHA CLÍNICA DE GESTANTES — C.S. TALAVERA", 16, XLS_THEME.colors.plumDeep, 10);
  formatHeaderBanner(ws2, r2++, `Periodo: ${periodLabel(ctx.period)} | Fecha de Emisión: ${fechaCompleta(view.todayKey)} | Total Gestantes: ${view.patients.length}`, 16, XLS_THEME.colors.bgWarm, 9);
  ws2.getRow(3).getCell(1).font = { name: XLS_THEME.fontName, size: 9, bold: true, color: { argb: XLS_THEME.colors.inkSoft } };

  const padronHeaders = [
    "N°", "DNI", "Apellidos y Nombres", "Edad", "Comunidad / Sector", "Teléfono",
    "FUM (Regla)", "FPP (Parto)", "Edad Gest.", "Trimestre", "Hb Observada",
    "Hb Corregida", "Diagnóstico Anemia", "Nivel de Riesgo", "Adherencia 30d", "Próxima Cita Programada",
  ];
  formatTableHeadRow(ws2, r2++, padronHeaders, [
    "center", "center", "left", "center", "left", "center",
    "center", "center", "center", "center", "right",
    "right", "center", "center", "right", "left",
  ], XLS_THEME.colors.plum);

  const padronSorted = [...view.patients].sort((a, b) => a.firstName.localeCompare(b.firstName));
  padronSorted.forEach((p, idx) => {
    const riskOverride =
      p.riskLevel === "rojo"
        ? { fill: XLS_THEME.colors.redSoft, color: XLS_THEME.colors.red }
        : p.riskLevel === "amarillo"
        ? { fill: XLS_THEME.colors.amberSoft, color: XLS_THEME.colors.amber }
        : { fill: XLS_THEME.colors.greenSoft, color: XLS_THEME.colors.green };

    const anemiaOverride =
      p.anemia === "severa" || p.anemia === "moderada"
        ? { fill: XLS_THEME.colors.redSoft, color: XLS_THEME.colors.red }
        : p.anemia === "leve"
        ? { fill: XLS_THEME.colors.amberSoft, color: XLS_THEME.colors.amber }
        : { fill: XLS_THEME.colors.greenSoft, color: XLS_THEME.colors.green };

    formatDataRow(
      ws2,
      r2++,
      [
        idx + 1,
        p.dni,
        `${p.firstName} ${p.lastName}`,
        p.age,
        p.community,
        p.phone || "—",
        p.fumKey,
        p.fppKey,
        `${p.weeks} sem`,
        `T${p.trimester}`,
        p.hbObserved,
        p.hbCorrected,
        ANEMIA_LABEL[p.anemia],
        RISK_LABEL[p.riskLevel],
        `${p.adherence30}%`,
        p.nextAppointment ? `${p.nextAppointment.dateKey} ${p.nextAppointment.time} (${p.nextAppointment.motivo})` : "Sin cita programada",
      ],
      idx % 2 === 1,
      [
        "center", "center", "left", "center", "left", "center",
        "center", "center", "center", "center", "right",
        "right", "center", "center", "right", "left",
      ],
      [2, 11, 14],
      {
        12: anemiaOverride,
        13: riskOverride,
      }
    );
  });

  // =========================================================================
  // HOJA 3 — Registro de Controles y Citas
  // =========================================================================
  const ws3 = wb.addWorksheet("Controles y Citas", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
  });
  ws3.columns = [
    { width: 14 },
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 32 },
    { width: 22 },
    { width: 18 },
    { width: 34 },
    { width: 18 },
    { width: 24 },
  ];

  let r3 = 1;
  formatHeaderBanner(ws3, r3++, "MINISTERIO DE SALUD — DIRESA APURÍMAC — RED DE SALUD ANDAHUAYLAS", 10, XLS_THEME.colors.plum, 11);
  formatHeaderBanner(ws3, r3++, "REGISTRO DE CONTROLES PRENATALES Y CITAS AGENDADAS — C.S. TALAVERA", 10, XLS_THEME.colors.plumDeep, 10);
  formatHeaderBanner(ws3, r3++, `Periodo: ${periodLabel(ctx.period)} | Fecha de Emisión: ${fechaCompleta(view.todayKey)}`, 10, XLS_THEME.colors.bgWarm, 9);
  ws3.getRow(3).getCell(1).font = { name: XLS_THEME.fontName, size: 9, bold: true, color: { argb: XLS_THEME.colors.inkSoft } };

  const citasHeaders = [
    "ID Cita", "Fecha", "Hora", "DNI Gestante", "Apellidos y Nombres",
    "Comunidad", "Control Prenatal", "Motivo de Atención", "Estado de Cita", "Lugar de Atención",
  ];
  formatTableHeadRow(ws3, r3++, citasHeaders, [
    "center", "center", "center", "center", "left",
    "left", "center", "left", "center", "left",
  ], XLS_THEME.colors.plum);

  const appointmentsFiltered = [...view.appointments]
    .filter((a) => a.dateKey >= fromKey)
    .sort((a, b) =>
      a.dateKey === b.dateKey ? a.time.localeCompare(b.time) : a.dateKey.localeCompare(b.dateKey)
    );

  appointmentsFiltered.forEach((a, idx) => {
    const estadoOverride =
      a.estado === "completada"
        ? { fill: XLS_THEME.colors.greenSoft, color: XLS_THEME.colors.green }
        : a.estado === "cancelada"
        ? { fill: XLS_THEME.colors.redSoft, color: XLS_THEME.colors.red }
        : { fill: XLS_THEME.colors.amberSoft, color: XLS_THEME.colors.amber };

    formatDataRow(
      ws3,
      r3++,
      [
        a.id,
        a.dateKey,
        a.time,
        patientDniOf(view, a.patientId),
        patientNameOf(view, a.patientId),
        view.patients.find((p) => p.id === a.patientId)?.community || "—",
        a.control ? `Control ${a.control} de 8` : "Cita Adicional",
        a.motivo,
        STATUS_LABEL[a.estado] || a.estado,
        a.lugar || view.center.name,
      ],
      idx % 2 === 1,
      [
        "center", "center", "center", "center", "left",
        "left", "center", "left", "center", "left",
      ],
      [4, 8],
      {
        8: estadoOverride,
      }
    );
  });

  // =========================================================================
  // HOJA 4 — Monitoreo Territorial por Comunidades
  // =========================================================================
  const ws4 = wb.addWorksheet("Monitoreo Territorial", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
  });
  ws4.columns = [
    { width: 32 },
    { width: 18 },
    { width: 24 },
    { width: 26 },
    { width: 24 },
  ];

  let r4 = 1;
  formatHeaderBanner(ws4, r4++, "MINISTERIO DE SALUD — DIRESA APURÍMAC — RED DE SALUD ANDAHUAYLAS", 5, XLS_THEME.colors.plum, 11);
  formatHeaderBanner(ws4, r4++, "MONITOREO EPIDEMIOLÓGICO TERRITORIAL POR COMUNIDADES — C.S. TALAVERA", 5, XLS_THEME.colors.plumDeep, 10);
  formatHeaderBanner(ws4, r4++, `Periodo: ${periodLabel(ctx.period)} | Fecha de Emisión: ${fechaCompleta(view.todayKey)}`, 5, XLS_THEME.colors.bgWarm, 9);
  ws4.getRow(3).getCell(1).font = { name: XLS_THEME.fontName, size: 9, bold: true, color: { argb: XLS_THEME.colors.inkSoft } };

  const comHeaders = [
    "Comunidad / Sector", "Total Gestantes", "Casos Alto Riesgo (Rojo)", "Casos Anemia Mod./Sev.", "Adherencia Promedio (%)",
  ];
  formatTableHeadRow(ws4, r4++, comHeaders, ["left", "right", "right", "right", "right"], XLS_THEME.colors.teal);

  report.porComunidad.forEach((c, idx) => {
    formatDataRow(
      ws4,
      r4++,
      [c.community, c.gestantes, c.riesgoAlto, c.anemiaCount, `${c.adherenciaPromedio}%`],
      idx % 2 === 1,
      ["left", "right", "right", "right", "right"],
      [0, 1]
    );
  });
  formatTotalRow(ws4, r4++, ["TOTAL GENERAL", totalGestantes, totalRiesgoAlto, totalAnemia, `${report.adherenciaPromedio}%`], ["left", "right", "right", "right", "right"]);

  // =========================================================================
  // HOJA 5 — Alertas y Emergencias Obstétricas
  // =========================================================================
  const ws5 = wb.addWorksheet("Alertas y Emergencias", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
  });
  ws5.columns = [
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 32 },
    { width: 16 },
    { width: 20 },
    { width: 26 },
    { width: 42 },
    { width: 16 },
    { width: 40 },
  ];

  let r5 = 1;
  formatHeaderBanner(ws5, r5++, "MINISTERIO DE SALUD — DIRESA APURÍMAC — RED DE SALUD ANDAHUAYLAS", 10, XLS_THEME.colors.plum, 11);
  formatHeaderBanner(ws5, r5++, "AUDITORÍA DE ALERTAS, EMERGENCIAS Y SEÑALES DE ALARMA — C.S. TALAVERA", 10, XLS_THEME.colors.plumDeep, 10);
  formatHeaderBanner(ws5, r5++, `Periodo: ${periodLabel(ctx.period)} | Fecha de Emisión: ${fechaCompleta(view.todayKey)}`, 10, XLS_THEME.colors.bgWarm, 9);
  ws5.getRow(3).getCell(1).font = { name: XLS_THEME.fontName, size: 9, bold: true, color: { argb: XLS_THEME.colors.inkSoft } };

  const alertHeaders = [
    "ID Alerta", "Fecha y Hora", "DNI Gestante", "Nombre de Gestante", "Teléfono",
    "Tipo de Alerta", "Título del Reporte", "Signos de Alarma / Detalle", "Estado", "Resolución / Nota Clínica",
  ];
  formatTableHeadRow(ws5, r5++, alertHeaders, [
    "center", "center", "center", "left", "center",
    "center", "left", "left", "center", "left",
  ], XLS_THEME.colors.plum);

  const alertsFiltered = [...view.alerts]
    .filter((a) => a.atISO.slice(0, 10) >= fromKey)
    .sort((a, b) => b.atISO.localeCompare(a.atISO));

  alertsFiltered.forEach((a, idx) => {
    const isUrgent = a.type === "emergencia" || a.type === "alarma";
    const typeOverride = isUrgent
      ? { fill: XLS_THEME.colors.redSoft, color: XLS_THEME.colors.red }
      : { fill: XLS_THEME.colors.amberSoft, color: XLS_THEME.colors.amber };

    const statusOverride =
      a.status === "abierta"
        ? { fill: XLS_THEME.colors.redSoft, color: XLS_THEME.colors.red }
        : { fill: XLS_THEME.colors.greenSoft, color: XLS_THEME.colors.green };

    formatDataRow(
      ws5,
      r5++,
      [
        a.id,
        a.atISO.slice(0, 16).replace("T", " "),
        patientDniOf(view, a.patientId),
        patientNameOf(view, a.patientId),
        patientPhoneOf(view, a.patientId),
        ALERT_LABEL[a.type] || a.type,
        a.title,
        a.detail,
        a.status === "abierta" ? "PENDIENTE" : "ATENDIDA",
        a.note || "Sin observaciones",
      ],
      idx % 2 === 1,
      [
        "center", "center", "center", "left", "center",
        "center", "left", "left", "center", "left",
      ],
      [3, 8],
      {
        5: typeOverride,
        8: statusOverride,
      }
    );
  });

  const fileName = `Reporte_Consolidado_VitMaterna_${view.todayKey}.xlsx`;
  const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

  const buffer = await wb.xlsx.writeBuffer();

  if (isWeb) {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  // Móvil (React Native / Expo)
  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");

  const uint8 = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error("No hay carpeta temporal disponible");
  const dest = `${cacheDir}${fileName}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Reporte Clínico VitMaterna (Excel)",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });
  }
}
