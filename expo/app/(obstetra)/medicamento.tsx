/**
 * Asignar o cambiar un medicamento (obstetra): atajos con los más recetados,
 * nombre y dosis por toma, veces al día con vista previa de las casillas que
 * verá la gestante, e indicación de cómo tomarlo. Funciona sin señal: la
 * receta se guarda en el teléfono y se envía sola al volver la conexión.
 * Adaptado con arquitectura responsiva Web (contenedor centrado en escritorio).
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Pill, Trash2, UserRound } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, warmBlue } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { confirmAction } from "@/lib/confirm";
import { MAX_TIMES_PER_DAY, timesLabel } from "@/lib/doses";
import { medIllustration } from "@/lib/medIllustration";
import { useApp, usePatient } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Stepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { Illustration } from "@/components/gestante/Illustration";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmBlue;

interface Preset {
  name: string;
  dose: string;
  schedule: string;
  times: number;
}

/** Los más recetados del control prenatal, para llenar el formulario en un toque. */
const PRESETS: Preset[] = [
  {
    name: "Sulfato ferroso 60 mg",
    dose: "1 tableta",
    schedule: "En ayunas, con agua o jugo de naranja",
    times: 1,
  },
  { name: "Ácido fólico 500 µg", dose: "1 tableta", schedule: "Con el almuerzo", times: 1 },
  {
    name: "Calcio 500 mg",
    dose: "1 tableta",
    schedule: "Con el almuerzo y la cena (separado del hierro)",
    times: 2,
  },
  {
    name: "Metildopa 250 mg",
    dose: "1 tableta",
    schedule: "Mañana y noche, para la presión",
    times: 2,
  },
  { name: "Paracetamol 500 mg", dose: "1 tableta", schedule: "Solo si hay dolor o fiebre", times: 3 },
];

const SCHEDULE_CHIPS = ["En ayunas", "Con el almuerzo", "Con la cena", "Mañana y noche"] as const;

