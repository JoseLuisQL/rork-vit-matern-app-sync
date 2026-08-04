/**
 * Agenda de la obstetra ("cuaderno"): días con altura fija, tarjetas cálidas
 * que no se deforman (hora a la izquierda, nombre grande, estado en una
 * palabra) y solicitudes de cambio agrupadas en una nota ámbar arriba.
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
import { gfonts, gShadow, gwarm, warmBlue } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
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

const accent = warmBlue;

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
            color={accent.main}
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
        accent={accent.main}
        accentLight={accent.soft}
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
              <View style={styles.requestIconCircle}>
                <CalendarClock size={17} color={gwarm.amber} strokeWidth={2.4} />
              </View>
              <Text style={styles.requestTitle}>
                {rescheduleRequests.length === 1
                  ? "1 paciente pidió cambio de fecha"
                  : `${rescheduleRequests.length} pacientes pidieron cambio de fecha`}
              </Text>
              {showRequests ? (
                <ChevronUp size={18} color={gwarm.amber} />
              ) : (
                <ChevronDown size={18} color={gwarm.amber} />
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
                      color={gwarm.amber}
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
            illu={ILU.libreta}
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
                <Text style={styles.timeText}>{appt.time}</Text>
                <View style={styles.timeDivider} />
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
                    color={gwarm.teal}
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
                    color={gwarm.rose}
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
                  color={accent.main}
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
                    <HousePlus size={17} color={gwarm.teal} strokeWidth={2.2} />
                    <Text style={styles.visitTimeText}>{visit.time}</Text>
                  </View>
                  <View style={styles.timeDivider} />
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
                      { color: visit.estado === "realizada" ? gwarm.teal : accent.main },
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
                      accent={accent.main}
                      maxLength={400}
                    />
                    <View style={styles.actionsRow}>
                      <AppButton
                        title="Guardar"
                        onPress={() => saveVisitResult(visit.id)}
                        color={accent.main}
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
                        color={gwarm.inkSoft}
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
                    color={accent.main}
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
          color={accent.main}
          variant="soft"
          icon={HousePlus}
          style={styles.bottomAction}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 12,
  },
  requestBlock: {
    backgroundColor: gwarm.amberSoft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.amberMid,
    padding: 12,
    gap: 8,
    ...gShadow,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 36,
  },
  requestIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  requestTitle: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.ink,
    flex: 1,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: gwarm.surface,
    borderRadius: 16,
    padding: 12,
  },
  apptCard: { gap: 12 },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeText: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 23,
    color: accent.deep,
    width: 50,
    flexShrink: 0,
  },
  timeDivider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 2,
    backgroundColor: gwarm.border,
  },
  visitTime: {
    width: 50,
    flexShrink: 0,
    alignItems: "center",
    gap: 2,
  },
  visitTimeText: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 18,
    color: gwarm.teal,
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
  actionsRow: { flexDirection: "row", gap: 8 },
  visitState: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    flexShrink: 0,
  },
  visitResult: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.inkSoft,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 14,
    padding: 12,
  },
  resultForm: { gap: 8 },
  bottomAction: { marginTop: 4 },
});
