/**
 * Reportes tipo indicadores MINSA ("cuaderno"), calculados por el servidor:
 * controles oportunos, suplementación, anemia por severidad (corregida por
 * altitud), asistencia y atención de alertas. Filtro por periodo.
 */
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, risk } from "@/constants/theme";
import { ANEMIA_LABEL, RISK_LABEL } from "@/constants/labels";
import { GICON } from "@/constants/illustrations";
import { useApp } from "@/providers/AppProvider";
import type { AnemiaClass, ReportBlock, RiskLevel } from "@/types";
import { Card } from "@/components/Card";
import { Illustration } from "@/components/gestante/Illustration";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Segmented } from "@/components/Segmented";

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
  if (pct >= 75) return gwarm.teal;
  if (pct >= 50) return gwarm.amber;
  return gwarm.rose;
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
      <ScreenHeader
        title="Reportes"
        subtitle="Indicadores del centro de salud"
        right={<Illustration source={GICON.reportes} width={46} height={46} />}
      >
        <Segmented
          options={[
            { key: "d30", label: "Últimos 30 días" },
            { key: "total", label: "Histórico" },
          ]}
          value={period}
          onChange={(k) => setPeriod(k as Period)}
          style={styles.segmented}
        />
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

        <Text style={styles.footerNote}>
          {report.gestantes} gestantes activas · Referencia MINSA
        </Text>
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
    gap: 12,
  },
  segmented: { marginTop: 8 },
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
  footerNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: 8,
  },
});
