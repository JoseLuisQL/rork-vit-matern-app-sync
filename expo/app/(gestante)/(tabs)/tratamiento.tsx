/**
 * Pastillas: pregunta directa "¿Tomaste tus pastillas hoy?" con casillas
 * gigantes (funciona sin señal), avance en frases simples y últimos 7 días.
 */
import { useRouter } from "expo-router";
import { Bell, Check, ChevronRight } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { common, gestanteTheme, radius, semantic, spacing, type } from "@/constants/theme";
import { addDaysToKey, capitalize, fechaLarga } from "@/lib/format";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { Card } from "@/components/Card";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = gestanteTheme;
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
      <ScreenHeader title="Pastillas" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.block}>
          <Text style={styles.question}>¿Tomaste tus pastillas hoy?</Text>
          <Text style={styles.dateText}>{capitalize(fechaLarga(todayKey))}</Text>
          {supplements.map((s, index) => {
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
                style={[styles.suppRow, index > 0 && styles.suppRowBorder]}
                testID={`trat-toggle-${s.id}`}
              >
                <View
                  style={[
                    styles.checkCircle,
                    taken
                      ? { backgroundColor: accent.primary, borderColor: accent.primary }
                      : { borderColor: common.borderStrong },
                  ]}
                >
                  {taken ? <Check size={22} color={common.white} /> : null}
                </View>
                <View style={styles.suppInfo}>
                  <Text style={[styles.suppName, taken && styles.suppDone]}>{s.name}</Text>
                  <Text style={styles.suppMeta}>{s.schedule}</Text>
                </View>
              </PressableScale>
            );
          })}
          {allTaken ? (
            <Text style={styles.allDoneText}>¡Muy bien! Ya tomaste todo lo de hoy.</Text>
          ) : null}
        </Card>

        <Card style={styles.block}>
          <Text style={styles.blockLabel}>Tu avance</Text>
          <Text style={styles.progressText}>
            Tomaste tus pastillas{" "}
            <Text style={{ color: accent.primary }}>{daysTaken} de los últimos 30 días</Text>.
          </Text>
          {patient.streak > 1 ? (
            <Text style={styles.streakText}>¡Llevas {patient.streak} días seguidos!</Text>
          ) : null}
          <View style={styles.weekRow}>
            {week.map((d) => (
              <View key={d.key} style={styles.weekDay}>
                <View
                  style={[
                    styles.weekDot,
                    d.status === "full" && {
                      backgroundColor: accent.primary,
                      borderColor: accent.primary,
                    },
                    d.status === "partial" && {
                      backgroundColor: accent.primaryMid,
                      borderColor: accent.primaryMid,
                    },
                  ]}
                >
                  {d.status === "full" ? <Check size={15} color={common.white} /> : null}
                </View>
                <Text
                  style={[styles.weekLetter, d.key === todayKey && { color: accent.primary }]}
                >
                  {d.letter}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card onPress={() => router.push("/(gestante)/perfil")} style={styles.reminderCard}>
          <View style={[styles.reminderIcon, { backgroundColor: accent.primaryLight }]}>
            <Bell size={22} color={accent.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.reminderTitle}>Recordatorio diario</Text>
            <Text style={styles.reminderText}>
              {reminders.tomas
                ? `Activado, a las ${`${reminders.hora}`.padStart(2, "0")}:00`
                : "Apagado. Tócalo para activarlo."}
            </Text>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  block: { gap: spacing.sm2, padding: spacing.md2 },
  blockLabel: { ...type.label, fontSize: 14, color: common.textSecondary },
  question: { ...type.h2, color: common.text },
  dateText: { ...type.body, color: common.textSecondary },
  suppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm2,
    minHeight: 64,
  },
  suppRowBorder: {
    borderTopWidth: 1,
    borderTopColor: common.border,
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  suppInfo: { flex: 1, gap: 2 },
  suppName: { ...type.bodyXlMd, color: common.text },
  suppDone: { color: common.textTertiary, textDecorationLine: "line-through" as const },
  suppMeta: { ...type.body, color: common.textSecondary },
  allDoneText: { ...type.bodyMd, fontSize: 16, color: semantic.success },
  progressText: { ...type.bodyXl, color: common.text },
  streakText: { ...type.bodyXlMd, color: semantic.warning },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  weekDay: { alignItems: "center", gap: 4 },
  weekDot: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: common.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  weekLetter: { ...type.bodySm, color: common.textTertiary },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    padding: spacing.md2,
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: { ...type.bodyXlMd, color: common.text },
  reminderText: { ...type.body, color: common.textSecondary, marginTop: 2 },
});
