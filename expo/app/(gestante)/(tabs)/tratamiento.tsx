/**
 * Pastillas: pregunta directa con casillas gigantes de un toque (funciona sin
 * señal), tu semana en circulitos, tu avance en frases simples y el
 * recordatorio diario. Al completar el día aparece el sol andino celebrando.
 * Adaptado con arquitectura responsiva Web (cuadrícula 2 columnas en escritorio).
 */
import { useRouter } from "expo-router";
import { Check, ChevronRight, Flame } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { GICON, ILU } from "@/constants/illustrations";
import { countDoses, dayDoseTotals, doseName, timesPerDayOf } from "@/lib/doses";
import { addDaysToKey, capitalize, fechaLarga } from "@/lib/format";
import { medIllustration } from "@/lib/medIllustration";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { useResponsive } from "@/hooks/useResponsive";
import { BigCheckRow } from "@/components/gestante/BigCheckRow";
import { BlockTitle } from "@/components/gestante/BlockTitle";
import { Celebration } from "@/components/gestante/Celebration";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { SoftCard } from "@/components/gestante/SoftCard";
import { WebContainer } from "@/components/web/WebContainer";
import { WebCol, WebRow } from "@/components/web/WebGrid";

const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"] as const;

export default function PastillasGestante(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, dispatch, reminders } = useApp();
  const { isDesktop } = useResponsive();
  const patient = useMyPatient();

  const supplements = view?.supplements ?? [];
  const myLogs = useMemo(
    () => (patient ? view?.intakes[patient.id] ?? {} : {}),
    [view?.intakes, patient],
  );
  const todayIntakes = myLogs[todayKey] ?? [];
  const todayTotals = dayDoseTotals(supplements, todayIntakes, todayKey);
  const allTaken = todayTotals.total > 0 && todayTotals.taken >= todayTotals.total;

  /** Últimos 7 días (hoy al final): completo / parcial / nada. */
  const week = useMemo(() => {
    const out: { key: string; letter: string; status: "full" | "partial" | "none" }[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = addDaysToKey(todayKey, -i);
      const { taken, total } = dayDoseTotals(supplements, myLogs[key], key);
      const dow = new Date(
        parseInt(key.slice(0, 4), 10),
        parseInt(key.slice(5, 7), 10) - 1,
        parseInt(key.slice(8, 10), 10),
      ).getDay();
      out.push({
        key,
        letter: DAY_LETTERS[dow],
        status: taken === 0 ? "none" : total > 0 && taken >= total ? "full" : "partial",
      });
    }
    return out;
  }, [myLogs, supplements, todayKey]);

  if (!patient || !view) {
    return <View style={styles.container} />;
  }

  const daysTaken = Math.round((patient.adherence30 / 100) * 30);

  const pillsBlockNode = (
    <PopIn delay={0}>
      <SoftCard style={styles.block}>
        <View style={styles.headRow}>
          <View style={styles.headInfo}>
            <Text style={styles.question}>
              {supplements.length > 0 ? "¿Ya tomaste tus medicamentos?" : "Tus medicamentos"}
            </Text>
            <Text style={styles.dateText}>{capitalize(fechaLarga(todayKey))}</Text>
          </View>
          <Illustration source={ILU.pastillas} width={92} height={92} />
        </View>
        {supplements.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              Aún no tienes medicamentos asignados. Tu obstetra te indicará y recetará tus suplementos en tu próximo control.
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
                    sublabel={times > 1 ? doseName(dose, times) : s.schedule}
                    onToggle={() =>
                      dispatch({
                        type: "set_intake_count",
                        patientId: patient.id,
                        supplementId: s.id,
                        dayKey: todayKey,
                        count: dose < count ? dose : dose + 1,
                      })
                    }
                    testID={`trat-toggle-${s.id}-${dose}`}
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
  );

  const weekProgressNode = supplements.length > 0 ? (
    <PopIn delay={100}>
      <SoftCard style={styles.block}>
        <BlockTitle
          illu={GICON.citas}
          title="Tu semana"
          color={gwarm.teal}
          soft={gwarm.tealSoft}
        />
        <View style={styles.weekRow}>
          {week.map((d) => {
            const isToday = d.key === todayKey;
            return (
              <View key={d.key} style={styles.weekDay}>
                <View
                  style={[
                    styles.weekDot,
                    d.status === "full" && styles.weekDotFull,
                    d.status === "partial" && styles.weekDotPartial,
                    isToday && d.status === "none" && { borderColor: gwarm.teal },
                  ]}
                >
                  {d.status === "full" ? (
                    <Check size={17} color="#FFFFFF" strokeWidth={3} />
                  ) : null}
                </View>
                <Text style={[styles.weekLetter, isToday && styles.weekLetterToday]}>
                  {d.letter}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.progressText}>
          Tomaste tus medicamentos{" "}
          <Text style={styles.progressStrong}>{daysTaken} de los últimos 30 días</Text>.
        </Text>
        {patient.streak > 1 ? (
          <View style={styles.streakRow}>
            <Flame size={19} color={gwarm.amber} />
            <Text style={styles.streakText}>¡Llevas {patient.streak} días seguidos!</Text>
          </View>
        ) : null}
      </SoftCard>
    </PopIn>
  ) : null;

  const reminderNode = (
    <PopIn delay={200}>
      <SoftCard
        onPress={() => router.push("/(gestante)/perfil")}
        style={styles.reminderCard}
        testID="card-recordatorio"
      >
        <View style={styles.reminderIcon}>
          <Illustration source={GICON.campana} width={30} height={30} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.reminderTitle}>Recordatorio diario</Text>
          <Text style={styles.reminderText}>
            {reminders.tomas
              ? `Activado, a las ${`${reminders.hora}`.padStart(2, "0")}:00`
              : "Apagado. Tócalo para activarlo."}
          </Text>
        </View>
        <ChevronRight size={22} color={gwarm.inkFaint} />
      </SoftCard>
    </PopIn>
  );

  return (
    <View style={styles.container}>
      <WebContainer size="dashboard">
        <GHeader title="Mis medicamentos" />
      </WebContainer>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="dashboard">
          {isDesktop ? (
            <WebRow gap={16}>
              <WebCol flex={7} style={styles.colStack}>
                {pillsBlockNode}
              </WebCol>
              <WebCol flex={5} style={styles.colStack}>
                {weekProgressNode}
                {reminderNode}
              </WebCol>
            </WebRow>
          ) : (
            <View style={styles.mobileStack}>
              {pillsBlockNode}
              {weekProgressNode}
              {reminderNode}
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
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  mobileStack: {
    gap: spacing.md,
  },
  colStack: {
    gap: spacing.md,
  },
  block: { gap: spacing.sm2 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  headInfo: { flex: 1, minWidth: 0, gap: 4 },
  question: {
    fontFamily: gfonts.hand,
    fontSize: 24,
    lineHeight: 31,
    color: gwarm.ink,
  },
  dateText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
  },
  pillsList: { gap: spacing.sm },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  weekDay: { alignItems: "center", gap: 5 },
  weekDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: gwarm.borderStrong,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDotFull: { backgroundColor: gwarm.teal, borderColor: gwarm.teal },
  weekDotPartial: { backgroundColor: gwarm.tealMid, borderColor: gwarm.tealMid },
  weekLetter: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.inkFaint,
  },
  weekLetterToday: { color: gwarm.teal, fontFamily: gfonts.hand, fontSize: 14.5 },
  progressText: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 24,
    color: gwarm.ink,
  },
  progressStrong: { fontFamily: gfonts.hand, fontSize: 17, color: gwarm.teal },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  streakText: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 23,
    color: gwarm.amber,
  },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    padding: spacing.md,
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: gwarm.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 25,
    color: gwarm.ink,
  },
  reminderText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  emptyText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
    textAlign: "center",
  },
});
