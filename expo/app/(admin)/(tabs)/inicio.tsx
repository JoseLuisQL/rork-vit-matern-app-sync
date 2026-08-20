/**
 * Inicio de administración ("cuaderno"): saludo con foto de perfil, tarjeta
 * del centro de salud con su dibujo, números clave a mano, módulos con
 * dibujos a crayola y resúmenes de semáforo, anemia y alertas recientes.
 * Adaptado con arquitectura responsiva Web (2 columnas en escritorio).
 */
import { useRouter } from "expo-router";
import { ChartBar, UserPlus, Users } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, risk, warmBlue, warmPlum, warmTeal } from "@/constants/theme";
import { ANEMIA_LABEL, RISK_LABEL } from "@/constants/labels";
import { GICON, ILU } from "@/constants/illustrations";
import { useResponsive } from "@/hooks/useResponsive";
import { avatarUri } from "@/lib/api";
import { fechaLarga, tiempoRelativo } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import type { AnemiaClass, RiskLevel } from "@/types";
import { AlertTypeWord } from "@/components/Badges";
import { Card } from "@/components/Card";
import { HomeHeader } from "@/components/HomeHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { ModuleGrid, type ModuleItem } from "@/components/ModuleGrid";
import { PopIn } from "@/components/gestante/PopIn";
import { SectionHeader } from "@/components/SectionHeader";
import { StatGroup } from "@/components/StatGroup";
import { WebCol, WebRow } from "@/components/web/WebGrid";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmPlum;

function BarRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}): React.ReactElement {
  const pct = total > 0 ? count / total : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(pct * 100, count > 0 ? 6 : 0)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

export default function InicioAdmin(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, user } = useApp();
  const patients = usePatients();
  const { isDesktop, isTablet } = useResponsive();

  const isWide = isDesktop || isTablet;

  const reports = view?.reports?.d30 ?? null;

  const recentAlerts = useMemo(() => {
    const list = [...(view?.alerts ?? [])].sort((a, b) => b.atISO.localeCompare(a.atISO));
    return list.slice(0, 5);
  }, [view?.alerts]);

  const patientName = (patientId: string): string => {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.firstName} ${p.lastName.split(" ")[0]}` : "Paciente";
  };

  const modules: ModuleItem[] = useMemo(
    () => [
      {
        key: "nuevo-usuario",
        label: "Nuevo usuario",
        icon: UserPlus,
        illu: GICON.perfil,
        color: accent.main,
        onPress: () => router.push("/(admin)/nuevo-usuario"),
        testID: "mod-nuevo-usuario",
      },
      {
        key: "usuarios",
        label: "Usuarios",
        icon: Users,
        illu: GICON.usuarios,
        color: warmBlue.main,
        onPress: () => router.push("/(admin)/(tabs)/usuarios"),
        testID: "mod-usuarios",
      },
      {
        key: "reportes",
        label: "Reportes",
        icon: ChartBar,
        illu: GICON.reportes,
        color: warmTeal.main,
        onPress: () => router.push("/(admin)/(tabs)/reportes"),
        testID: "mod-reportes",
      },
    ],
    [router],
  );

  if (!view || !reports || !user) {
    return <View style={styles.container} />;
  }

  const renderCenterCard = () => (
    <PopIn>
      <Card style={styles.centerCard}>
        <View style={styles.centerInfo}>
          <Text style={styles.centerName}>{view.center.name}</Text>
          <Text style={styles.centerMeta}>
            {reports.gestantes} gestantes en seguimiento{"\n"}
            {reports.citasHoy} citas para hoy
          </Text>
        </View>
        <Illustration source={ILU.centroSalud} width={104} height={104} />
      </Card>
    </PopIn>
  );

  const renderKPIs = () => (
    <PopIn delay={60}>
      <StatGroup
        items={[
          { key: "gestantes", value: `${reports.gestantes}`, label: "Gestantes" },
          {
            key: "alertas",
            value: `${reports.alertas.abiertas}`,
            label: "Alertas abiertas",
            color: reports.alertas.abiertas > 0 ? gwarm.amber : gwarm.ink,
          },
          {
            key: "adherencia",
            value: `${reports.adherenciaPromedio}%`,
            label: "Toman pastillas",
            color:
              reports.adherenciaPromedio >= 75
                ? gwarm.teal
                : reports.adherenciaPromedio >= 50
                  ? gwarm.amber
                  : gwarm.rose,
          },
        ]}
      />
    </PopIn>
  );

  const renderAlerts = () => (
    <PopIn delay={300}>
      <SectionHeader title="Alertas recientes" />
      <Card style={styles.alertsCard}>
        {recentAlerts.length === 0 ? (
          <Text style={styles.emptyText}>Sin alertas registradas.</Text>
        ) : (
          recentAlerts.map((alert, index) => (
            <View key={alert.id} style={[styles.alertRow, index > 0 && styles.rowBorder]}>
              <View style={styles.flex}>
                <Text style={styles.alertName}>{patientName(alert.patientId)}</Text>
                <Text style={styles.alertMeta}>
                  {tiempoRelativo(alert.atISO)} ·{" "}
                  {alert.status === "abierta" ? "Abierta" : "Atendida"}
                </Text>
              </View>
              <AlertTypeWord alertType={alert.type} />
            </View>
          ))
        )}
      </Card>
    </PopIn>
  );

  const renderModules = () => (
    <PopIn delay={120}>
      <SectionHeader title="Módulos" />
      <ModuleGrid items={modules} />
    </PopIn>
  );

  const renderRisk = () => (
    <PopIn delay={180}>
      <SectionHeader title="Semáforo de riesgo" />
      <Card style={styles.chartCard}>
        {(["rojo", "amarillo", "verde"] as RiskLevel[]).map((level) => (
          <BarRow
            key={level}
            label={RISK_LABEL[level].replace("Riesgo ", "")}
            count={reports.riesgo[level]}
            total={reports.gestantes}
            color={risk[level].solid}
          />
        ))}
      </Card>
    </PopIn>
  );

  const renderAnemia = () => (
    <PopIn delay={240}>
      <SectionHeader title="Anemia" />
      <Card style={styles.chartCard}>
        {(["severa", "moderada", "leve", "normal"] as AnemiaClass[]).map((cls) => (
          <BarRow
            key={cls}
            label={ANEMIA_LABEL[cls]}
            count={reports.anemia[cls]}
            total={reports.gestantes}
            color={
              cls === "normal"
                ? gwarm.teal
                : cls === "leve"
                  ? gwarm.amber
                  : gwarm.rose
            }
          />
        ))}
      </Card>
    </PopIn>
  );

  return (
    <View style={styles.container}>
      <WebContainer size="dashboard">
        <HomeHeader
          overline={fechaLarga(todayKey)}
          title={`Hola, ${user.firstName}`}
          subtitle="Administración del centro"
          avatarUri={avatarUri(user.dni, user.avatarVersion)}
          accentColor={accent.main}
          accentBackground={accent.soft}
          onAvatarPress={() => router.push("/(admin)/(tabs)/perfil")}
        />
      </WebContainer>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="dashboard">
          {isWide ? (
            <WebRow gap={20}>
              <WebCol flex={6} style={styles.colGap}>
                {renderCenterCard()}
                {renderKPIs()}
                {renderAlerts()}
              </WebCol>
              <WebCol flex={4} style={styles.colGap}>
                {renderModules()}
                {renderRisk()}
                {renderAnemia()}
              </WebCol>
            </WebRow>
          ) : (
            <View style={styles.mobileStack}>
              {renderCenterCard()}
              {renderKPIs()}
              {renderModules()}
              {renderRisk()}
              {renderAnemia()}
              {renderAlerts()}
            </View>
          )}
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
  mobileStack: {
    gap: 12,
  },
  colGap: {
    gap: 12,
  },
  centerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  centerInfo: { flex: 1, minWidth: 0, gap: 4 },
  centerName: {
    fontFamily: gfonts.hand,
    fontSize: 23,
    lineHeight: 29,
    color: gwarm.ink,
  },
  centerMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 21,
    color: gwarm.inkSoft,
  },
  chartCard: { gap: 12 },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  barLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
    width: 112,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#F1E9D8",
    overflow: "hidden" as const,
  },
  barFill: { height: "100%", borderRadius: 999 },
  barCount: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 20,
    color: gwarm.ink,
    width: 26,
    textAlign: "right" as const,
  },
  alertsCard: { paddingVertical: 6 },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  alertName: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  alertMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  emptyText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 21,
    color: gwarm.inkSoft,
    paddingVertical: 8,
  },
});