export default function MedicamentoScreen(): React.ReactElement {
  const router = useRouter();
  const { patientId, supplementId } = useLocalSearchParams<{
    patientId?: string;
    supplementId?: string;
  }>();
  const { view, dispatch, online } = useApp();
  const patient = usePatient(patientId);
  const { show } = useToast();

  const editing = useMemo(
    () => (supplementId ? view?.supplements.find((s) => s.id === supplementId) ?? null : null),
    [view?.supplements, supplementId],
  );

  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [dose, setDose] = useState<string>("1 tableta");
  const [times, setTimes] = useState<number>(1);
  const [schedule, setSchedule] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Prellenar una sola vez cuando se edita un medicamento existente.
  useEffect(() => {
    if (!editing || editing.id === loadedId) return;
    setLoadedId(editing.id);
    setName(editing.name);
    setDose(editing.dose);
    setTimes(Math.max(1, Math.min(MAX_TIMES_PER_DAY, Math.round(editing.timesPerDay ?? 1))));
    setSchedule(editing.schedule);
  }, [editing, loadedId]);

  const previewText = useMemo(() => {
    if (times === 1) return "verá 1 casilla al día para marcar su toma";
    if (times === 2) return "verá 2 casillas al día: mañana y noche";
    if (times === 3) return "verá 3 casillas al día: mañana, tarde y noche";
    return `verá ${times} casillas al día, una por cada toma`;
  }, [times]);

  if (!patient || (supplementId != null && supplementId.length > 0 && !editing)) {
    return (
      <View style={styles.container}>
        <WebContainer size="form">
          <ScreenHeader title="Medicamento" showBack />
          <EmptyState
            icon={supplementId ? Pill : UserRound}
            title={supplementId ? "El medicamento ya no existe" : "Paciente no encontrada"}
          />
        </WebContainer>
      </View>
    );
  }

  const applyPreset = (preset: Preset) => {
    setName(preset.name);
    setDose(preset.dose);
    setSchedule(preset.schedule);
    setTimes(preset.times);
    setError(null);
  };

  const save = () => {
    const cleanName = name.trim();
    if (cleanName.length === 0) {
      setError("Escribe el nombre del medicamento.");
      return;
    }
    const duplicated = (view?.supplements ?? []).some(
      (s) =>
        s.patientId === patient.id &&
        s.id !== (editing?.id ?? "") &&
        s.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );
    if (duplicated) {
      setError("Ya le asignaste ese medicamento. Puedes cambiarlo tocándolo en su ficha.");
      return;
    }
    setError(null);
    const fields = {
      name: cleanName,
      dose: dose.trim() || "1 tableta",
      schedule: schedule.trim(),
      timesPerDay: times,
    };
    if (editing) {
      dispatch({ type: "update_supplement", supplementId: editing.id, fields });
    } else {
      dispatch({ type: "add_supplement", patientId: patient.id, fields });
    }
    show(
      online
        ? editing
          ? "Medicamento actualizado · su app ya lo muestra ✓"
          : `${cleanName} asignado · ${timesLabel(times)} ✓`
        : "Guardado en tu teléfono · se enviará al volver la señal",
      online ? "success" : "info",
    );
    router.back();
  };

  const removeMedication = async () => {
    if (!editing) return;
    const ok = await confirmAction({
      title: "Quitar medicamento",
      message: `${editing.name} dejará de aparecer en los medicamentos de ${patient.firstName}.`,
      confirmText: "Sí, quitar",
      destructive: true,
    });
    if (!ok) return;
    dispatch({ type: "remove_supplement", supplementId: editing.id });
    show(
      online ? "Medicamento quitado ✓" : "Guardado en tu teléfono · se enviará al volver la señal",
      online ? "success" : "info",
    );
    router.back();
  };

  return (
    <View style={styles.container}>
      <WebContainer size="form">
        <ScreenHeader
          title={editing ? "Cambiar medicamento" : "Asignar medicamento"}
          subtitle={`${patient.firstName} ${patient.lastName}`}
          showBack
        />
      </WebContainer>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WebContainer size="form">
          <View style={styles.formStack}>
            <View style={styles.heroNote}>
              <Illustration
                source={name.trim().length > 0 ? medIllustration(name) : ILU.pastillas}
                width={68}
                height={68}
              />
              <Text style={styles.heroText}>
                Aparecerá en el teléfono de {patient.firstName} con su dibujo y una casilla gigante
                por cada toma del día, para marcarla con un toque.
              </Text>
            </View>

            {editing ? null : (
              <>
                <SectionHeader title="Los más recetados" />
                <View style={styles.presetWrap}>
                  {PRESETS.map((preset) => {
                    const active = preset.name === name;
                    return (
                      <PressableScale
                        key={preset.name}
                        onPress={() => applyPreset(preset)}
                        accessibilityLabel={`Usar ${preset.name}`}
                        style={[styles.presetChip, active && styles.presetChipOn]}
                        testID={`preset-${preset.name}`}
                      >
                        <Illustration source={medIllustration(preset.name)} width={26} height={26} />
                        <Text style={[styles.presetText, active && styles.presetTextOn]}>
                          {preset.name}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </>
            )}

            <SectionHeader title="Medicamento" />
            <Card style={styles.formCard}>
              <Field
                label="Nombre del medicamento"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (error) setError(null);
                }}
                placeholder="Sulfato ferroso 60 mg…"
                accent={accent.main}
                testID="campo-med-nombre"
              />
              <Field
                label="Dosis por toma"
                value={dose}
                onChangeText={setDose}
                placeholder="1 tableta"
                hint="Ej.: 1 tableta, 5 ml, 1 cápsula"
                accent={accent.main}
                testID="campo-med-dosis"
              />
            </Card>

            <SectionHeader title="¿Cuántas veces al día?" />
            <Card style={styles.formCard}>
              <Stepper
                label="Tomas por día"
                value={times}
                onChange={setTimes}
                min={1}
                max={MAX_TIMES_PER_DAY}
                accent={accent.main}
                testID="stepper-veces"
              />
              <View style={styles.previewBox}>
                <View style={styles.previewDots}>
                  {Array.from({ length: times }, (_, i) => (
                    <View key={`dot-${i}`} style={styles.previewDot}>
                      <Check size={14} color={gwarm.tealDeep} strokeWidth={3} />
                    </View>
                  ))}
                </View>
                <Text style={styles.previewText}>
                  {patient.firstName} {previewText}.
                </Text>
              </View>
            </Card>

            <SectionHeader title="¿Cómo debe tomarlo?" />
            <Card style={styles.formCard}>
              <Field
                label="Indicación (opcional)"
                value={schedule}
                onChangeText={setSchedule}
                placeholder="En ayunas, con bastante agua…"
                hint="Puedes dejarla vacía: las casillas y recordatorios funcionan igual. Solo es una ayudita que se muestra junto al nombre."
                accent={accent.main}
                testID="campo-med-indicacion"
              />
              <View style={styles.chipRow}>
                {SCHEDULE_CHIPS.map((chip) => (
                  <PressableScale
                    key={chip}
                    onPress={() => setSchedule(chip)}
                    accessibilityLabel={`Indicación ${chip}`}
                    style={[styles.smallChip, schedule === chip && styles.smallChipOn]}
                  >
                    <Text
                      style={[styles.smallChipText, schedule === chip && styles.smallChipTextOn]}
                    >
                      {chip}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </Card>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              title={editing ? "Guardar cambios" : "Asignar medicamento"}
              onPress={save}
              color={accent.main}
              icon={Check}
              large
              testID="btn-guardar-medicamento"
            />
            {editing ? (
              <AppButton
                title="Quitar este medicamento"
                onPress={() => void removeMedication()}
                color={gwarm.rose}
                variant="outline"
                icon={Trash2}
                testID="btn-quitar-medicamento"
              />
            ) : null}
            <Text style={styles.footNote}>
              Si no hay señal, la receta queda guardada en el teléfono y se envía sola.
            </Text>
          </View>
        </WebContainer>
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
  },
  formStack: {
    gap: 12,
  },
  heroNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: warmBlue.soft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: warmBlue.mid,
    padding: 14,
    ...gShadow,
  },
  heroText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.ink,
    flex: 1,
  },
  presetWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  presetChipOn: {
    backgroundColor: accent.soft,
    borderColor: accent.main,
    borderWidth: 2,
  },
  presetText: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    color: gwarm.ink,
  },
  presetTextOn: { color: accent.deep },
  formCard: { gap: 12 },
  previewBox: {
    backgroundColor: gwarm.tealSoft,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  previewDots: {
    flexDirection: "row",
    gap: 6,
  },
  previewDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.tealMid,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    lineHeight: 20,
    color: gwarm.tealDeep,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  smallChip: {
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 38,
    justifyContent: "center",
  },
  smallChipOn: {
    backgroundColor: accent.soft,
    borderColor: accent.main,
  },
  smallChipText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 18,
    color: gwarm.inkSoft,
  },
  smallChipTextOn: { color: accent.deep },
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
  footNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
    textAlign: "center",
  },
});
