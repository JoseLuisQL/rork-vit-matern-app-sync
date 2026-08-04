/**
 * Programar / reprogramar cita o visita en 3 pasos claros:
 * 1 elegir paciente (lista ordenada), 2 elegir día, 3 elegir hora.
 * Si el horario se ocupa, se muestran los huecos libres del día.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarCheck2, Check, WifiOff } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { cardBorder, common, obstetraTheme, radius, semantic, spacing, type } from "@/constants/theme";
import { AGENDA_SLOTS } from "@/constants/labels";
import { ApiError } from "@/lib/api";
import { addDaysToKey, fechaLarga } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { DayStrip } from "@/components/DayStrip";
import { Field } from "@/components/Field";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SlotGrid } from "@/components/SlotGrid";

const accent = obstetraTheme;

type Mode = "cita" | "reprogramar" | "visita";

function StepTitle({ n, title }: { n: number; title: string }): React.ReactElement {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );
}

export default function ProgramarScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    patientId?: string;
    appointmentId?: string;
    date?: string;
  }>();
  const mode: Mode =
    params.mode === "reprogramar" ? "reprogramar" : params.mode === "visita" ? "visita" : "cita";

  const { view, todayKey, schedule, online } = useApp();
  const patients = usePatients();

  const appointment = useMemo(
    () =>
      mode === "reprogramar"
        ? (view?.appointments ?? []).find((a) => a.id === params.appointmentId) ?? null
        : null,
    [mode, view?.appointments, params.appointmentId],
  );

  const [patientId, setPatientId] = useState<string | null>(
    appointment?.patientId ?? params.patientId ?? null,
  );
  const [day, setDay] = useState<string>(
    params.date && params.date >= todayKey ? params.date : todayKey,
  );
  const [slot, setSlot] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serverFree, setServerFree] = useState<{ day: string; slots: string[] } | null>(null);

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysToKey(todayKey, i)),
    [todayKey],
  );

  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [patients],
  );

  const fixedPatient = mode === "reprogramar" || params.patientId != null;

  const taken = useMemo(() => {
    if (serverFree && serverFree.day === day) {
      return new Set(AGENDA_SLOTS.filter((s) => !serverFree.slots.includes(s)));
    }
    const set = new Set<string>();
    (view?.appointments ?? []).forEach((a) => {
      if (
        a.dateKey === day &&
        a.id !== appointment?.id &&
        (a.estado === "programada" ||
          a.estado === "confirmada" ||
          a.estado === "solicitud_reprogramacion")
      ) {
        set.add(a.time);
      }
    });
    (view?.visits ?? []).forEach((v) => {
      if (v.dateKey === day && v.estado === "programada") set.add(v.time);
    });
    return set;
  }, [view, day, appointment?.id, serverFree]);

  const selectDay = useCallback((d: string) => {
    setDay(d);
    setSlot(null);
    setServerFree(null);
    setError(null);
  }, []);

  const patient = patients.find((p) => p.id === patientId) ?? null;
  const title =
    mode === "reprogramar"
      ? "Cambiar fecha"
      : mode === "visita"
        ? "Nueva visita"
        : "Nueva cita";

  const canSubmit = online && patientId !== null && slot !== null && !submitting;

  const submit = useCallback(async () => {
    if (!patientId || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      await schedule({
        mode,
        patientId,
        appointmentId: appointment?.id,
        dateKey: day,
        time: slot,
        motivo: motivo.trim() || undefined,
      });
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.freeSlots) {
        setServerFree({ day, slots: e.freeSlots });
        setSlot(null);
        setError("Ese horario acaba de ocuparse. Estos son los horarios libres del día.");
      } else if (e instanceof ApiError && e.status === 0) {
        setError("Sin conexión. Inténtalo cuando vuelva la señal.");
      } else {
        setError(e instanceof Error ? e.message : "No se pudo programar.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [patientId, slot, schedule, mode, appointment?.id, day, motivo, router]);

  return (
    <View style={styles.container}>
      <ScreenHeader title={title} showBack />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!online ? (
          <View style={styles.offlineBox}>
            <WifiOff size={16} color={semantic.warning} />
            <Text style={styles.offlineText}>Sin conexión: necesitas señal para programar.</Text>
          </View>
        ) : null}

        {appointment ? (
          <Card style={styles.currentCard}>
            <Text style={styles.currentLabel}>Cita actual</Text>
            <Text style={styles.currentText}>
              {fechaLarga(appointment.dateKey)} a las {appointment.time}
            </Text>
          </Card>
        ) : null}

        <StepTitle n={1} title="Elige a la paciente" />
        {patient && fixedPatient ? (
          <Card style={styles.patientFixed}>
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={styles.patientMeta}>
              Semana {patient.weeks} · {patient.community}
            </Text>
          </Card>
        ) : (
          <View style={styles.listCard}>
            {sortedPatients.map((p, index) => {
              const active = patientId === p.id;
              return (
                <PressableScale
                  key={p.id}
                  onPress={() => setPatientId(p.id)}
                  accessibilityLabel={`Elegir a ${p.firstName} ${p.lastName}`}
                  style={[styles.patientRow, index > 0 && styles.rowBorder]}
                  testID={`elegir-${p.id}`}
                >
                  <View
                    style={[
                      styles.radio,
                      active
                        ? { backgroundColor: accent.primary, borderColor: accent.primary }
                        : { borderColor: common.borderStrong },
                    ]}
                  >
                    {active ? <Check size={15} color={common.white} /> : null}
                  </View>
                  <View style={styles.rowInfo}>
                    <Text
                      style={[styles.patientName, active && { color: accent.primary }]}
                      numberOfLines={1}
                    >
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.patientMeta} numberOfLines={1}>
                      Semana {p.weeks} · {p.community}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        )}

        <StepTitle n={2} title="Elige el día" />
        <View style={styles.dayStripWrap}>
          <DayStrip
            days={days}
            selected={day}
            onSelect={selectDay}
            todayKey={todayKey}
            accent={accent.primary}
            accentLight={accent.primaryLight}
          />
        </View>

        <StepTitle n={3} title="Elige la hora" />
        <Card>
          <SlotGrid taken={taken} selected={slot} onSelect={setSlot} accent={accent.primary} />
          <Text style={styles.slotHint}>Los horarios tachados ya están ocupados.</Text>
        </Card>

        {mode !== "reprogramar" ? (
          <Field
            label="Motivo (opcional)"
            value={motivo}
            onChangeText={setMotivo}
            placeholder={mode === "visita" ? "Motivo de la visita" : "Motivo de la cita"}
            accent={accent.primary}
            maxLength={120}
          />
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppButton
          title={
            slot
              ? `Guardar ${mode === "visita" ? "visita" : "cita"} · ${slot}`
              : "Elige un horario"
          }
          onPress={() => void submit()}
          color={accent.primary}
          icon={CalendarCheck2}
          disabled={!canSubmit}
          loading={submitting}
          testID="btn-programar"
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
    paddingBottom: spacing.xxl,
    gap: spacing.sm2,
  },
  offlineBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: semantic.warningLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.warningMid,
    padding: spacing.sm2,
  },
  offlineText: { ...type.body, color: semantic.warning, flex: 1 },
  currentCard: { gap: 2 },
  currentLabel: { ...type.label, color: common.textSecondary },
  currentText: { ...type.bodyMd, fontSize: 16, color: common.text },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: obstetraTheme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { ...type.buttonSm, color: common.white },
  stepTitle: { ...type.h3, fontSize: 17, color: common.text },
  patientFixed: { gap: 2 },
  listCard: {
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...cardBorder,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 56,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  radio: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  patientName: { ...type.bodyMd, fontSize: 16, color: common.text },
  patientMeta: { ...type.bodySm, color: common.textSecondary },
  dayStripWrap: { marginHorizontal: -spacing.md },
  slotHint: { ...type.bodySm, color: common.textTertiary, marginTop: spacing.sm },
  errorBox: {
    backgroundColor: semantic.dangerLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: semantic.dangerMid,
    padding: spacing.sm2,
  },
  errorText: { ...type.body, color: semantic.danger },
});
