/**
 * Programar / reprogramar cita o visita rediseñado: encabezado ilustrado,
 * selector de tipo (en el centro / en su casa), 3 pasos con insignias que se
 * marcan al completarse, lista de pacientes con foto y semáforo, y una
 * tarjeta de resumen antes de guardar. Si el horario se ocupa, se muestran
 * los huecos libres del día.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarCheck2, Check, HousePlus, Stethoscope, WifiOff } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, warmBlue } from "@/constants/theme";
import { AGENDA_SLOTS } from "@/constants/labels";
import { ILU } from "@/constants/illustrations";
import { ApiError, avatarUri } from "@/lib/api";
import { addDaysToKey, capitalize, fechaLarga } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { DayStrip } from "@/components/DayStrip";
import { Field } from "@/components/Field";
import { Illustration } from "@/components/gestante/Illustration";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SlotGrid } from "@/components/SlotGrid";

const accent = warmBlue;

type Mode = "cita" | "reprogramar" | "visita";

/** Insignia del paso: número a mano que se convierte en check al completarse. */
function StepTitle({
  n,
  title,
  done,
}: {
  n: number;
  title: string;
  done: boolean;
}): React.ReactElement {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepNum, done && styles.stepNumDone]}>
        {done ? (
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Text style={styles.stepNumText}>{n}</Text>
        )}
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
  const initialMode: Mode =
    params.mode === "reprogramar" ? "reprogramar" : params.mode === "visita" ? "visita" : "cita";

  const { view, todayKey, schedule, online } = useApp();
  const patients = usePatients();

  const [mode, setMode] = useState<Mode>(initialMode);

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
    mode === "reprogramar" ? "Cambiar fecha" : mode === "visita" ? "Nueva visita" : "Nueva cita";
  const heroText =
    mode === "reprogramar"
      ? "Elige la nueva fecha y hora; la paciente verá el cambio al instante."
      : "Agenda en 3 pasitos: paciente, día y hora. Todo queda avisado.";

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
        <View style={styles.heroCard}>
          <Illustration source={ILU.citaNueva} width={78} height={78} />
          <Text style={styles.heroText}>{heroText}</Text>
        </View>

        {!online ? (
          <View style={styles.offlineBox}>
            <WifiOff size={16} color={gwarm.amber} />
            <Text style={styles.offlineText}>Sin conexión: necesitas señal para programar.</Text>
          </View>
        ) : null}

        {appointment ? (
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Cita actual</Text>
            <Text style={styles.currentText}>
              {fechaLarga(appointment.dateKey)} a las {appointment.time}
            </Text>
          </View>
        ) : null}

        {mode !== "reprogramar" ? (
          <View style={styles.typeRow}>
            <PressableScale
              onPress={() => setMode("cita")}
              accessibilityLabel="Cita en el centro de salud"
              style={[styles.typeChip, mode === "cita" && styles.typeChipActive]}
            >
              <Stethoscope
                size={17}
                color={mode === "cita" ? "#FFFFFF" : accent.main}
                strokeWidth={2.3}
              />
              <Text style={[styles.typeText, { color: mode === "cita" ? "#FFFFFF" : accent.deep }]}>
                En el centro
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => setMode("visita")}
              accessibilityLabel="Visita a domicilio"
              style={[styles.typeChip, mode === "visita" && styles.typeChipActive]}
            >
              <HousePlus
                size={17}
                color={mode === "visita" ? "#FFFFFF" : accent.main}
                strokeWidth={2.3}
              />
              <Text
                style={[styles.typeText, { color: mode === "visita" ? "#FFFFFF" : accent.deep }]}
              >
                En su casa
              </Text>
            </PressableScale>
          </View>
        ) : null}

        <StepTitle n={1} title="Elige a la paciente" done={patientId !== null} />
        {patient && fixedPatient ? (
          <View style={styles.patientFixed}>
            <Avatar
              uri={avatarUri(patient.dni, patient.avatarVersion)}
              color={accent.main}
              background={accent.soft}
              size={46}
              ring={risk[patient.riskLevel].solid}
            />
            <View style={styles.rowInfo}>
              <Text style={styles.patientName}>
                {patient.firstName} {patient.lastName}
              </Text>
              <Text style={styles.patientMeta}>
                Semana {patient.weeks} · {patient.community}
              </Text>
            </View>
          </View>
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
                  <Avatar
                    uri={avatarUri(p.dni, p.avatarVersion)}
                    color={accent.main}
                    background={accent.soft}
                    size={42}
                    ring={risk[p.riskLevel].solid}
                  />
                  <View style={styles.rowInfo}>
                    <Text
                      style={[styles.patientName, active && { color: accent.main }]}
                      numberOfLines={1}
                    >
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.patientMeta} numberOfLines={1}>
                      Semana {p.weeks} · {p.community}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      active
                        ? { backgroundColor: accent.main, borderColor: accent.main }
                        : { borderColor: gwarm.borderStrong },
                    ]}
                  >
                    {active ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        )}

        <StepTitle n={2} title="Elige el día" done={true} />
        <View style={styles.dayStripWrap}>
          <DayStrip
            days={days}
            selected={day}
            onSelect={selectDay}
            todayKey={todayKey}
            accent={accent.main}
            accentLight={accent.soft}
          />
        </View>
        <Text style={styles.dayLabel}>{capitalize(fechaLarga(day))}</Text>

        <StepTitle n={3} title="Elige la hora" done={slot !== null} />
        <SlotGrid taken={taken} selected={slot} onSelect={setSlot} accent={accent.main} />
        <Text style={styles.slotHint}>Los horarios tachados ya están ocupados.</Text>

        {mode !== "reprogramar" ? (
          <Field
            label="Motivo (opcional)"
            value={motivo}
            onChangeText={setMotivo}
            placeholder={mode === "visita" ? "Motivo de la visita" : "Motivo de la cita"}
            accent={accent.main}
            maxLength={120}
          />
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {patient && slot ? (
          <View style={styles.summaryCard}>
            <Illustration source={ILU.citaNueva} width={52} height={52} />
            <View style={styles.rowInfo}>
              <Text style={styles.summaryTitle}>
                {mode === "visita" ? "Visita a" : mode === "reprogramar" ? "Nueva fecha para" : "Cita de"}{" "}
                {patient.firstName}
              </Text>
              <Text style={styles.summaryText}>
                {capitalize(fechaLarga(day))} · {slot}
              </Text>
              <Text style={styles.summaryPlace}>
                {mode === "visita" ? "En su casa" : "En el centro de salud"}
              </Text>
            </View>
          </View>
        ) : null}

        <AppButton
          title={
            slot
              ? `Guardar ${mode === "visita" ? "visita" : "cita"} · ${slot}`
              : "Elige un horario"
          }
          onPress={() => void submit()}
          color={accent.main}
          icon={CalendarCheck2}
          disabled={!canSubmit}
          loading={submitting}
          large
          testID="btn-programar"
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
    paddingBottom: 48,
    gap: 12,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: gwarm.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 14,
    ...gShadow,
  },
  heroText: {
    flex: 1,
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 21,
    color: gwarm.inkSoft,
  },
  offlineBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: gwarm.amberSoft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: gwarm.amberMid,
    padding: 12,
  },
  offlineText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.amber,
    flex: 1,
  },
  currentCard: {
    backgroundColor: warmBlue.soft,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: warmBlue.mid,
    padding: 14,
    gap: 2,
  },
  currentLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: warmBlue.deep,
  },
  currentText: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.ink,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 46,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: accent.mid,
    backgroundColor: gwarm.surface,
  },
  typeChipActive: {
    backgroundColor: accent.main,
    borderColor: accent.main,
  },
  typeText: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: warmBlue.soft,
    borderWidth: 1.5,
    borderColor: warmBlue.mid,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumDone: {
    backgroundColor: gwarm.teal,
    borderColor: gwarm.teal,
  },
  stepNumText: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 20,
    color: accent.deep,
  },
  stepTitle: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 26,
    color: gwarm.ink,
  },
  patientFixed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 14,
    ...gShadow,
  },
  listCard: {
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingHorizontal: 15,
    ...gShadow,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    minHeight: 60,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  patientName: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  patientMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  dayStripWrap: { marginHorizontal: -16 },
  dayLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: accent.deep,
    marginTop: -6,
  },
  slotHint: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
  errorBox: {
    backgroundColor: gwarm.redSoft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: gwarm.redMid,
    padding: 12,
  },
  errorText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.rose,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: gwarm.tealSoft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.tealMid,
    padding: 14,
  },
  summaryTitle: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 23,
    color: gwarm.tealDeep,
  },
  summaryText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.ink,
  },
  summaryPlace: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
});
