/**
 * Alertas tempranas: tarjetas ligeras — quién, hace cuánto y qué pasa —
 * con un solo botón principal "Atender" y el chat como icono.
 */
import { useRouter } from "expo-router";
import { BellOff, CheckCircle2, MapPin, MessageCircle } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { common, obstetraTheme, radius, semantic, spacing, type } from "@/constants/theme";
import { avatarUri } from "@/lib/api";
import { tiempoRelativo } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import type { Alert as AlertModel } from "@/types";
import { AlertTypeWord } from "@/components/Badges";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = obstetraTheme;
type Filter = "abiertas" | "atendidas" | "todas";

export default function AlertasScreen(): React.ReactElement {
  const router = useRouter();
  const { view, dispatch } = useApp();
  const patients = usePatients();
  const [filter, setFilter] = useState<Filter>("abiertas");
  const [attendingId, setAttendingId] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");

  const alerts = useMemo(() => {
    const urgency = (a: AlertModel) => (a.type === "emergencia" || a.type === "alarma" ? 0 : 1);
    const list = (view?.alerts ?? []).filter((a) =>
      filter === "todas" ? true : filter === "abiertas" ? a.status === "abierta" : a.status === "atendida",
    );
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "abierta" ? -1 : 1;
      const u = urgency(a) - urgency(b);
      if (u !== 0) return u;
      return b.atISO.localeCompare(a.atISO);
    });
  }, [view?.alerts, filter]);

  const openCount = (view?.alerts ?? []).filter((a) => a.status === "abierta").length;

  const patientOf = (patientId: string) => patients.find((p) => p.id === patientId) ?? null;

  const attend = (alertId: string) => {
    const text = note.trim();
    if (text.length === 0) return;
    dispatch({ type: "attend_alert", alertId, note: text });
    setAttendingId(null);
    setNote("");
  };

  const openMap = (lat: number, lng: number) => {
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Alertas" subtitle={`${openCount} por atender`}>
        <View style={styles.filterRow}>
          {(["abiertas", "atendidas", "todas"] as Filter[]).map((f) => {
            const active = filter === f;
            return (
              <PressableScale
                key={f}
                onPress={() => setFilter(f)}
                accessibilityLabel={`Filtro ${f}`}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: accent.primary, borderColor: accent.primary }
                    : { borderColor: common.border, backgroundColor: common.surface },
                ]}
              >
                <Text
                  style={[styles.filterText, { color: active ? common.white : common.textSecondary }]}
                >
                  {f === "abiertas" ? "Abiertas" : f === "atendidas" ? "Atendidas" : "Todas"}
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
        keyboardShouldPersistTaps="handled"
      >
        {alerts.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={filter === "abiertas" ? "Sin alertas por atender" : "Nada por aquí"}
            text={
              filter === "abiertas"
                ? "Las alertas se generan solas: inasistencias, pastillas, anemia y emergencias."
                : "Cambia el filtro para ver otras alertas."
            }
          />
        ) : (
          alerts.map((alert) => {
            const p = patientOf(alert.patientId);
            const isUrgent = alert.type === "emergencia" || alert.type === "alarma";
            return (
              <Card
                key={alert.id}
                style={[
                  styles.alertCard,
                  isUrgent && alert.status === "abierta" && styles.alertUrgent,
                ]}
              >
                <View style={styles.alertTop}>
                  <PressableScale
                    onPress={() =>
                      p &&
                      router.push({ pathname: "/(obstetra)/gestante/[id]", params: { id: p.id } })
                    }
                    accessibilityLabel={`Ficha de ${p?.firstName ?? "paciente"}`}
                    style={styles.alertPatient}
                  >
                    {p ? (
                      <Avatar
                        uri={avatarUri(p.dni, p.avatarVersion)}
                        color={isUrgent ? semantic.danger : accent.primary}
                        background={isUrgent ? semantic.dangerLight : accent.primaryLight}
                        size={38}
                      />
                    ) : null}
                    <View style={styles.rowInfo}>
                      <Text style={styles.alertName} numberOfLines={1}>
                        {p ? `${p.firstName} ${p.lastName.split(" ")[0]}` : "Paciente"}
                      </Text>
                      <Text style={styles.alertTime}>{tiempoRelativo(alert.atISO)}</Text>
                    </View>
                  </PressableScale>
                  <AlertTypeWord alertType={alert.type} />
                </View>

                <Text style={styles.alertDetail}>{alert.detail}</Text>

                {alert.lat != null && alert.lng != null ? (
                  <PressableScale
                    onPress={() => openMap(alert.lat as number, alert.lng as number)}
                    accessibilityLabel="Ver ubicación en el mapa"
                    style={styles.mapLink}
                  >
                    <MapPin size={15} color={accent.primary} />
                    <Text style={[styles.mapText, { color: accent.primary }]}>Ver ubicación</Text>
                  </PressableScale>
                ) : null}

                {alert.status === "atendida" ? (
                  <View style={styles.attendedBox}>
                    <View style={styles.attendedRow}>
                      <CheckCircle2 size={15} color={semantic.success} />
                      <Text style={styles.attendedLabel}>
                        Atendida {alert.attendedAtISO ? tiempoRelativo(alert.attendedAtISO) : ""}
                      </Text>
                    </View>
                    {alert.note ? <Text style={styles.attendedNote}>{alert.note}</Text> : null}
                  </View>
                ) : attendingId === alert.id ? (
                  <View style={styles.attendForm}>
                    <Field
                      label="¿Qué se hizo o coordinó?"
                      value={note}
                      onChangeText={setNote}
                      placeholder="Escribe una nota corta…"
                      multiline
                      accent={accent.primary}
                      maxLength={300}
                    />
                    <View style={styles.actionsRow}>
                      <AppButton
                        title="Cerrar alerta"
                        onPress={() => attend(alert.id)}
                        color={semantic.success}
                        small
                        disabled={note.trim().length === 0}
                        style={styles.flex}
                      />
                      <AppButton
                        title="Cancelar"
                        onPress={() => {
                          setAttendingId(null);
                          setNote("");
                        }}
                        color={common.textSecondary}
                        variant="outline"
                        small
                        style={styles.flex}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <AppButton
                      title="Atender"
                      onPress={() => {
                        setAttendingId(alert.id);
                        setNote("");
                      }}
                      color={isUrgent ? semantic.danger : accent.primary}
                      variant={isUrgent ? "danger" : "solid"}
                      small
                      style={styles.flex}
                      testID={`atender-${alert.id}`}
                    />
                    <PressableScale
                      onPress={() =>
                        router.push({
                          pathname: "/(obstetra)/chat/[id]",
                          params: { id: alert.patientId },
                        })
                      }
                      accessibilityLabel="Abrir chat"
                      style={styles.chatIconButton}
                    >
                      <MessageCircle size={20} color={accent.primary} />
                    </PressableScale>
                  </View>
                )}
              </Card>
            );
          })
        )}
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
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.sm2,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: { ...type.buttonSm, fontSize: 13 },
  alertCard: { gap: spacing.sm },
  alertUrgent: {
    borderColor: semantic.dangerMid,
    backgroundColor: semantic.dangerLight,
  },
  alertTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  alertPatient: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  alertName: { ...type.bodyMd, fontSize: 16, color: common.text },
  alertTime: { ...type.bodySm, color: common.textSecondary },
  alertDetail: { ...type.body, color: common.text },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 32,
  },
  mapText: { ...type.label, fontSize: 14 },
  attendedBox: {
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm2,
    gap: 4,
  },
  attendedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  attendedLabel: { ...type.label, fontSize: 13, color: semantic.success },
  attendedNote: { ...type.body, color: common.textSecondary },
  attendForm: { gap: spacing.sm },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  chatIconButton: {
    width: 46,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: obstetraTheme.primaryMid,
    backgroundColor: common.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
