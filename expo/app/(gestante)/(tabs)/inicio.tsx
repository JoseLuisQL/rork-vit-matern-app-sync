/**
 * Inicio de la gestante — saludo con foto de perfil y 4 bloques grandes
 * en orden: 1) tu semana de embarazo, 2) tu próxima cita con "Sí, iré",
 * 3) tus pastillas de hoy, 4) el botón rojo de ayuda. Los consejos se
 * abren desde el botón del final.
 */
import { useRouter } from "expo-router";
import { BookOpen, Check, CheckCircle2, ChevronRight, MapPin, Siren } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  common,
  gestanteTheme,
  radius,
  semantic,
  spacing,
  type,
  withAlpha,
} from "@/constants/theme";
import { avatarUri } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { capitalize, etiquetaRelativa, fechaCompleta, fechaLarga } from "@/lib/format";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { HomeHeader } from "@/components/HomeHeader";
import { PressableScale } from "@/components/PressableScale";

const accent = gestanteTheme;

export default function InicioGestante(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, dispatch, user } = useApp();
  const patient = useMyPatient();

  const nextAppt = useMemo(() => {
    if (!patient?.nextAppointment || !view) return null;
    return view.appointments.find((a) => a.id === patient.nextAppointment?.id) ?? patient.nextAppointment;
  }, [patient, view]);

  const todayIntakes = useMemo(() => {
    if (!view || !patient) return [];
    return view.intakes[patient.id]?.[todayKey] ?? [];
  }, [view, patient, todayKey]);

  const supplements = view?.supplements ?? [];
  const takenCount = supplements.filter((s) => todayIntakes.includes(s.id)).length;
  const allTaken = supplements.length > 0 && takenCount === supplements.length;

  const handleConfirm = useCallback(async () => {
    if (!nextAppt) return;
    const ok = await confirmAction({
      title: "Confirmar cita",
      message: `¿Irás a tu cita del ${fechaLarga(nextAppt.dateKey)} a las ${nextAppt.time}?`,
      confirmText: "Sí, iré",
    });
    if (ok) dispatch({ type: "confirm_appointment", appointmentId: nextAppt.id });
  }, [nextAppt, dispatch]);

  const handleReschedule = useCallback(async () => {
    if (!nextAppt) return;
    const ok = await confirmAction({
      title: "Pedir otra fecha",
      message: "Tu obstetra te propondrá una nueva fecha.",
      confirmText: "Pedir cambio",
    });
    if (ok) dispatch({ type: "request_reschedule", appointmentId: nextAppt.id });
  }, [nextAppt, dispatch]);

  if (!patient || !view || !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={accent.primary} />
        <Text style={styles.loadingText}>Cargando tu información…</Text>
      </View>
    );
  }

  const weeksProgress = Math.min(1, patient.weeks / 40);

  return (
    <View style={styles.container}>
      <HomeHeader
        overline={fechaLarga(todayKey)}
        title={`Hola, ${user.firstName}`}
        avatarUri={avatarUri(user.dni, user.avatarVersion)}
        accentColor={accent.primary}
        accentBackground={accent.primaryLight}
        onAvatarPress={() => router.push("/(gestante)/perfil")}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.block}>
          <Text style={styles.kicker}>Mi embarazo</Text>
          <Text style={styles.weekTitle}>
            Estás en la semana <Text style={{ color: accent.primary }}>{patient.weeks}</Text>
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(weeksProgress * 100, 4)}%` }]} />
          </View>
          <Text style={styles.weekMeta}>
            Tu bebé nacería alrededor del {fechaCompleta(patient.fppKey)}.
          </Text>
        </Card>

        <Card style={styles.block}>
          <Text style={styles.kicker}>Mi próxima cita</Text>
          {nextAppt ? (
            <>
              <Text style={[styles.apptWhen, { color: accent.primary }]}>
                {etiquetaRelativa(nextAppt.dateKey, todayKey)}
              </Text>
              <Text style={styles.apptDate}>
                {capitalize(fechaLarga(nextAppt.dateKey))} · {nextAppt.time}
              </Text>
              <View style={styles.apptPlaceRow}>
                <MapPin size={15} color={common.textTertiary} />
                <Text style={styles.apptPlace}>{nextAppt.lugar}</Text>
              </View>
              {nextAppt.estado === "programada" ? (
                <>
                  <AppButton
                    title="Sí, iré"
                    onPress={() => void handleConfirm()}
                    color={accent.primary}
                    large
                    icon={Check}
                    testID="btn-confirmar-cita"
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void handleReschedule()}
                    hitSlop={8}
                    style={styles.linkWrap}
                  >
                    <Text style={styles.linkText}>No puedo ese día</Text>
                  </Pressable>
                </>
              ) : nextAppt.estado === "confirmada" ? (
                <View style={styles.confirmedRow}>
                  <CheckCircle2 size={20} color={semantic.success} />
                  <Text style={styles.confirmedText}>Confirmada. Te esperamos.</Text>
                </View>
              ) : nextAppt.estado === "solicitud_reprogramacion" ? (
                <Text style={styles.pendingText}>
                  Pediste otra fecha. Tu obstetra te avisará.
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.apptEmpty}>No tienes citas pendientes.</Text>
          )}
        </Card>

        <Card style={styles.block}>
          <Text style={styles.kicker}>Mis pastillas de hoy</Text>
          {supplements.map((s) => {
            const taken = todayIntakes.includes(s.id);
            return (
              <PressableScale
                key={s.id}
                onPress={() =>
                  dispatch({
                    type: "toggle_intake",
                    patientId: patient.id,
                    supplementId: s.id,
                    dayKey: todayKey,
                    taken: !taken,
                  })
                }
                accessibilityLabel={`${taken ? "Desmarcar" : "Marcar"} ${s.name}`}
                style={styles.suppRow}
                testID={`toggle-${s.id}`}
              >
                <View
                  style={[
                    styles.checkCircle,
                    taken
                      ? { backgroundColor: accent.primary, borderColor: accent.primary }
                      : { borderColor: common.borderStrong },
                  ]}
                >
                  {taken ? <Check size={20} color={common.white} /> : null}
                </View>
                <Text style={[styles.suppName, taken && styles.suppNameDone]} numberOfLines={2}>
                  {s.name}
                </Text>
              </PressableScale>
            );
          })}
          {allTaken ? (
            <Text style={styles.allDoneText}>¡Muy bien! Ya tomaste todo lo de hoy.</Text>
          ) : null}
        </Card>

        <Card style={styles.sosCard}>
          <Text style={styles.sosTitle}>¿Te sientes mal?</Text>
          <AppButton
            title="Pedir ayuda"
            onPress={() => router.push("/(gestante)/alarmas")}
            variant="danger"
            large
            icon={Siren}
            testID="btn-sos"
          />
        </Card>

        <Card onPress={() => router.push("/(gestante)/educacion")} style={styles.learnCard}>
          <View style={styles.learnIcon}>
            <BookOpen size={24} color={accent.primary} strokeWidth={2} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.learnTitle}>Consejos para tu embarazo</Text>
            <Text style={styles.learnMeta}>Se pueden leer sin señal</Text>
          </View>
          <ChevronRight size={20} color={common.textTertiary} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: common.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm2,
  },
  loadingText: { ...type.body, color: common.textSecondary },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  block: {
    gap: spacing.sm2,
    padding: spacing.md2,
  },
  kicker: {
    ...type.overline,
    fontSize: 11.5,
    color: common.textTertiary,
    textTransform: "uppercase" as const,
  },
  weekTitle: { ...type.h1, color: common.text },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: gestanteTheme.primaryLight,
    overflow: "hidden" as const,
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: gestanteTheme.primary,
  },
  weekMeta: { ...type.bodyXl, color: common.textSecondary },
  apptWhen: { ...type.h1 },
  apptDate: { ...type.bodyXlMd, color: common.text },
  apptPlaceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  apptPlace: { ...type.body, color: common.textSecondary },
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
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: semantic.successLight,
    borderRadius: radius.md,
    padding: spacing.sm2,
  },
  confirmedText: { ...type.bodyXlMd, color: semantic.success },
  pendingText: { ...type.bodyXl, color: semantic.warning },
  apptEmpty: { ...type.bodyXl, color: common.textSecondary },
  suppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  suppName: { ...type.bodyXlMd, color: common.text, flex: 1 },
  suppNameDone: { color: common.textTertiary, textDecorationLine: "line-through" as const },
  allDoneText: { ...type.bodyMd, fontSize: 16, color: semantic.success },
  sosCard: {
    gap: spacing.sm2,
    padding: spacing.md2,
    borderColor: semantic.dangerMid,
    backgroundColor: semantic.dangerLight,
  },
  sosTitle: { ...type.h2, color: common.text },
  learnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    padding: spacing.md,
  },
  learnIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: withAlpha(gestanteTheme.primary, 0.18),
    backgroundColor: withAlpha(gestanteTheme.primary, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  learnTitle: { ...type.bodyXlMd, color: common.text },
  learnMeta: { ...type.body, color: common.textSecondary, marginTop: 2 },
});
