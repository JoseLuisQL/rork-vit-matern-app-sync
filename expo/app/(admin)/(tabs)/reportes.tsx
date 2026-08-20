/**
 * Reportes de administración rediseñados: números clave, exportación
 * profesional (PDF con plantilla de marca y Excel con varias hojas),
 * indicadores MINSA calculados por el servidor, anemia, semáforo,
 * trimestres, desglose por comunidad, visitas y asistencia semanal.
 * Adaptado con arquitectura responsiva Web (2 columnas en escritorio).
 */
import { FileText, Sheet } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, risk, warmPlum } from "@/constants/theme";
import { ANEMIA_LABEL, RISK_LABEL } from "@/constants/labels";
import { ILU } from "@/constants/illustrations";
import { useResponsive } from "@/hooks/useResponsive";
import { fechaCorta } from "@/lib/format";
import { exportReportPdf, exportReportXlsx, type ReportPeriod } from "@/lib/reportExport";
import { useApp } from "@/providers/AppProvider";
import type { AnemiaClass, ReportBlock, RiskLevel } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Segmented } from "@/components/Segmented";
import { StatGroup } from "@/components/StatGroup";
import { useToast } from "@/components/Toast";
import { WebCol, WebRow } from "@/components/web/WebGrid";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmPlum;

function pctColor(pct: number): string {
  if (pct >= 75) return gwarm.teal;
  if (pct >= 50) return gwarm.amber;
  return gwarm.rose;
}

