/**
 * Alertas tempranas ("cuaderno"): filtro segmentado y tarjetas cálidas —
 * quién, hace cuánto y qué pasa. Las urgencias van como notas rosadas con
 * un botón "Atender" y el chat como icono.
 */
import { useRouter } from "expo-router";
import { BellOff, CheckCircle2, MapPin, MessageCircle } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, warmBlue } from "@/constants/theme";
import { GICON } from "@/constants/illustrations";
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
import { Segmented } from "@/components/Segmented";

const accent = warmBlue;
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
        <Segmented
          options={[
            { key: "abiertas", label: "Abiertas" },
            { key: "atendidas", label: "Atendidas" },
            { key: "todas", label: "Todas" },
          ]}
          value={filter}
          onChange={(k) => setFilter(k as Filter)}
          style={styles.segmented}
        />
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
            illu={GICON.campana}
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
            const urgentOpen = isUrgent && alert.status === "abierta";
            return (
              <Card
                key={alert.id}
                style={[styles.alertCard, urgentOpen && styles.alertUrgent]}
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
                        color={isUrgent ? gwarm.rose : accent.main}
                        background={isUrgent ? gwarm.redSoft : accent.soft}
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
                    <MapPin size={15} color={accent.main} />
                    <Text style={styles.mapText}>Ver ubicación</Text>
                  </PressableScale>
                ) : null}

                {alert.status === "atendida" ? (
                  <View style={styles.attendedBox}>
                    <View style={styles.attendedRow}>
                      <CheckCircle2 size={15} color={gwarm.tealDeep} />
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
                      accent={accent.main}
                      maxLength={300}
                    />
                    <View style={styles.formActions}>
                      <AppButton
                        title="Cerrar alerta"
                        onPress={() => attend(alert.id)}
                        color={gwarm.teal}
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
                        color={gwarm.inkSoft}
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
                      color={isUrgent ? gwarm.rose : accent.main}
                      small
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
                      <MessageCircle size={19} color={accent.main} />
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
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  segmented: { marginTop: 8 },
  alertCard: { gap: 10 },
  alertUrgent: {
    backgroundColor: gwarm.redSoft,
    borderColor: gwarm.redMid,
    borderWidth: 1.5,
  },
  alertTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  alertPatient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  alertName: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  alertTime: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkFaint,
  },
  alertDetail: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    lineHeight: 22,
    color: gwarm.ink,
  },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 28,
  },
  mapText: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    color: accent.main,
  },
  attendedBox: {
    backgroundColor: gwarm.tealSoft,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  attendedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  attendedLabel: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    color: gwarm.tealDeep,
  },
  attendedNote: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.inkSoft,
  },
  attendForm: { gap: 8 },
  formActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },
  chatIconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
