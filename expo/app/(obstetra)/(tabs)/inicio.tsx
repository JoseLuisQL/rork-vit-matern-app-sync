/**
 * Inicio de la obstetra: saludo con foto de perfil, un bloque compacto de
 * emergencias (filas, no tarjetones), indicadores del día, accesos y las
 * listas de citas de hoy y pacientes prioritarias.
 */
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarPlus,
  ChevronRight,
  MessageCircle,
  Siren,
  UserRoundPlus,
  Users,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  brand,
  common,
  gestanteTheme,
  obstetraTheme,
  risk,
  semantic,
  spacing,
  type,
} from "@/constants/theme";
import { RISK_WORD } from "@/constants/labels";
import { avatarUri } from "@/lib/api";
import { fechaLarga, tiempoRelativo } from "@/lib/format";
import { useApp, usePatients, useUnreadCount } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { HomeHeader } from "@/components/HomeHeader";
import { ModuleGrid, type ModuleItem } from "@/components/ModuleGrid";
import { PressableScale } from "@/components/PressableScale";
import { SectionHeader } from "@/components/SectionHeader";
import { StatGroup } from "@/components/StatGroup";
import { StatusWord } from "@/components/Badges";

const accent = obstetraTheme;

export default function InicioObstetra(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, user } = useApp();
  const patients = usePatients();
  const unread = useUnreadCount();

  const todayAppointments = useMemo(() => {
    const list = (view?.appointments ?? []).filter((a) => a.dateKey === todayKey);
    return [...list].sort((a, b) => a.time.localeCompare(b.time));
  }, [view?.appointments, todayKey]);

  const openAlerts = useMemo(
    () => (view?.alerts ?? []).filter((a) => a.status === "abierta"),
    [view?.alerts],
  );

  const emergencies = useMemo(
    () =>
      openAlerts
        .filter((a) => a.type === "emergencia" || a.type === "alarma")
        .sort((a, b) => b.atISO.localeCompare(a.atISO)),
    [openAlerts],
  );

  const priority = useMemo(() => {
    const score = { rojo: 0, amarillo: 1, verde: 2 } as const;
    return [...patients]
      .filter((p) => p.riskLevel !== "verde")
      .sort((a, b) => score[a.riskLevel] - score[b.riskLevel] || b.riskScore - a.riskScore)
      .slice(0, 5);
  }, [patients]);

  const redCount = patients.filter((p) => p.riskLevel === "rojo").length;

  const patientName = (patientId: string): string => {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.firstName} ${p.lastName.split(" ")[0]}` : "Paciente";
  };

  const modules: ModuleItem[] = useMemo(
    () => [
      {
        key: "nueva-cita",
        label: "Nueva cita",
        icon: CalendarPlus,
        color: accent.primary,
        onPress: () =>
          router.push({ pathname: "/(obstetra)/programar", params: { mode: "cita" } }),
        testID: "mod-nueva-cita",
      },
      {
        key: "nueva-gestante",
        label: "Gestante",
        icon: UserRoundPlus,
        color: gestanteTheme.primary,
        onPress: () => router.push("/(obstetra)/nueva-gestante"),
        testID: "mod-nueva-gestante",
      },
      {
        key: "alertas",
        label: "Alertas",
        icon: Bell,
        color: semantic.warning,
        badge: openAlerts.length,
        onPress: () => router.push("/(obstetra)/(tabs)/alertas"),
        testID: "mod-alertas",
      },
      {
        key: "chat",
        label: "Chat",
        icon: MessageCircle,
        color: brand.plum,
        badge: unread,
        onPress: () => router.push("/(obstetra)/(tabs)/chat"),
        testID: "mod-chat",
      },
    ],
    [router, openAlerts.length, unread],
  );

  if (!view || !user) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <HomeHeader
        overline={fechaLarga(todayKey)}
        title={`Hola, ${user.firstName}`}
        avatarUri={avatarUri(user.dni, user.avatarVersion)}
        accentColor={accent.primary}
        accentBackground={accent.primaryLight}
        onAvatarPress={() => router.push("/(obstetra)/perfil")}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {emergencies.length > 0 ? (
          <Card style={styles.urgentCard}>
            <View style={styles.urgentHeader}>
              <Text style={styles.urgentTitle}>Atención inmediata</Text>
              <Text style={styles.urgentCount}>{emergencies.length}</Text>
            </View>
            {emergencies.slice(0, 3).map((alert, index) => (
              <PressableScale
                key={alert.id}
                onPress={() => router.push("/(obstetra)/(tabs)/alertas")}
                accessibilityLabel={`Emergencia de ${patientName(alert.patientId)}`}
                style={[styles.urgentRow, index > 0 && styles.rowBorder]}
                testID={`urgente-${alert.id}`}
              >
                <Siren size={16} color={semantic.danger} />
                <View style={styles.rowInfo}>
                  <Text style={styles.urgentName} numberOfLines={1}>
                    {patientName(alert.patientId)}
                  </Text>
                  <Text style={styles.urgentDetail} numberOfLines={1}>
                    {alert.detail}
                  </Text>
                </View>
                <Text style={styles.urgentTime}>{tiempoRelativo(alert.atISO)}</Text>
                <ChevronRight size={15} color={common.textTertiary} />
              </PressableScale>
            ))}
          </Card>
        ) : null}

        <StatGroup
          items={[
            { key: "citas", value: `${todayAppointments.length}`, label: "Citas hoy" },
            {
              key: "alertas",
              value: `${openAlerts.length}`,
              label: "Alertas",
              color: openAlerts.length > 0 ? semantic.warning : common.text,
            },
            {
              key: "rojo",
              value: `${redCount}`,
              label: "Riesgo alto",
              color: redCount > 0 ? semantic.danger : common.text,
            },
          ]}
        />

        <SectionHeader title="Accesos" />
        <ModuleGrid items={modules} />

        <SectionHeader
          title="Citas de hoy"
          action={{
            label: "Agenda",
            onPress: () => router.push("/(obstetra)/(tabs)/agenda"),
            color: accent.primary,
          }}
        />
        {todayAppointments.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No hay citas programadas para hoy.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {todayAppointments.map((appt, index) => (
              <View key={appt.id} style={[styles.apptRow, index > 0 && styles.rowBorder]}>
                <Text style={styles.timeText}>{appt.time}</Text>
                <View style={styles.timeDivider} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {patientName(appt.patientId)}
                  </Text>
                </View>
                <StatusWord estado={appt.estado} />
              </View>
            ))}
          </Card>
        )}

        <SectionHeader
          title="Pacientes prioritarias"
          action={{
            label: "Ver todas",
            onPress: () => router.push("/(obstetra)/(tabs)/gestantes"),
            color: accent.primary,
          }}
        />
        <Card style={styles.listCard}>
          {priority.length === 0 ? (
            <Text style={styles.emptyText}>Ninguna paciente en riesgo medio o alto.</Text>
          ) : (
            priority.map((p, index) => (
              <PressableScale
                key={p.id}
                onPress={() =>
                  router.push({ pathname: "/(obstetra)/gestante/[id]", params: { id: p.id } })
                }
                accessibilityLabel={`Ficha de ${p.firstName}`}
                style={[styles.patientRow, index > 0 && styles.rowBorder]}
              >
                <Avatar
                  uri={avatarUri(p.dni, p.avatarVersion)}
                  color={risk[p.riskLevel].solid}
                  background={risk[p.riskLevel].light}
                  size={36}
                />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {p.firstName} {p.lastName}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    Semana {p.weeks} · {p.community}
                  </Text>
                </View>
                <Text style={[styles.riskWord, { color: risk[p.riskLevel].solid }]}>
                  {RISK_WORD[p.riskLevel]}
                </Text>
              </PressableScale>
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
  urgentCard: {
    gap: 0,
    paddingVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: semantic.danger,
  },
  urgentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  urgentTitle: {
    ...type.overline,
    fontSize: 11.5,
    letterSpacing: 1,
    color: semantic.danger,
    textTransform: "uppercase" as const,
  },
  urgentCount: {
    ...type.numericSm,
    fontSize: 15,
    color: semantic.danger,
  },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 52,
  },
  urgentName: { ...type.bodyMd, fontSize: 15, color: common.text },
  urgentDetail: { ...type.bodySm, color: common.textSecondary },
  urgentTime: { ...type.caption, color: common.textTertiary, flexShrink: 0 },
  listCard: { paddingVertical: spacing.xs, gap: 0 },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 52,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  timeText: {
    ...type.numericSm,
    fontSize: 15,
    lineHeight: 20,
    color: accent.primaryDark,
    width: 44,
    flexShrink: 0,
  },
  timeDivider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 2,
    backgroundColor: common.border,
  },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  rowName: { ...type.bodyMd, fontSize: 15, color: common.text },
  rowMeta: { ...type.bodySm, color: common.textSecondary },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 56,
  },
  riskWord: { ...type.label, fontSize: 12.5, flexShrink: 0 },
  emptyText: { ...type.body, color: common.textSecondary },
});
