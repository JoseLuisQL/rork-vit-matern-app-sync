/**
 * Reportes tipo indicadores MINSA, calculados por el servidor:
 * controles oportunos, suplementación, anemia por severidad (corregida por
 * altitud), asistencia y atención de alertas. Filtro por periodo.
 */
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { adminTheme, common, radius, risk, semantic, spacing, type } from "@/constants/theme";
import { ANEMIA_LABEL, RISK_LABEL } from "@/constants/labels";
import { useApp } from "@/providers/AppProvider";
import type { AnemiaClass, ReportBlock, RiskLevel } from "@/types";
import { Card } from "@/components/Card";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";

const accent = adminTheme;
type Period = "d30" | "total";

function IndicatorCard({
  title,
  pct,
  detail,
  color,
}: {
  title: string;
  pct: number;
  detail: string;
  color: string;
}): React.ReactElement {
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

function pctColor(pct: number): string {
  if (pct >= 75) return semantic.success;
  if (pct >= 50) return semantic.warning;
  return semantic.danger;
}

export default function ReportesScreen(): React.ReactElement {
  const { view } = useApp();
  const [period, setPeriod] = useState<Period>("d30");

  const report: ReportBlock | null = view?.reports?.[period] ?? null;

  if (!report) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reportes" subtitle="Indicadores del centro de salud">
        <View style={styles.periodRow}>
          {(["d30", "total"] as Period[]).map((p) => {
            const active = period === p;
            return (
              <PressableScale
                key={p}
                onPress={() => setPeriod(p)}
                accessibilityLabel={p === "d30" ? "Últimos 30 días" : "Histórico"}
                style={[
                  styles.periodChip,
                  active
                    ? { backgroundColor: accent.primary, borderColor: accent.primary }
                    : { backgroundColor: common.surface, borderColor: common.border },
                ]}
              >
                <Text
                  style={[styles.periodText, { color: active ? common.white : common.textSecondary }]}
                >
                  {p === "d30" ? "Últimos 30 días" : "Histórico"}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </ScreenHeader>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Indicadores clave" />
        <IndicatorCard
          title="Controles a tiempo"
          pct={report.controlesOportunos.pct}
          detail={`${report.controlesOportunos.asistidos} de ${report.controlesOportunos.esperados} controles esperados`}
          color={pctColor(report.controlesOportunos.pct)}
        />
        <IndicatorCard
          title="Toman bien sus pastillas"
          pct={report.coberturaSuplementacion}
          detail="Gestantes que cumplen su tratamiento de hierro"
          color={pctColor(report.coberturaSuplementacion)}
        />
        <IndicatorCard
          title="Adherencia promedio"
          pct={report.adherenciaPromedio}
          detail="Tomas cumplidas en los últimos 30 días"
          color={pctColor(report.adherenciaPromedio)}
        />
        <IndicatorCard
          title="Asistencia a citas"
          pct={report.asistencia.pct}
          detail={`${report.asistencia.asistidas} asistidas · ${report.asistencia.noAsistidas} faltaron o están pendientes`}
          color={pctColor(report.asistencia.pct)}
        />
        <IndicatorCard
          title="Alertas atendidas"
          pct={report.alertas.pct}
          detail={`${report.alertas.atendidas} de ${report.alertas.total} · ${report.alertas.abiertas} abiertas`}
          color={pctColor(report.alertas.pct)}
        />

        <SectionHeader title="Anemia" />
        <Card style={styles.distCard}>
          {(["severa", "moderada", "leve", "normal"] as AnemiaClass[]).map((cls) => {
            const count = report.anemia[cls];
            const pct = report.gestantes > 0 ? Math.round((count / report.gestantes) * 100) : 0;
            const color =
              cls === "normal"
                ? semantic.success
                : cls === "leve"
                  ? semantic.warning
                  : semantic.danger;
            return (
              <View key={cls} style={styles.distRow}>
                <Text style={styles.distLabel}>{ANEMIA_LABEL[cls]}</Text>
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

        <SectionHeader title="Semáforo de riesgo" />
        <Card style={styles.distCard}>
          {(["rojo", "amarillo", "verde"] as RiskLevel[]).map((level) => {
            const count = report.riesgo[level];
            const pct = report.gestantes > 0 ? Math.round((count / report.gestantes) * 100) : 0;
            return (
              <View key={level} style={styles.distRow}>
                <Text style={styles.distLabel}>{RISK_LABEL[level]}</Text>
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

        <Text style={styles.footerNote}>
          {report.gestantes} gestantes activas · Referencia MINSA
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm2,
  },
  periodRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  periodChip: {
    paddingHorizontal: spacing.sm2,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  periodText: { ...type.buttonSm, fontSize: 12 },
  indicatorCard: { gap: spacing.sm },
  indicatorTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  indicatorTitle: { ...type.h4, color: common.text, flex: 1 },
  indicatorPct: { ...type.numericMd },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: common.surfaceAlt,
    overflow: "hidden" as const,
  },
  fill: { height: "100%", borderRadius: radius.pill },
  indicatorDetail: { ...type.bodySm, color: common.textSecondary },
  distCard: { gap: spacing.sm2 },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  distLabel: { ...type.bodySm, color: common.textSecondary, width: 120 },
  distValue: { ...type.caption, color: common.text, width: 56, textAlign: "right" },
  distNote: { ...type.caption, color: common.textTertiary, marginTop: 2 },
  footerNote: {
    ...type.caption,
    color: common.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
