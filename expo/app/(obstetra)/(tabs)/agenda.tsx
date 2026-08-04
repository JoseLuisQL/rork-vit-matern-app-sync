/**
 * Agenda de la obstetra: días con altura fija, tarjetas que no se deforman
 * (hora a la izquierda, nombre grande, estado en una palabra) y solicitudes
 * de cambio agrupadas en un aviso compacto arriba.
 */
import { useRouter } from "expo-router";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HousePlus,
  XCircle,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { common, obstetraTheme, radius, semantic, spacing, type } from "@/constants/theme";
import { addDaysToKey, capitalize, fechaCorta, fechaLarga } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { DayStrip } from "@/components/DayStrip";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusWord } from "@/components/Badges";
import { PressableScale } from "@/components/PressableScale";

const accent = obstetraTheme;

export default function AgendaScreen(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, dispatch } = useApp();
  const patients = usePatients();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState<boolean>(false);
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [visitResult, setVisitResult] = useState<string>("");

  const day = selectedDay ?? todayKey;
  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysToKey(todayKey, i)),
    [todayKey],
  );

  const patientName = (patientId: string): string => {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.firstName} ${p.lastName.split(" ")[0]}` : "Paciente";
  };

  const dayAppointments = useMemo(() => {
    const list = (view?.appointments ?? []).filter((a) => a.dateKey === day);
    return [...list].sort((a, b) => a.time.localeCompare(b.time));
  }, [view?.appointments, day]);

  const dayVisits = useMemo(() => {
    const list = (view?.visits ?? []).filter((v) => v.dateKey === day);
    return [...list].sort((a, b) => a.time.localeCompare(b.time));
  }, [view?.visits, day]);

  const rescheduleRequests = useMemo(
    () => (view?.appointments ?? []).filter((a) => a.estado === "solicitud_reprogramacion"),
    [view?.appointments],
  );

  const saveVisitResult = (visitId: string) => {
    const text = visitResult.trim();
    if (text.length === 0) return;
    dispatch({ type: "complete_visit", visitId, resultado: text });
    setCompletingVisitId(null);
    setVisitResult("");
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Agenda"
        right={
          <AppButton
            title="Nueva"
            onPress={() =>
              router.push({ pathname: "/(obstetra)/programar", params: { mode: "cita", date: day } })
            }
            color={accent.primary}
            icon={CalendarPlus}
            small
          />
        }
      />
      <DayStrip
        days={days}
        selected={day}
        onSelect={setSelectedDay}
        todayKey={todayKey}
        accent={accent.primary}
        accentLight={accent.primaryLight}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {rescheduleRequests.length > 0 ? (
          <View style={styles.requestBlock}>
            <PressableScale
              onPress={() => setShowRequests((v) => !v)}
              accessibilityLabel="Solicitudes de cambio de fecha"
              style={styles.requestHeader}
            >
              <CalendarClock size={18} color={semantic.warning} />
              <Text style={styles.requestTitle}>
                {rescheduleRequests.length === 1
                  ? "1 paciente pidió cambio de fecha"
                  : `${rescheduleRequests.length} pacientes pidieron cambio de fecha`}
              </Text>
              {showRequests ? (
                <ChevronUp size={18} color={semantic.warning} />
              ) : (
                <ChevronDown size={18} color={semantic.warning} />
              )}
            </PressableScale>
            {showRequests
              ? rescheduleRequests.map((appt) => (
                  <View key={appt.id} style={styles.requestRow}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {patientName(appt.patientId)}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        Tenía el {fechaCorta(appt.dateKey)} · {appt.time}
                      </Text>
                    </View>
                    <AppButton
                      title="Cambiar"
                      onPress={() =>
                        router.push({
                          pathname: "/(obstetra)/programar",
                          params: { mode: "reprogramar", appointmentId: appt.id },
                        })
                      }
                      color={semantic.warning}
                      variant="soft"
                      small
                    />
                  </View>
                ))
              : null}
          </View>
        ) : null}

        <SectionHeader title={capitalize(fechaLarga(day))} />
        {dayAppointments.length === 0 && dayVisits.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Día libre"
            text="No hay citas ni visitas para este día."
          />
        ) : null}

        {dayAppointments.map((appt) => {
          const canMark =
            day <= todayKey &&
            (appt.estado === "programada" ||
              appt.estado === "confirmada" ||
              appt.estado === "solicitud_reprogramacion");
          return (
            <Card key={appt.id} style={styles.apptCard}>
              <View style={styles.apptRow}>
                <Text style={[styles.timeText, { color: accent.primaryDark }]}>{appt.time}</Text>
                <PressableScale
                  onPress={() =>
                    router.push({
                      pathname: "/(obstetra)/gestante/[id]",
                      params: { id: appt.patientId },
                    })
                  }
                  accessibilityLabel={`Ficha de ${patientName(appt.patientId)}`}
                  style={styles.rowInfo}
                >
                  <Text style={styles.rowName} numberOfLines={1}>
                    {patientName(appt.patientId)}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {appt.motivo}
                  </Text>
                </PressableScale>
                <StatusWord estado={appt.estado} />
              </View>
              {canMark ? (
                <View style={styles.actionsRow}>
                  <AppButton
                    title="Asistió"
                    onPress={() =>
                      dispatch({
                        type: "set_appointment_status",
                        appointmentId: appt.id,
                        estado: "asistida",
                      })
                    }
                    color={semantic.success}
                    variant="soft"
                    icon={CheckCircle2}
                    small
                    style={styles.flex}
                  />
                  <AppButton
                    title="Faltó"
                    onPress={() =>
                      dispatch({
                        type: "set_appointment_status",
                        appointmentId: appt.id,
                        estado: "no_asistida",
                      })
                    }
                    color={semantic.danger}
                    variant="soft"
                    icon={XCircle}
                    small
                    style={styles.flex}
                  />
                </View>
              ) : day > todayKey &&
                (appt.estado === "programada" || appt.estado === "confirmada") ? (
                <AppButton
                  title="Reprogramar"
                  onPress={() =>
                    router.push({
                      pathname: "/(obstetra)/programar",
                      params: { mode: "reprogramar", appointmentId: appt.id },
                    })
                  }
                  color={accent.primary}
                  variant="outline"
                  small
                />
              ) : null}
            </Card>
          );
        })}

        {dayVisits.length > 0 ? (
          <>
            <SectionHeader title="Visitas a domicilio" />
            {dayVisits.map((visit) => (
              <Card key={visit.id} style={styles.apptCard}>
                <View style={styles.apptRow}>
                  <View style={styles.visitTime}>
                    <HousePlus size={16} color={semantic.success} />
                    <Text style={[styles.timeTextSm, { color: semantic.success }]}>
                      {visit.time}
                    </Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {patientName(visit.patientId)}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {visit.motivo}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.visitState,
                      { color: visit.estado === "realizada" ? semantic.success : semantic.info },
                    ]}
                  >
                    {visit.estado === "realizada" ? "Realizada" : "Pendiente"}
                  </Text>
                </View>
                {visit.estado === "realizada" && visit.resultado ? (
                  <Text style={styles.visitResult}>{visit.resultado}</Text>
                ) : completingVisitId === visit.id ? (
                  <View style={styles.resultForm}>
                    <Field
                      label="¿Cómo fue la visita?"
                      value={visitResult}
                      onChangeText={setVisitResult}
                      placeholder="Cómo encontraste a la gestante, acuerdos…"
                      multiline
                      accent={accent.primary}
                      maxLength={400}
                    />
                    <View style={styles.actionsRow}>
                      <AppButton
                        title="Guardar"
                        onPress={() => saveVisitResult(visit.id)}
                        color={accent.primary}
                        small
                        disabled={visitResult.trim().length === 0}
                        style={styles.flex}
                      />
                      <AppButton
                        title="Cancelar"
                        onPress={() => {
                          setCompletingVisitId(null);
                          setVisitResult("");
                        }}
                        color={common.textSecondary}
                        variant="outline"
                        small
                        style={styles.flex}
                      />
                    </View>
                  </View>
                ) : (
                  <AppButton
                    title="Registrar resultado"
                    onPress={() => {
                      setCompletingVisitId(visit.id);
                      setVisitResult("");
                    }}
                    color={accent.primary}
                    variant="outline"
                    small
                  />
                )}
              </Card>
            ))}
          </>
        ) : null}

        <AppButton
          title="Programar visita a domicilio"
          onPress={() =>
            router.push({ pathname: "/(obstetra)/programar", params: { mode: "visita", date: day } })
          }
          color={accent.primary}
          variant="soft"
          icon={HousePlus}
          style={styles.bottomAction}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.sm2,
  },
  requestBlock: {
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: common.border,
    borderLeftWidth: 3,
    borderLeftColor: semantic.warning,
    padding: spacing.sm2,
    gap: spacing.sm,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 32,
  },
  requestTitle: { ...type.bodyMd, fontSize: 14, color: common.text, flex: 1 },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm2,
  },
  apptCard: { gap: spacing.sm2 },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  timeText: {
    ...type.numericSm,
    fontSize: 16,
    width: 50,
    flexShrink: 0,
  },
  timeTextSm: { ...type.label, fontSize: 13 },
  visitTime: {
    width: 54,
    flexShrink: 0,
    alignItems: "center",
    gap: 2,
  },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  rowName: { ...type.bodyMd, fontSize: 15, color: common.text },
  rowMeta: { ...type.bodySm, color: common.textSecondary },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
  visitState: { ...type.label, fontSize: 13, flexShrink: 0 },
  visitResult: {
    ...type.bodySm,
    color: common.textSecondary,
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm2,
  },
  resultForm: { gap: spacing.sm },
  bottomAction: { marginTop: spacing.xs },
});
