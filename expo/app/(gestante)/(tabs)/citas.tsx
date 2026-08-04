/**
 * Citas de la gestante: la próxima cita primero y en grande (con "Sí, iré"),
 * y debajo la lista simple de controles — número, fecha y estado en una palabra.
 * Confirmar o pedir otra fecha funciona también sin señal.
 */
import { Check, HousePlus, MapPin } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { cardBorder, common, gestanteTheme, radius, semantic, spacing, type } from "@/constants/theme";
import { confirmAction } from "@/lib/confirm";
import { capitalize, etiquetaRelativa, fechaLarga } from "@/lib/format";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import type { Appointment } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusWord } from "@/components/Badges";

const accent = gestanteTheme;

export default function CitasGestante(): React.ReactElement {
  const { view, todayKey, dispatch } = useApp();
  const patient = useMyPatient();

  const nextAppt = useMemo(() => {
    if (!patient?.nextAppointment || !view) return null;
    return view.appointments.find((a) => a.id === patient.nextAppointment?.id) ?? patient.nextAppointment;
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
      <ScreenHeader title="Mis citas" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {nextAppt ? (
          <Card style={styles.nextCard}>
            <Text style={styles.blockLabel}>Mi próxima cita</Text>
            <Text style={[styles.nextWhen, { color: accent.primary }]}>
              {etiquetaRelativa(nextAppt.dateKey, todayKey)}
            </Text>
            <Text style={styles.nextDate}>
              {capitalize(fechaLarga(nextAppt.dateKey))} · {nextAppt.time}
            </Text>
            <View style={styles.placeRow}>
              <MapPin size={15} color={common.textTertiary} />
              <Text style={styles.placeText}>{nextAppt.lugar}</Text>
            </View>
            {nextAppt.estado === "programada" ? (
              <>
                <AppButton
                  title="Sí, iré"
                  onPress={() => void handleConfirm(nextAppt)}
                  color={accent.primary}
                  large
                  icon={Check}
                  testID="btn-confirmar-cita"
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleReschedule(nextAppt)}
                  hitSlop={8}
                  style={styles.linkWrap}
                >
                  <Text style={styles.linkText}>No puedo ese día</Text>
                </Pressable>
              </>
            ) : nextAppt.estado === "confirmada" ? (
              <Text style={styles.confirmedText}>Confirmada. Te esperamos.</Text>
            ) : nextAppt.estado === "solicitud_reprogramacion" ? (
              <Text style={styles.pendingText}>Pediste otra fecha. Tu obstetra te avisará.</Text>
            ) : null}
          </Card>
        ) : (
          <Card style={styles.nextCard}>
            <Text style={styles.blockLabel}>Mi próxima cita</Text>
            <Text style={styles.emptyText}>No tienes citas pendientes.</Text>
          </Card>
        )}

        {nextVisit ? (
          <Card style={styles.visitCard}>
            <View style={styles.visitRow}>
              <HousePlus size={20} color={accent.primary} />
              <View style={styles.flex}>
                <Text style={styles.visitTitle}>Te visitarán en casa</Text>
                <Text style={styles.visitText}>
                  {capitalize(fechaLarga(nextVisit.dateKey))} · {nextVisit.time}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <SectionHeader title="Mis controles" />
        <View style={styles.listCard}>
          {controls.map((appt, index) => (
            <View key={appt.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View
                style={[
                  styles.numCircle,
                  appt.estado === "asistida"
                    ? { backgroundColor: accent.primary, borderColor: accent.primary }
                    : { borderColor: common.borderStrong },
                ]}
              >
                {appt.estado === "asistida" ? (
                  <Check size={17} color={common.white} />
                ) : (
                  <Text style={styles.numText}>{appt.control}</Text>
                )}
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Control {appt.control}</Text>
                <Text style={styles.rowMeta}>
                  {capitalize(fechaLarga(appt.dateKey))} · {appt.time}
                </Text>
              </View>
              <StatusWord estado={appt.estado} />
            </View>
          ))}
        </View>

        {extras.length > 0 ? (
          <>
            <SectionHeader title="Otras citas" />
            <View style={styles.listCard}>
              {extras.map((appt, index) => (
                <View key={appt.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {appt.motivo}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {capitalize(fechaLarga(appt.dateKey))} · {appt.time}
                    </Text>
                  </View>
                  <StatusWord estado={appt.estado} />
                </View>
              ))}
            </View>
          </>
        ) : null}
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
  blockLabel: { ...type.label, fontSize: 14, color: common.textSecondary },
  nextCard: { gap: spacing.sm2, padding: spacing.md2 },
  nextWhen: { ...type.h1 },
  nextDate: { ...type.bodyXlMd, color: common.text },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  placeText: { ...type.body, color: common.textSecondary },
  linkWrap: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: "center",
  },
  linkText: {
    ...type.bodyMd,
    fontSize: 16,
    color: common.textSecondary,
    textDecorationLine: "underline" as const,
  },
  confirmedText: { ...type.bodyXlMd, color: semantic.success },
  pendingText: { ...type.bodyXl, color: semantic.warning },
  emptyText: { ...type.bodyXl, color: common.textSecondary },
  visitCard: {
    padding: spacing.md2,
    borderColor: gestanteTheme.primaryMid,
    backgroundColor: gestanteTheme.primaryLight,
  },
  visitRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm2 },
  visitTitle: { ...type.bodyXlMd, color: common.text },
  visitText: { ...type.body, color: common.textSecondary, marginTop: 2 },
  listCard: {
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...cardBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 64,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  numCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: { ...type.numericSm, fontSize: 16, color: common.textSecondary },
  rowInfo: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { ...type.bodyXlMd, color: common.text },
  rowMeta: { ...type.body, color: common.textSecondary },
});
