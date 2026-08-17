/**
 * Inicio de la gestante — "cuaderno de cuidado".
 * Diseñado para usuarias rurales con poca lectura: una idea por tarjeta,
 * ilustraciones que se entienden sin leer, botones gigantes y entrada
 * escalonada suave. Orden lógico: mi embarazo → mi cita → mis pastillas →
 * ayuda → consejos.
 */
import { useRouter } from "expo-router";
import { Baby, ChevronRight, Siren } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { GICON, ILU } from "@/constants/illustrations";
import { avatarUri } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { countDoses, dayDoseTotals, doseName, timesPerDayOf } from "@/lib/doses";
import { capitalize, fechaCompleta, fechaLarga } from "@/lib/format";
import { medIllustration } from "@/lib/medIllustration";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PressableScale } from "@/components/PressableScale";
import { AnimatedBar } from "@/components/gestante/AnimatedBar";
import { BigCheckRow } from "@/components/gestante/BigCheckRow";
import { BlockTitle } from "@/components/gestante/BlockTitle";
import { Celebration } from "@/components/gestante/Celebration";
import { CitaProxima } from "@/components/gestante/CitaProxima";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { SoftCard } from "@/components/gestante/SoftCard";

export default function InicioGestante(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { view, todayKey, dispatch, user } = useApp();
  const patient = useMyPatient();

  const nextAppt = useMemo(() => {
    if (!patient?.nextAppointment || !view) return null;
    return (
      view.appointments.find((a) => a.id === patient.nextAppointment?.id) ??
      patient.nextAppointment
    );
  }, [patient, view]);

  const todayIntakes = useMemo(() => {
    if (!view || !patient) return [];
    return view.intakes[patient.id]?.[todayKey] ?? [];
  }, [view, patient, todayKey]);

  const supplements = view?.supplements ?? [];
  const todayTotals = dayDoseTotals(supplements, todayIntakes, todayKey);
  const allTaken = todayTotals.total > 0 && todayTotals.taken >= todayTotals.total;

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
        <ActivityIndicator color={gwarm.teal} />
        <Text style={styles.loadingText}>Cargando tu información…</Text>
      </View>
    );
  }

  const weeks = patient.weeks;
  const remaining = Math.max(0, 40 - weeks);
  const hour = new Date().getHours();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm2 }]}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerDate} numberOfLines={1}>
            {capitalize(fechaLarga(todayKey))}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {saludo}, {user.firstName}
          </Text>
        </View>
        <PressableScale
          onPress={() => router.push("/(gestante)/perfil")}
          accessibilityLabel="Mi perfil"
          testID="btn-perfil"
        >
          <Avatar
            uri={avatarUri(user.dni, user.avatarVersion)}
            color={gwarm.teal}
            background={gwarm.tealSoft}
            size={52}
          />
        </PressableScale>
      </View>
      <OfflineBanner />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PopIn delay={0}>
          <SoftCard style={styles.babyCard}>
            <View style={styles.babyRow}>
              <View style={styles.babyInfo}>
                <Text style={styles.babyKicker}>Mi embarazo</Text>
                <Text style={styles.weekBig}>
                  Semana <Text style={styles.weekNum}>{weeks}</Text>
                </Text>
                <Text style={styles.babyMeta}>
                  {remaining > 0
                    ? `Faltan ${remaining} semanas para conocer a tu bebé`
                    : "Tu bebé puede llegar en cualquier momento"}
                </Text>
              </View>
              <Illustration source={ILU.mama} width={106} height={130} />
            </View>
            <AnimatedBar progress={weeks / 40} color={gwarm.teal} trackColor={gwarm.tealSoft} />
            <View style={styles.fppRow}>
              <Baby size={17} color={gwarm.terracotta} />
              <Text style={styles.fppText}>Nacería el {fechaCompleta(patient.fppKey)}</Text>
            </View>
          </SoftCard>
        </PopIn>

        <PopIn delay={80}>
          {nextAppt ? (
            <CitaProxima
              appt={nextAppt}
              todayKey={todayKey}
              onConfirm={() => void handleConfirm()}
              onReschedule={() => void handleReschedule()}
            />
          ) : (
            <SoftCard style={styles.emptyCitaCard}>
              <Illustration source={ILU.obstetra} width={74} height={90} />
              <View style={styles.flex}>
                <Text style={styles.emptyCitaTitle}>Sin citas pendientes</Text>
                <Text style={styles.emptyCitaText}>
                  Tu obstetra te avisará tu próximo control.
                </Text>
              </View>
            </SoftCard>
          )}
        </PopIn>

        <PopIn delay={160}>
          <SoftCard style={styles.pillsCard}>
            <BlockTitle
              illu={GICON.pastillas}
              title={supplements.length > 0 ? "Mis pastillas de hoy" : "Mis pastillas"}
              color={gwarm.terracotta}
              soft={gwarm.terracottaSoft}
            />
            {supplements.length === 0 ? (
              <View style={styles.emptyPillsBox}>
                <Text style={styles.emptyPillsText}>
                  Aún no tienes pastillas asignadas. Tu obstetra te las indicará en tu próximo control prenatal.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.pillsList}>
                  {supplements.map((s) => {
                    const times = timesPerDayOf(s);
                    const count = countDoses(todayIntakes, s.id);
                    return Array.from({ length: times }, (_, dose) => (
                      <BigCheckRow
                        key={`${s.id}-${dose}`}
                        checked={dose < count}
                        label={s.name}
                        illustration={medIllustration(s.name)}
                        sublabel={times > 1 ? doseName(dose, times) : undefined}
                        onToggle={() =>
                          dispatch({
                            type: "set_intake_count",
                            patientId: patient.id,
                            supplementId: s.id,
                            dayKey: todayKey,
                            count: dose < count ? dose : dose + 1,
                          })
                        }
                        testID={`toggle-${s.id}-${dose}`}
                      />
                    ));
                  })}
                </View>
                {allTaken ? (
                  <Celebration title="¡Muy bien!" text="Ya tomaste todo lo de hoy." />
                ) : null}
              </>
            )}
          </SoftCard>
        </PopIn>

        <PopIn delay={240}>
          <SoftCard style={styles.helpCard}>
            <View style={styles.helpRow}>
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>¿Te sientes mal?</Text>
                <Text style={styles.helpText}>Avísanos y te ayudamos al instante.</Text>
              </View>
              <Illustration source={ILU.manos} width={88} height={88} />
            </View>
            <AppButton
              title="Pedir ayuda"
              onPress={() => router.push("/(gestante)/alarmas")}
              variant="danger"
              large
              hand
              icon={Siren}
              testID="btn-sos"
            />
          </SoftCard>
        </PopIn>

        <PopIn delay={320}>
          <SoftCard
            onPress={() => router.push("/(gestante)/educacion")}
            style={styles.learnCard}
            testID="card-educacion"
          >
            <Illustration source={GICON.libro} width={64} height={64} />
            <View style={styles.flex}>
              <Text style={styles.learnTitle}>Consejos para ti</Text>
              <Text style={styles.learnMeta}>Se leen aunque no tengas señal</Text>
            </View>
            <ChevronRight size={22} color={gwarm.inkFaint} />
          </SoftCard>
        </PopIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: gwarm.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm2,
  },
  loadingText: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    color: gwarm.inkSoft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm2,
  },
  headerInfo: { flex: 1, minWidth: 0, gap: 2 },
  headerDate: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  headerTitle: {
    fontFamily: gfonts.hand,
    fontSize: 30,
    lineHeight: 37,
    color: gwarm.ink,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  babyCard: { gap: spacing.sm2 },
  babyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  babyInfo: { flex: 1, minWidth: 0, gap: 4 },
  babyKicker: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0.4,
    color: gwarm.terracotta,
  },
  weekBig: {
    fontFamily: gfonts.hand,
    fontSize: 30,
    lineHeight: 38,
    color: gwarm.ink,
  },
  weekNum: { color: gwarm.teal, fontSize: 38 },
  babyMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    lineHeight: 21,
    color: gwarm.inkSoft,
  },
  fppRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  fppText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.ink,
    flex: 1,
  },
  emptyCitaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  emptyCitaTitle: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 26,
    color: gwarm.ink,
  },
  emptyCitaText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  pillsCard: { gap: spacing.sm2 },
  pillsList: { gap: spacing.sm },
  emptyPillsBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  emptyPillsText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
    textAlign: "center",
  },
  helpCard: {
    gap: spacing.sm2,
    backgroundColor: gwarm.redSoft,
    borderColor: gwarm.redMid,
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  helpInfo: { flex: 1, minWidth: 0, gap: 4 },
  helpTitle: {
    fontFamily: gfonts.hand,
    fontSize: 24,
    lineHeight: 30,
    color: gwarm.ink,
  },
  helpText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
  },
  learnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    padding: spacing.md,
  },
  learnTitle: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 26,
    color: gwarm.ink,
  },
  learnMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
});
