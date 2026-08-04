/**
 * Inicio de administración: saludo con foto de perfil, panel de números
 * clave del centro, botones de módulos y resúmenes de semáforo, anemia
 * y alertas recientes.
 */
import { useRouter } from "expo-router";
import { Bell, CalendarDays, ChartBar, Pill, UserPlus, Users } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  adminTheme,
  common,
  gestanteTheme,
  obstetraTheme,
  radius,
  risk,
  semantic,
  spacing,
  type,
} from "@/constants/theme";
import { ANEMIA_LABEL, RISK_LABEL } from "@/constants/labels";
import { avatarUri } from "@/lib/api";
import { fechaLarga, tiempoRelativo } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import type { AnemiaClass, RiskLevel } from "@/types";
import { AlertTypeWord } from "@/components/Badges";
import { Card } from "@/components/Card";
import { HomeHeader } from "@/components/HomeHeader";
import { ModuleGrid, type ModuleItem } from "@/components/ModuleGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { StatGroup } from "@/components/StatGroup";

const accent = adminTheme;

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
      <Text style={styles.barLabel}>{label}</Text>
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
        color: accent.primary,
        onPress: () => router.push("/(admin)/nuevo-usuario"),
        testID: "mod-nuevo-usuario",
      },
      {
        key: "usuarios",
        label: "Usuarios",
        icon: Users,
        color: obstetraTheme.primary,
        onPress: () => router.push("/(admin)/(tabs)/usuarios"),
        testID: "mod-usuarios",
      },
      {
        key: "reportes",
        label: "Reportes",
        icon: ChartBar,
        color: gestanteTheme.primary,
        onPress: () => router.push("/(admin)/(tabs)/reportes"),
        testID: "mod-reportes",
      },
    ],
    [router],
  );

  if (!view || !reports || !user) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <HomeHeader
        overline={fechaLarga(todayKey)}
        title={`Hola, ${user.firstName}`}
        subtitle={view.center.name}
        avatarUri={avatarUri(user.dni, user.avatarVersion)}
        accentColor={accent.primary}
        accentBackground={accent.primaryLight}
        onAvatarPress={() => router.push("/(admin)/(tabs)/perfil")}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StatGroup
          items={[
            {
              key: "gestantes",
              value: `${reports.gestantes}`,
              label: "Gestantes",
              icon: Users,
              color: accent.primary,
            },
            {
              key: "alertas",
              value: `${reports.alertas.abiertas}`,
              label: "Alertas",
              icon: Bell,
              color: reports.alertas.abiertas > 0 ? semantic.warning : common.textSecondary,
            },
          ]}
        />
        <StatGroup
          items={[
            {
              key: "citas",
              value: `${reports.citasHoy}`,
              label: "Citas hoy",
              icon: CalendarDays,
              color: semantic.info,
            },
            {
              key: "adherencia",
              value: `${reports.adherenciaPromedio}%`,
              label: "Toman pastillas",
              icon: Pill,
              color:
                reports.adherenciaPromedio >= 75
                  ? semantic.success
                  : reports.adherenciaPromedio >= 50
                    ? semantic.warning
                    : semantic.danger,
            },
          ]}
        />

        <SectionHeader title="Módulos" />
        <ModuleGrid items={modules} />

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
                  ? semantic.success
                  : cls === "leve"
                    ? semantic.warning
                    : semantic.danger
              }
            />
          ))}
        </Card>

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
  chartCard: { gap: spacing.sm2 },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  barLabel: { ...type.body, color: common.textSecondary, width: 110 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: common.surfaceAlt,
    overflow: "hidden" as const,
  },
  barFill: { height: "100%", borderRadius: radius.pill },
  barCount: {
    ...type.bodyMd,
    color: common.text,
    width: 24,
    textAlign: "right" as const,
  },
  alertsCard: { paddingVertical: spacing.xs },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm2,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  alertName: { ...type.bodyMd, fontSize: 16, color: common.text },
  alertMeta: { ...type.bodySm, color: common.textSecondary },
  emptyText: { ...type.bodySm, color: common.textSecondary, paddingVertical: spacing.sm },
});
