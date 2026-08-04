/**
 * Inicio de la obstetra: saludo con foto de perfil, emergencias abiertas
 * primero, panel de indicadores del día, botones de módulos y las listas
 * de citas de hoy y pacientes prioritarias.
 */
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  MessageCircle,
  TriangleAlert,
  Users,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  brand,
  common,
  gestanteTheme,
  obstetraTheme,
  radius,
  risk,
  semantic,
  spacing,
  type,
} from "@/constants/theme";
import { RISK_WORD } from "@/constants/labels";
import { avatarUri } from "@/lib/api";
import { fechaLarga, tiempoRelativo } from "@/lib/format";
import { useApp, usePatients, useUnreadCount } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
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
      .sort((a, b) => score[a.riskLevel] - score[b.riskLevel] || b.riskScore - a.riskScore);
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
        key: "gestantes",
        label: "Gestantes",
        icon: Users,
        color: gestanteTheme.primary,
        onPress: () => router.push("/(obstetra)/(tabs)/gestantes"),
        testID: "mod-gestantes",
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
        {emergencies.map((alert) => (
          <Card key={alert.id} style={styles.emergencyCard}>
            <View style={styles.emergencyTop}>
              <View style={styles.emergencyTitleRow}>
                <TriangleAlert size={16} color={semantic.danger} />
                <Text style={styles.emergencyPatient} numberOfLines={1}>
                  {patientName(alert.patientId)}
                </Text>
              </View>
              <Text style={styles.emergencyTime}>{tiempoRelativo(alert.atISO)}</Text>
            </View>
            <Text style={styles.emergencyDetail} numberOfLines={2}>
              {alert.detail}
            </Text>
            <AppButton
              title="Atender"
              onPress={() => router.push("/(obstetra)/(tabs)/alertas")}
              variant="danger"
              small
            />
          </Card>
        ))}

        <StatGroup
          items={[
            {
              key: "citas",
              value: `${todayAppointments.length}`,
              label: "Citas hoy",
              icon: CalendarDays,
              color: accent.primary,
            },
            {
              key: "alertas",
              value: `${openAlerts.length}`,
              label: "Alertas",
              icon: Bell,
              color: openAlerts.length > 0 ? semantic.warning : common.textSecondary,
            },
            {
              key: "rojo",
              value: `${redCount}`,
              label: "Riesgo alto",
              icon: TriangleAlert,
              color: redCount > 0 ? semantic.danger : common.textSecondary,
            },
          ]}
        />

        <SectionHeader title="Módulos" />
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
                <View style={styles.timeChip}>
                  <Text style={styles.timeText}>{appt.time}</Text>
                </View>
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
                  ring={risk[p.riskLevel].solid}
                  size={38}
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
  emergencyCard: {
    gap: spacing.sm,
    borderColor: semantic.dangerMid,
    backgroundColor: semantic.dangerLight,
  },
  emergencyTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  emergencyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  emergencyPatient: { ...type.h4, fontSize: 16, color: common.text, flexShrink: 1 },
  emergencyTime: { ...type.bodySm, color: common.textSecondary, flexShrink: 0 },
  emergencyDetail: { ...type.body, color: common.textSecondary },
  listCard: { paddingVertical: spacing.xs, gap: 0 },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 56,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  timeChip: {
    width: 56,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: obstetraTheme.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: { ...type.numericSm, fontSize: 15, lineHeight: 20, color: obstetraTheme.primaryDark },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  rowName: { ...type.bodyMd, fontSize: 16, color: common.text },
  rowMeta: { ...type.bodySm, color: common.textSecondary },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 60,
  },
  riskWord: { ...type.label, fontSize: 13, flexShrink: 0 },
  emptyText: { ...type.body, color: common.textSecondary },
});