function IndicatorCard({
  title,
  pct,
  detail,
}: {
  title: string;
  pct: number;
  detail: string;
}): React.ReactElement {
  const color = pctColor(pct);
  return (
    <Card style={styles.indicatorCard}>
      <View style={styles.indicatorTop}>
        <Text style={styles.indicatorTitle}>{title}</Text>
        <Text style={[styles.indicatorPct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.indicatorDetail}>{detail}</Text>
    </Card>
  );
}

/** Normaliza los campos nuevos por si el teléfono guarda un reporte antiguo. */
function safeReport(report: ReportBlock): ReportBlock {
  return {
    ...report,
    visitas: report.visitas ?? { programadas: 0, realizadas: 0, pct: 0 },
    trimestres: report.trimestres ?? { t1: 0, t2: 0, t3: 0 },
    porComunidad: report.porComunidad ?? [],
    asistenciaSemanal: report.asistenciaSemanal ?? [],
  };
}

export default function ReportesScreen(): React.ReactElement {
  const { view, online } = useApp();
  const { show } = useToast();
  const [period, setPeriod] = useState<ReportPeriod>("d30");
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const { isDesktop, isTablet } = useResponsive();

  const isWide = isDesktop || isTablet;

  const rawReport = view?.reports?.[period] ?? null;
  const report = useMemo(() => (rawReport ? safeReport(rawReport) : null), [rawReport]);

  const doExport = useCallback(
    async (kind: "pdf" | "xlsx") => {
      if (!view || !report) return;
      setExporting(kind);
      try {
        if (kind === "pdf") {
          await exportReportPdf({ report, period, view });
          show("Reporte PDF listo para compartir", "success");
        } else {
          await exportReportXlsx({ report, period, view });
          show("Reporte Excel listo para compartir", "success");
        }
      } catch (e) {
        console.log("[VitMaterna] Error al exportar:", e);
        show(
          e instanceof Error && e.message.length > 0
            ? `No se pudo exportar: ${e.message}`
            : "No se pudo exportar el reporte",
          "error",
        );
      } finally {
        setExporting(null);
      }
    },
    [view, report, period, show],
  );

  if (!report || !view) {
    return <View style={styles.container} />;
  }

  const maxWeekTotal = Math.max(1, ...report.asistenciaSemanal.map((w) => w.total));

  const renderKPIs = () => (
    <PopIn>
      <StatGroup
        items={[
          { key: "gestantes", value: `${report.gestantes}`, label: "Gestantes" },
          { key: "citas", value: `${report.citasHoy}`, label: "Citas hoy" },
          {
            key: "alertas",
            value: `${report.alertas.abiertas}`,
            label: "Alertas abiertas",
            color: report.alertas.abiertas > 0 ? gwarm.amber : gwarm.ink,
          },
        ]}
      />
    </PopIn>
  );

  const renderExportCard = () => (
    <PopIn delay={50}>
      <Card style={styles.exportCard}>
        <View style={styles.exportTop}>
          <Illustration source={ILU.reporte} width={74} height={74} />
          <View style={styles.exportInfo}>
            <Text style={styles.exportTitle}>Exportar reporte</Text>
            <Text style={styles.exportText}>
              Plantilla profesional con todos los indicadores, el detalle de gestantes, citas
              y alertas del periodo.
            </Text>
          </View>
        </View>
        <View style={styles.exportActions}>
          <AppButton
            title="PDF"
            onPress={() => void doExport("pdf")}
            color={gwarm.rose}
            variant="soft"
            icon={FileText}
            loading={exporting === "pdf"}
            disabled={exporting !== null}
            style={styles.flex}
            testID="btn-export-pdf"
          />
          <AppButton
            title="Excel (XLSX)"
            onPress={() => void doExport("xlsx")}
            color={gwarm.teal}
            variant="soft"
            icon={Sheet}
            loading={exporting === "xlsx"}
            disabled={exporting !== null}
            style={styles.flex}
            testID="btn-export-xlsx"
          />
        </View>
        {!online ? (
          <Text style={styles.exportNote}>
            Estás sin señal: se exporta con la última información guardada en el teléfono.
          </Text>
        ) : null}
      </Card>
    </PopIn>
  );

  const renderIndicators = () => (
    <View style={styles.colSection}>
      <PopIn delay={100}>
        <SectionHeader title="Indicadores clave" />
        <View style={styles.cardsGap}>
          <IndicatorCard
            title="Controles a tiempo"
            pct={report.controlesOportunos.pct}
            detail={`${report.controlesOportunos.asistidos} de ${report.controlesOportunos.esperados} controles esperados`}
          />
          <IndicatorCard
            title="Toman bien sus pastillas"
            pct={report.coberturaSuplementacion}
            detail="Gestantes que cumplen su tratamiento de hierro"
          />
          <IndicatorCard
            title="Adherencia promedio"
            pct={report.adherenciaPromedio}
            detail="Tomas cumplidas en los últimos 30 días"
          />
          <IndicatorCard
            title="Asistencia a citas"
            pct={report.asistencia.pct}
            detail={`${report.asistencia.asistidas} asistidas · ${report.asistencia.noAsistidas} faltaron o están pendientes`}
          />
          <IndicatorCard
            title="Alertas atendidas"
            pct={report.alertas.pct}
            detail={`${report.alertas.atendidas} de ${report.alertas.total} · ${report.alertas.abiertas} abiertas`}
          />
          <IndicatorCard
            title="Visitas domiciliarias"
            pct={report.visitas.pct}
            detail={`${report.visitas.realizadas} realizadas · ${report.visitas.programadas} programadas`}
          />
        </View>
      </PopIn>

      <PopIn delay={220}>
        <SectionHeader title="Trimestre de embarazo" />
        <View style={styles.triRow}>
          {(
            [
              { key: "t1", label: "1er trimestre", value: report.trimestres.t1 },
              { key: "t2", label: "2do trimestre", value: report.trimestres.t2 },
              { key: "t3", label: "3er trimestre", value: report.trimestres.t3 },
            ] as const
          ).map((t) => (
            <View key={t.key} style={styles.triCard}>
              <Text style={styles.triValue}>{t.value}</Text>
              <Text style={styles.triLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </PopIn>
    </View>
  );

  const renderChartsAndBreakdown = () => (
    <View style={styles.colSection}>
      <PopIn delay={140}>
        <SectionHeader title="Anemia" />
        <Card style={styles.distCard}>
          {(["severa", "moderada", "leve", "normal"] as AnemiaClass[]).map((cls) => {
            const count = report.anemia[cls];
            const pct = report.gestantes > 0 ? Math.round((count / report.gestantes) * 100) : 0;
            const color =
              cls === "normal" ? gwarm.teal : cls === "leve" ? gwarm.amber : gwarm.rose;
            return (
              <View key={cls} style={styles.distRow}>
                <Text style={styles.distLabel} numberOfLines={1}>
                  {ANEMIA_LABEL[cls]}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.max(pct, count > 0 ? 6 : 0)}%`, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={styles.distValue}>
                  {count} ({pct}%)
                </Text>
              </View>
            );
          })}
          <Text style={styles.distNote}>Hemoglobina ajustada por la altitud del centro.</Text>
        </Card>
      </PopIn>

      <PopIn delay={180}>
        <SectionHeader title="Semáforo de riesgo" />
        <Card style={styles.distCard}>
          {(["rojo", "amarillo", "verde"] as RiskLevel[]).map((level) => {
            const count = report.riesgo[level];
            const pct = report.gestantes > 0 ? Math.round((count / report.gestantes) * 100) : 0;
            return (
              <View key={level} style={styles.distRow}>
                <Text style={styles.distLabel} numberOfLines={1}>
                  {RISK_LABEL[level]}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.max(pct, count > 0 ? 6 : 0)}%`,
                        backgroundColor: risk[level].solid,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distValue}>
                  {count} ({pct}%)
                </Text>
              </View>
            );
          })}
        </Card>
      </PopIn>

      <PopIn delay={260}>
        <SectionHeader title="Por comunidad" />
        <Card style={styles.communityCard}>
          <View style={styles.communityHeader}>
            <Text style={[styles.commColBase, styles.commName]}>Comunidad</Text>
            <Text style={[styles.commColBase, styles.commColFixed]}>Gest.</Text>
            <Text style={[styles.commColBase, styles.commColFixed]}>Alto</Text>
            <Text style={[styles.commColBase, styles.commColFixed]}>Anemia</Text>
            <Text style={[styles.commColBase, styles.commLast]}>Adh.</Text>
          </View>
          {report.porComunidad.length === 0 ? (
            <Text style={styles.emptyText}>Sin comunidades registradas.</Text>
          ) : (
            report.porComunidad.map((c, index) => (
              <View key={c.community} style={[styles.communityRow, index > 0 && styles.rowBorder]}>
                <Text style={[styles.commCellBase, styles.commName]} numberOfLines={1}>
                  {c.community}
                </Text>
                <Text style={[styles.commCellBase, styles.commColFixed]}>{c.gestantes}</Text>
                <Text
                  style={[
                    styles.commCellBase,
                    styles.commColFixed,
                    { color: c.riesgoAlto > 0 ? gwarm.rose : gwarm.inkFaint },
                  ]}
                >
                  {c.riesgoAlto}
                </Text>
                <Text
                  style={[
                    styles.commCellBase,
                    styles.commColFixed,
                    { color: c.anemiaCount > 0 ? gwarm.amber : gwarm.inkFaint },
                  ]}
                >
                  {c.anemiaCount}
                </Text>
                <Text
                  style={[
                    styles.commCellBase,
                    styles.commLast,
                    { color: pctColor(c.adherenciaPromedio) },
                  ]}
                >
                  {c.adherenciaPromedio}%
                </Text>
              </View>
            ))
          )}
          <Text style={styles.distNote}>
            Alto = riesgo alto · Anemia = moderada o severa · Adh. = adherencia promedio.
          </Text>
        </Card>
      </PopIn>

      <PopIn delay={300}>
        <SectionHeader title="Asistencia por semana" />
        <Card style={styles.weeklyCard}>
          <View style={styles.weeklyChart}>
            {report.asistenciaSemanal.map((w) => {
              const pct = w.total > 0 ? w.asistidas / w.total : 0;
              const height = Math.max(6, Math.round((w.total / maxWeekTotal) * 84));
              return (
                <View key={w.startKey} style={styles.weekCol}>
                  <View style={[styles.weekBarBg, { height: 84 }]}>
                    <View style={[styles.weekBarTotal, { height }]}>
                      <View
                        style={[
                          styles.weekBarDone,
                          {
                            height: `${Math.round(pct * 100)}%`,
                            backgroundColor: pctColor(Math.round(pct * 100)),
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.weekValue}>
                    {w.asistidas}/{w.total}
                  </Text>
                  <Text style={styles.weekLabel} numberOfLines={1}>
                    {fechaCorta(w.startKey)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.distNote}>
            Citas asistidas sobre el total de cada semana (6 semanas).
          </Text>
        </Card>
      </PopIn>
    </View>
  );

  return (
    <View style={styles.container}>
      <WebContainer size="dashboard">
        <ScreenHeader
          title="Reportes"
          subtitle="Indicadores del centro de salud"
          right={<Illustration source={ILU.reporte} width={50} height={50} />}
        >
          <Segmented
            options={[
              { key: "d30", label: "Últimos 30 días" },
              { key: "total", label: "Histórico" },
            ]}
            value={period}
            onChange={(k) => setPeriod(k as ReportPeriod)}
            style={styles.segmented}
          />
        </ScreenHeader>
      </WebContainer>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="dashboard">
          <View style={styles.gapStack}>
            {renderKPIs()}
            {renderExportCard()}

            {isWide ? (
              <WebRow gap={20}>
                <WebCol flex={6}>{renderIndicators()}</WebCol>
                <WebCol flex={6}>{renderChartsAndBreakdown()}</WebCol>
              </WebRow>
            ) : (
              <View style={styles.mobileStack}>
                {renderIndicators()}
                {renderChartsAndBreakdown()}
              </View>
            )}

            <Text style={styles.footerNote}>
              {report.gestantes} gestantes activas · Referencia MINSA
            </Text>
          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  gapStack: {
    gap: 14,
  },
  mobileStack: {
    gap: 14,
  },
  colSection: {
    gap: 14,
  },
  segmented: { marginTop: 8 },
  cardsGap: { gap: 12 },
  exportCard: { gap: 12, borderColor: accent.mid, borderWidth: 1.5 },
  exportTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exportInfo: { flex: 1, minWidth: 0, gap: 2 },
  exportTitle: {
    fontFamily: gfonts.hand,
    fontSize: 22,
    lineHeight: 28,
    color: gwarm.ink,
  },
  exportText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  exportActions: { flexDirection: "row", gap: 8 },
  exportNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.amber,
  },
  indicatorCard: { gap: 8 },
  indicatorTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  indicatorTitle: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 24,
    color: gwarm.ink,
    flex: 1,
  },
  indicatorPct: {
    fontFamily: gfonts.hand,
    fontSize: 26,
    lineHeight: 32,
  },
  track: {
    height: 11,
    borderRadius: 999,
    backgroundColor: "#F1E9D8",
    overflow: "hidden" as const,
    flex: 1,
  },
  fill: { height: "100%", borderRadius: 999 },
  indicatorDetail: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  distCard: { gap: 12 },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  distLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
    width: 118,
  },
  distValue: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.ink,
    width: 58,
    textAlign: "right",
  },
  distNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkFaint,
    marginTop: 2,
  },
  triRow: { flexDirection: "row", gap: 10 },
  triCard: {
    flex: 1,
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 1,
  },
  triValue: {
    fontFamily: gfonts.hand,
    fontSize: 27,
    lineHeight: 33,
    color: accent.main,
  },
  triLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkSoft,
  },
  communityCard: { gap: 10 },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
  },
  commColBase: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
  commColFixed: {
    width: 46,
    textAlign: "center",
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  commCellBase: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.ink,
  },
  commName: { flex: 1, textAlign: "left" },
  commLast: { width: 52, textAlign: "right" },
  weeklyCard: { gap: 10 },
  weeklyChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  weekCol: { flex: 1, alignItems: "center", gap: 3 },
  weekBarBg: {
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  weekBarTotal: {
    width: 22,
    borderRadius: 8,
    backgroundColor: "#F1E9D8",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  weekBarDone: {
    width: "100%",
    borderRadius: 8,
  },
  weekValue: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    lineHeight: 17,
    color: gwarm.ink,
  },
  weekLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 11,
    lineHeight: 15,
    color: gwarm.inkFaint,
  },
  emptyText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.inkSoft,
    paddingVertical: 4,
  },
  footerNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: 8,
  },
});
