/**
 * Inicio de la obstetra ("cuaderno de cuidado"): saludo con foto de perfil,
 * nota de emergencias, indicadores del día a mano, accesos con dibujos a
 * crayola y las listas de citas de hoy y pacientes prioritarias.
 * Adaptado con arquitectura responsiva Web (2 columnas en escritorio).
 */
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarPlus,
  ChevronRight,
  MessageCircle,
  Siren,
  UserRoundPlus,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, warmBlue, warmTeal } from "@/constants/theme";
import { RISK_WORD } from "@/constants/labels";
import { GICON } from "@/constants/illustrations";
import { useResponsive } from "@/hooks/useResponsive";
import { avatarUri } from "@/lib/api";
import { fechaLarga, tiempoRelativo } from "@/lib/format";
import { useApp, usePatients, useUnreadCount } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { HomeHeader } from "@/components/HomeHeader";
import { ModuleGrid, type ModuleItem } from "@/components/ModuleGrid";
import { PopIn } from "@/components/gestante/PopIn";
import { PressableScale } from "@/components/PressableScale";
import { SectionHeader } from "@/components/SectionHeader";
import { StatGroup } from "@/components/StatGroup";
import { StatusWord } from "@/components/Badges";
import { WebCol, WebRow } from "@/components/web/WebGrid";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmBlue;

export default function InicioObstetra(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, user } = useApp();
  const patients = usePatients();
  const unread = useUnreadCount();
  const { isDesktop, isTablet } = useResponsive();

  const isWide = isDesktop || isTablet;

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
        illu: GICON.citas,
        color: accent.main,
        onPress: () =>
          router.push({ pathname: "/(obstetra)/programar", params: { mode: "cita" } }),
        testID: "mod-nueva-cita",
      },
      {
        key: "nueva-gestante",
        label: "Gestante",
        icon: UserRoundPlus,
        illu: GICON.gestantes,
        color: warmTeal.main,
        onPress: () => router.push("/(obstetra)/nueva-gestante"),
        testID: "mod-nueva-gestante",
      },
      {
        key: "alertas",
        label: "Alertas",
        icon: Bell,
        illu: GICON.campana,
        color: gwarm.amber,
        badge: openAlerts.length,
        onPress: () => router.push("/(obstetra)/(tabs)/alertas"),
        testID: "mod-alertas",
      },
      {
        key: "chat",
        label: "Chat",
        icon: MessageCircle,
        illu: GICON.mensajes,
        color: gwarm.terracotta,
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

  const renderEmergencies = () =>
    emergencies.length > 0 ? (
      <PopIn>
        <View style={styles.urgentCard}>
          <View style={styles.urgentHeader}>
            <View style={styles.urgentIconCircle}>
              <Siren size={18} color={gwarm.rose} strokeWidth={2.4} />
            </View>
            <Text style={styles.urgentTitle}>Atención inmediata</Text>
            <Text style={styles.urgentCount}>{emergencies.length}</Text>
          </View>
          {emergencies.slice(0, 3).map((alert) => (
            <PressableScale
              key={alert.id}
              onPress={() => router.push("/(obstetra)/(tabs)/alertas")}
              accessibilityLabel={`Emergencia de ${patientName(alert.patientId)}`}
              style={styles.urgentRow}
              testID={`urgente-${alert.id}`}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.urgentName} numberOfLines={1}>
                  {patientName(alert.patientId)}
                </Text>
                <Text style={styles.urgentDetail} numberOfLines={1}>
                  {alert.detail}
                </Text>
              </View>
              <Text style={styles.urgentTime}>{tiempoRelativo(alert.atISO)}</Text>
              <ChevronRight size={15} color={gwarm.rose} />
            </PressableScale>
          ))}
        </View>
      </PopIn>
    ) : null;

  const renderKPIs = () => (
    <PopIn delay={60}>
      <StatGroup
        items={[
          { key: "citas", value: `${todayAppointments.length}`, label: "Citas hoy" },
          {
            key: "alertas",
            value: `${openAlerts.length}`,
            label: "Alertas",
            color: openAlerts.length > 0 ? gwarm.amber : gwarm.ink,
          },
          {
            key: "rojo",
            value: `${redCount}`,
            label: "Riesgo alto",
            color: redCount > 0 ? gwarm.rose : gwarm.ink,
          },
        ]}
      />
    </PopIn>
  );

  const renderAppointments = () => (
    <PopIn delay={180}>
      <SectionHeader
        title="Citas de hoy"
        action={{
          label: "Ver agenda",
          onPress: () => router.push("/(obstetra)/(tabs)/agenda"),
          color: accent.main,
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
    </PopIn>
  );

  const renderModules = () => (
    <PopIn delay={120}>
      <SectionHeader title="Accesos rápidos" />
      <ModuleGrid items={modules} />
    </PopIn>
  );

  const renderPriorityPatients = () => (
    <PopIn delay={240}>
      <SectionHeader
        title="Pacientes prioritarias"
        action={{
          label: "Ver todas",
          onPress: () => router.push("/(obstetra)/(tabs)/gestantes"),
          color: accent.main,
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
    </PopIn>
  );

  return (
    <View style={styles.container}>
      <WebContainer size="dashboard">
        <HomeHeader
          overline={fechaLarga(todayKey)}
          title={`Hola, ${user.firstName}`}
          subtitle={`${patients.length} gestantes a tu cuidado`}
          avatarUri={avatarUri(user.dni, user.avatarVersion)}
          accentColor={accent.main}
          accentBackground={accent.soft}
          onAvatarPress={() => router.push("/(obstetra)/perfil")}
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
                {renderEmergencies()}
                {renderKPIs()}
                {renderAppointments()}
              </WebCol>
              <WebCol flex={4} style={styles.colGap}>
                {renderModules()}
                {renderPriorityPatients()}
              </WebCol>
            </WebRow>
          ) : (
            <View style={styles.mobileStack}>
              {renderEmergencies()}
              {renderKPIs()}
              {renderModules()}
              {renderAppointments()}
              {renderPriorityPatients()}
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
  urgentCard: {
    backgroundColor: gwarm.redSoft,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: gwarm.redMid,
    padding: 14,
    gap: 6,
    ...gShadow,
  },
  urgentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  urgentIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  urgentTitle: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 24,
    color: gwarm.rose,
    flex: 1,
  },
  urgentCount: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 24,
    color: gwarm.rose,
  },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 52,
  },
  urgentName: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  urgentDetail: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  urgentTime: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkFaint,
    flexShrink: 0,
  },
  listCard: { paddingVertical: 6, gap: 0 },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    minHeight: 52,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  timeText: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: accent.deep,
    width: 48,
    flexShrink: 0,
  },
  timeDivider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 2,
    backgroundColor: gwarm.border,
  },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  rowName: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  rowMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  riskWord: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    flexShrink: 0,
  },
  emptyText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 21,
    color: gwarm.inkSoft,
  },
});
