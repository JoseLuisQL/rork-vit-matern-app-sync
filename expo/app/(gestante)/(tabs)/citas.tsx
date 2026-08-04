/**
 * Citas de la gestante: la próxima cita en grande con "Sí, iré" y debajo el
 * camino de controles — círculos unidos por una línea, como un sendero que
 * se va completando. Confirmar o pedir otra fecha funciona también sin señal.
 */
import { CalendarDays, Check, ClipboardCheck, HousePlus } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { fonts, gwarm, spacing } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { confirmAction } from "@/lib/confirm";
import { capitalize, fechaLarga, horaAmigable } from "@/lib/format";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import type { Appointment } from "@/types";
import { StatusWord } from "@/components/Badges";
import { BlockTitle } from "@/components/gestante/BlockTitle";
import { CitaProxima } from "@/components/gestante/CitaProxima";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { SoftCard } from "@/components/gestante/SoftCard";

export default function CitasGestante(): React.ReactElement {
  const { view, todayKey, dispatch } = useApp();
  const patient = useMyPatient();

  const nextAppt = useMemo(() => {
    if (!patient?.nextAppointment || !view) return null;
    return (
      view.appointments.find((a) => a.id === patient.nextAppointment?.id) ??
      patient.nextAppointment
    );
  }, [patient, view]);

  const controls = useMemo(() => {
    const list = (view?.appointments ?? []).filter((a) => a.control !== null);
    return [...list].sort((a, b) => (a.control ?? 0) - (b.control ?? 0));
  }, [view?.appointments]);

  const extras = useMemo(() => {
    const list = (view?.appointments ?? []).filter((a) => a.control === null);
    return [...list].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [view?.appointments]);

  const nextVisit = useMemo(() => {
    const list = (view?.visits ?? []).filter(
      (v) => v.estado === "programada" && v.dateKey >= todayKey,
    );
    return [...list].sort((a, b) => a.dateKey.localeCompare(b.dateKey))[0] ?? null;
  }, [view?.visits, todayKey]);

  const handleConfirm = useCallback(
    async (appt: Appointment) => {
      const ok = await confirmAction({
        title: "Confirmar cita",
        message: `¿Irás a tu cita del ${fechaLarga(appt.dateKey)} a las ${appt.time}?`,
        confirmText: "Sí, iré",
      });
      if (ok) dispatch({ type: "confirm_appointment", appointmentId: appt.id });
    },
    [dispatch],
  );

  const handleReschedule = useCallback(
    async (appt: Appointment) => {
      const ok = await confirmAction({
        title: "Pedir otra fecha",
        message: "Tu obstetra te propondrá una nueva fecha.",
        confirmText: "Pedir cambio",
      });
      if (ok) dispatch({ type: "request_reschedule", appointmentId: appt.id });
    },
    [dispatch],
  );

  return (
    <View style={styles.container}>
      <GHeader title="Mis citas" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PopIn delay={0}>
          {nextAppt ? (
            <CitaProxima
              appt={nextAppt}
              todayKey={todayKey}
              onConfirm={() => void handleConfirm(nextAppt)}
              onReschedule={() => void handleReschedule(nextAppt)}
            />
          ) : (
            <SoftCard style={styles.emptyCard}>
              <Illustration source={ILU.obstetra} width={74} height={90} />
              <View style={styles.flex}>
                <Text style={styles.emptyTitle}>Sin citas pendientes</Text>
                <Text style={styles.emptyText}>Tu obstetra te avisará tu próximo control.</Text>
              </View>
            </SoftCard>
          )}
        </PopIn>

        {nextVisit ? (
          <PopIn delay={70}>
            <SoftCard style={styles.visitCard}>
              <View style={styles.visitIcon}>
                <HousePlus size={23} color={gwarm.teal} strokeWidth={2.2} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.visitTitle}>Te visitarán en casa</Text>
                <Text style={styles.visitText}>
                  {capitalize(fechaLarga(nextVisit.dateKey))} · {horaAmigable(nextVisit.time)}
                </Text>
              </View>
            </SoftCard>
          </PopIn>
        ) : null}

        <PopIn delay={140}>
          <SoftCard style={styles.pathCard}>
            <BlockTitle
              icon={ClipboardCheck}
              title="Mis controles"
              color={gwarm.teal}
              soft={gwarm.tealSoft}
            />
            <View>
              {controls.map((appt, index) => {
                const done = appt.estado === "asistida";
                const isNext = nextAppt?.id === appt.id;
                return (
                  <View key={appt.id} style={styles.pathRow}>
                    <View style={styles.rail}>
                      <View style={[styles.railLine, index === 0 && styles.railHidden]} />
                      <View
                        style={[
                          styles.node,
                          done && styles.nodeDone,
                          !done && isNext && styles.nodeNext,
                        ]}
                      >
                        {done ? (
                          <Check size={19} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <Text style={[styles.nodeNum, isNext && { color: gwarm.teal }]}>
                            {appt.control}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.railLine,
                          index === controls.length - 1 && styles.railHidden,
                        ]}
                      />
                    </View>
                    <View style={styles.pathInfo}>
                      <Text style={styles.pathTitle}>Control {appt.control}</Text>
                      <Text style={styles.pathMeta}>
                        {capitalize(fechaLarga(appt.dateKey))} · {appt.time}
                      </Text>
                    </View>
                    <View style={styles.pathStatus}>
                      <StatusWord estado={appt.estado} />
                    </View>
                  </View>
                );
              })}
            </View>
          </SoftCard>
        </PopIn>

        {extras.length > 0 ? (
          <PopIn delay={210}>
            <SoftCard style={styles.pathCard}>
              <BlockTitle
                icon={CalendarDays}
                title="Otras citas"
                color={gwarm.amber}
                soft={gwarm.amberSoft}
              />
              <View style={styles.extraList}>
                {extras.map((appt, index) => (
                  <View key={appt.id} style={[styles.extraRow, index > 0 && styles.extraBorder]}>
                    <View style={styles.flex}>
                      <Text style={styles.pathTitle} numberOfLines={1}>
                        {appt.motivo}
                      </Text>
                      <Text style={styles.pathMeta}>
                        {capitalize(fechaLarga(appt.dateKey))} · {appt.time}
                      </Text>
                    </View>
                    <StatusWord estado={appt.estado} />
                  </View>
                ))}
              </View>
            </SoftCard>
          </PopIn>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: gwarm.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  visitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    backgroundColor: gwarm.tealSoft,
    borderColor: gwarm.tealMid,
  },
  visitIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  visitTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    color: gwarm.ink,
  },
  visitText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  pathCard: { gap: spacing.sm },
  pathRow: {
    flexDirection: "row",
    gap: spacing.sm2,
    minHeight: 76,
  },
  rail: { width: 40, alignItems: "center" },
  railLine: {
    width: 2.5,
    flex: 1,
    minHeight: 8,
    borderRadius: 2,
    backgroundColor: gwarm.border,
  },
  railHidden: { opacity: 0 },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: gwarm.borderStrong,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeDone: { backgroundColor: gwarm.teal, borderColor: gwarm.teal },
  nodeNext: { borderColor: gwarm.teal },
  nodeNum: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: gwarm.inkFaint,
  },
  pathInfo: { flex: 1, minWidth: 0, justifyContent: "center", gap: 2 },
  pathTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    color: gwarm.ink,
  },
  pathMeta: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  pathStatus: { justifyContent: "center" },
  extraList: {},
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 60,
  },
  extraBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
});
