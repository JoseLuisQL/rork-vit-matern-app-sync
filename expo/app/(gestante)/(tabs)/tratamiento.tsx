/**
 * Pastillas: pregunta directa con casillas gigantes de un toque (funciona sin
 * señal), tu semana en circulitos, tu avance en frases simples y el
 * recordatorio diario. Al completar el día aparece el sol andino celebrando.
 */
import { useRouter } from "expo-router";
import { Bell, CalendarDays, Check, ChevronRight, Flame } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { fonts, gwarm, spacing } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { addDaysToKey, capitalize, fechaLarga } from "@/lib/format";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { BigCheckRow } from "@/components/gestante/BigCheckRow";
import { BlockTitle } from "@/components/gestante/BlockTitle";
import { Celebration } from "@/components/gestante/Celebration";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { SoftCard } from "@/components/gestante/SoftCard";

const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"] as const;

export default function PastillasGestante(): React.ReactElement {
  const router = useRouter();
  const { view, todayKey, dispatch, reminders } = useApp();
  const patient = useMyPatient();

  const supplements = view?.supplements ?? [];
  const myLogs = useMemo(
    () => (patient ? view?.intakes[patient.id] ?? {} : {}),
    [view?.intakes, patient],
  );
  const todayIntakes = myLogs[todayKey] ?? [];
  const allTaken =
    supplements.length > 0 && supplements.every((s) => todayIntakes.includes(s.id));

  /** Últimos 7 días (hoy al final): completo / parcial / nada. */
  const week = useMemo(() => {
    const out: { key: string; letter: string; status: "full" | "partial" | "none" }[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = addDaysToKey(todayKey, -i);
      const logs = myLogs[key] ?? [];
      const taken = supplements.filter((s) => logs.includes(s.id)).length;
      const dow = new Date(
        parseInt(key.slice(0, 4), 10),
        parseInt(key.slice(5, 7), 10) - 1,
        parseInt(key.slice(8, 10), 10),
      ).getDay();
      out.push({
        key,
        letter: DAY_LETTERS[dow],
        status: taken === 0 ? "none" : taken >= supplements.length ? "full" : "partial",
      });
    }
    return out;
  }, [myLogs, supplements, todayKey]);

  if (!patient || !view) {
    return <View style={styles.container} />;
  }

  const daysTaken = Math.round((patient.adherence30 / 100) * 30);

  return (
    <View style={styles.container}>
      <GHeader title="Mis pastillas" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PopIn delay={0}>
          <SoftCard style={styles.block}>
            <View style={styles.headRow}>
              <View style={styles.headInfo}>
                <Text style={styles.question}>¿Ya tomaste tus pastillas?</Text>
                <Text style={styles.dateText}>{capitalize(fechaLarga(todayKey))}</Text>
              </View>
              <Illustration source={ILU.pastillas} width={92} height={92} />
            </View>
            <View style={styles.pillsList}>
              {supplements.map((s) => {
                const taken = todayIntakes.includes(s.id);
                return (
                  <BigCheckRow
                    key={s.id}
                    checked={taken}
                    label={s.name}
                    sublabel={s.schedule}
                    onToggle={() =>
                      dispatch({
                        type: "toggle_intake",
                        patientId: patient.id,
                        supplementId: s.id,
                        dayKey: todayKey,
                        taken: !taken,
                      })
                    }
                    testID={`trat-toggle-${s.id}`}
                  />
                );
              })}
            </View>
            {allTaken ? (
              <Celebration title="¡Muy bien!" text="Ya tomaste todo lo de hoy." />
            ) : null}
          </SoftCard>
        </PopIn>

        <PopIn delay={100}>
          <SoftCard style={styles.block}>
            <BlockTitle
              icon={CalendarDays}
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
              Tomaste tus pastillas{" "}
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

        <PopIn delay={200}>
          <SoftCard
            onPress={() => router.push("/(gestante)/perfil")}
            style={styles.reminderCard}
            testID="card-recordatorio"
          >
            <View style={styles.reminderIcon}>
              <Bell size={22} color={gwarm.teal} strokeWidth={2.2} />
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
  block: { gap: spacing.sm2 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  headInfo: { flex: 1, minWidth: 0, gap: 4 },
  question: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: gwarm.ink,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 15,
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
    fontFamily: fonts.medium,
    fontSize: 13,
    color: gwarm.inkFaint,
  },
  weekLetterToday: { color: gwarm.teal, fontFamily: fonts.bold },
  progressText: {
    fontFamily: fonts.regular,
    fontSize: 16.5,
    lineHeight: 24,
    color: gwarm.ink,
  },
  progressStrong: { fontFamily: fonts.semibold, color: gwarm.teal },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  streakText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
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
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    color: gwarm.ink,
  },
  reminderText: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
});
