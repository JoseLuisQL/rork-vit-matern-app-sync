/**
 * Agenda de la obstetra rediseñada: resumen ilustrado del día (dibujo a
 * crayola, conteos y chips de avance), línea de tiempo con la hora en un
 * riel punteado, tarjetas con foto de la paciente y estado en una palabra,
 * y solicitudes de cambio agrupadas en una nota ámbar arriba.
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
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, warmBlue } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { avatarUri } from "@/lib/api";
import { addDaysToKey, capitalize, fechaCorta, fechaLarga } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import type { Appointment, PatientView, Visit } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { DayStrip } from "@/components/DayStrip";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusWord } from "@/components/Badges";
import { useToast } from "@/components/Toast";

const accent = warmBlue;

/** Cita y visita unificadas en una sola línea de tiempo ordenada por hora. */
type TimelineItem =
  | { kind: "cita"; time: string; appt: Appointment }
  | { kind: "visita"; time: string; visit: Visit };

export default function AgendaScreen(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, dispatch, online } = useApp();
  const patients = usePatients();
  const { show } = useToast();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState<boolean>(false);
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [visitResult, setVisitResult] = useState<string>("");

  const day = selectedDay ?? todayKey;
  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysToKey(todayKey, i)),
    [todayKey],
  );

  const patientOf = useCallback(
    (patientId: string): PatientView | null => patients.find((x) => x.id === patientId) ?? null,
    [patients],
  );

  const patientName = useCallback(
    (patientId: string): string => {
      const p = patientOf(patientId);
      return p ? `${p.firstName} ${p.lastName.split(" ")[0]}` : "Paciente";
    },
    [patientOf],
  );

  const dayAppointments = useMemo(
    () => (view?.appointments ?? []).filter((a) => a.dateKey === day),
    [view?.appointments, day],
  );

  const dayVisits = useMemo(
    () => (view?.visits ?? []).filter((v) => v.dateKey === day),
    [view?.visits, day],
  );

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...dayAppointments.map((appt) => ({ kind: "cita" as const, time: appt.time, appt })),
      ...dayVisits.map((visit) => ({ kind: "visita" as const, time: visit.time, visit })),
    ];
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [dayAppointments, dayVisits]);

  const rescheduleRequests = useMemo(
    () => (view?.appointments ?? []).filter((a) => a.estado === "solicitud_reprogramacion"),
    [view?.appointments],
  );

  /** Resumen del día para los chips del héroe. */
  const summary = useMemo(() => {
    const pendientes = dayAppointments.filter(
      (a) =>
        a.estado === "programada" ||
        a.estado === "confirmada" ||
        a.estado === "solicitud_reprogramacion",
    ).length;
    const asistidas = dayAppointments.filter((a) => a.estado === "asistida").length;
    const faltaron = dayAppointments.filter((a) => a.estado === "no_asistida").length;
    const visitasPend = dayVisits.filter((v) => v.estado === "programada").length;
    return { pendientes, asistidas, faltaron, visitasPend };
  }, [dayAppointments, dayVisits]);

  const countLine = useMemo(() => {
    const parts: string[] = [];
    if (dayAppointments.length > 0) {
      parts.push(dayAppointments.length === 1 ? "1 cita" : `${dayAppointments.length} citas`);
    }
    if (dayVisits.length > 0) {
      parts.push(dayVisits.length === 1 ? "1 visita" : `${dayVisits.length} visitas`);
    }
    return parts.join(" · ");
  }, [dayAppointments.length, dayVisits.length]);

  /** Marca asistencia con confirmación visible (toast). */
  const markAttendance = useCallback(
    (appointmentId: string, patientId: string, estado: "asistida" | "no_asistida") => {
      dispatch({ type: "set_appointment_status", appointmentId, estado });
      const base =
        estado === "asistida"
          ? `${patientName(patientId)}: asistencia registrada ✓`
          : `${patientName(patientId)}: falta registrada`;
      show(online ? base : `${base} · se enviará con señal`, online ? "success" : "info");
    },
    [dispatch, online, patientName, show],
  );

  const saveVisitResult = (visitId: string) => {
    const text = visitResult.trim();
    if (text.length === 0) return;
    dispatch({ type: "complete_visit", visitId, resultado: text });
    setCompletingVisitId(null);
    setVisitResult("");
    show(
      online
        ? "Resultado de la visita guardado ✓"
        : "Resultado guardado · se enviará con señal",
      online ? "success" : "info",
    );
  };

  const renderPatientRow = (
    patientId: string,
    subtitle: string,
    rightNode: React.ReactNode,
  ): React.ReactElement => {
    const p = patientOf(patientId);
    return (
      <View style={styles.cardTop}>
        <PressableScale
          onPress={() =>
            router.push({ pathname: "/(obstetra)/gestante/[id]", params: { id: patientId } })
          }
          accessibilityLabel={`Ficha de ${patientName(patientId)}`}
          style={styles.cardPerson}
        >
          <Avatar
            uri={avatarUri(p?.dni, p?.avatarVersion)}
            color={accent.main}
            background={accent.soft}
            size={42}
            ring={p ? risk[p.riskLevel].solid : undefined}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {patientName(patientId)}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </PressableScale>
        {rightNode}
      </View>
    );
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
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {patientName(appt.patientId)}
                      </Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>
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

        <PopIn>
          <View style={styles.heroCard}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroOverline}>
                {day === todayKey ? "Hoy" : "Tu día"}
              </Text>
              <Text style={styles.heroDate}>{capitalize(fechaLarga(day))}</Text>
              <Text style={styles.heroCounts}>
                {countLine.length > 0 ? countLine : "Sin citas ni visitas"}
              </Text>
              <View style={styles.heroChips}>
                {summary.pendientes > 0 ? (
                  <View style={[styles.chip, { backgroundColor: accent.soft }]}>
                    <Text style={[styles.chipText, { color: accent.deep }]}>
                      {summary.pendientes} por atender
                    </Text>
                  </View>
                ) : null}
                {summary.asistidas > 0 ? (
                  <View style={[styles.chip, { backgroundColor: gwarm.tealSoft }]}>
                    <Text style={[styles.chipText, { color: gwarm.tealDeep }]}>
                      {summary.asistidas} asistidas
                    </Text>
                  </View>
                ) : null}
                {summary.faltaron > 0 ? (
                  <View style={[styles.chip, { backgroundColor: gwarm.roseSoft }]}>
                    <Text style={[styles.chipText, { color: gwarm.rose }]}>
                      {summary.faltaron} faltaron
                    </Text>
                  </View>
                ) : null}
                {summary.visitasPend > 0 ? (
                  <View style={[styles.chip, { backgroundColor: gwarm.amberSoft }]}>
                    <Text style={[styles.chipText, { color: gwarm.amber }]}>
                      {summary.visitasPend} visita{summary.visitasPend > 1 ? "s" : ""} pendiente
                      {summary.visitasPend > 1 ? "s" : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Illustration source={ILU.agenda} width={100} height={100} />
          </View>
        </PopIn>

        {timeline.length === 0 ? (
          <PopIn delay={60}>
            <EmptyState
              icon={CalendarPlus}
              illu={ILU.calma}
              title="Día tranquilo"
              text="No hay citas ni visitas para este día."
            />
            <AppButton
              title="Programar cita este día"
              onPress={() =>
                router.push({
                  pathname: "/(obstetra)/programar",
                  params: { mode: "cita", date: day },
                })
              }
              color={accent.main}
              variant="soft"
              icon={CalendarPlus}
            />
          </PopIn>
        ) : (
          <View style={styles.timeline}>
            {timeline.map((item, index) => {
              const isLast = index === timeline.length - 1;
              if (item.kind === "cita") {
                const appt = item.appt;
                const canMark =
                  day <= todayKey &&
                  (appt.estado === "programada" ||
                    appt.estado === "confirmada" ||
                    appt.estado === "solicitud_reprogramacion");
                const dotColor =
                  appt.estado === "asistida"
                    ? gwarm.teal
                    : appt.estado === "no_asistida"
                      ? gwarm.rose
                      : accent.main;
                return (
                  <View key={appt.id} style={styles.tlRow}>
                    <View style={styles.tlRail}>
                      <Text style={styles.tlTime}>{appt.time}</Text>
                      <View style={[styles.tlDot, { backgroundColor: dotColor }]} />
                      {!isLast ? <View style={styles.tlLine} /> : null}
                    </View>
                    <View style={styles.tlCard}>
                      {renderPatientRow(appt.patientId, appt.motivo, <StatusWord estado={appt.estado} />)}
                      {canMark ? (
                        <View style={styles.actionsRow}>
                          <AppButton
                            title="Asistió"
                            onPress={() => markAttendance(appt.id, appt.patientId, "asistida")}
                            color={gwarm.teal}
                            variant="soft"
                            icon={CheckCircle2}
                            small
                            style={styles.flex}
                            testID={`asistio-${appt.id}`}
                          />
                          <AppButton
                            title="Faltó"
                            onPress={() => markAttendance(appt.id, appt.patientId, "no_asistida")}
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
                    </View>
                  </View>
                );
              }

              const visit = item.visit;
              const done = visit.estado === "realizada";
              return (
                <View key={visit.id} style={styles.tlRow}>
                  <View style={styles.tlRail}>
                    <Text style={styles.tlTime}>{visit.time}</Text>
                    <View
                      style={[styles.tlDot, { backgroundColor: done ? gwarm.teal : gwarm.tealDeep }]}
                    />
                    {!isLast ? <View style={styles.tlLine} /> : null}
                  </View>
                  <View style={[styles.tlCard, styles.visitCard]}>
                    <View style={styles.visitTag}>
                      <HousePlus size={13} color={gwarm.tealDeep} strokeWidth={2.4} />
                      <Text style={styles.visitTagText}>Visita a domicilio</Text>
                    </View>
                    {renderPatientRow(
                      visit.patientId,
                      visit.motivo,
                      <Text
                        style={[styles.visitState, { color: done ? gwarm.teal : accent.main }]}
                      >
                        {done ? "Realizada" : "Pendiente"}
                      </Text>,
                    )}
                    {done && visit.resultado ? (
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
                    ) : !done ? (
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
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
    gap: 14,
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
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 16,
    ...gShadow,
  },
  heroInfo: { flex: 1, minWidth: 0, gap: 2 },
  heroOverline: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: accent.main,
  },
  heroDate: {
    fontFamily: gfonts.hand,
    fontSize: 24,
    lineHeight: 30,
    color: gwarm.ink,
  },
  heroCounts: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    lineHeight: 17,
  },
  timeline: { gap: 0 },
  tlRow: {
    flexDirection: "row",
    gap: 10,
  },
  tlRail: {
    width: 50,
    alignItems: "center",
    flexShrink: 0,
  },
  tlTime: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
  },
  tlDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 2,
    borderColor: gwarm.bg,
  },
  tlLine: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    backgroundColor: gwarm.borderStrong,
    opacity: 0.55,
    marginTop: 2,
    marginBottom: 2,
    minHeight: 14,
  },
  tlCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 14,
    gap: 11,
    marginBottom: 12,
    ...gShadow,
  },
  visitCard: {
    backgroundColor: gwarm.surfaceSoft,
    borderColor: gwarm.tealMid,
  },
  visitTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: gwarm.tealSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  visitTagText: {
    fontFamily: gfonts.hand,
    fontSize: 12.5,
    lineHeight: 16,
    color: gwarm.tealDeep,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardPerson: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardInfo: { flex: 1, minWidth: 0, gap: 1 },
  cardName: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  cardMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
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
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 14,
    padding: 12,
  },
  resultForm: { gap: 8 },
  bottomAction: { marginTop: 2 },
});
