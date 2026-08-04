/**
 * Actualizar la ficha clínica (obstetra): lo que se mide en el control —
 * hemoglobina, presión, IMC — más FUM, historia obstétrica y contacto.
 * Funciona sin señal: el cambio se guarda en el teléfono, se ve al instante
 * y se envía solo cuando vuelve la conexión. El servidor recalcula semana,
 * anemia y semáforo de riesgo.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Sparkles, UserRound } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, warmBlue } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { dateFromKey, fechaCompleta } from "@/lib/format";
import { fppKeyLocal, weeksLocal } from "@/lib/optimistic";
import { useApp, usePatient } from "@/providers/AppProvider";
import type { PatientUpdateFields } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Stepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { Illustration } from "@/components/gestante/Illustration";

const accent = warmBlue;

function parseNum(value: string): number | null {
  const n = parseFloat(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const pad2 = (n: number): string => `${n}`.padStart(2, "0");

export default function ActualizarDatosScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { todayKey, dispatch, online } = useApp();
  const patient = usePatient(id);
  const { show } = useToast();

  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [hb, setHb] = useState<string>("");
  const [sys, setSys] = useState<string>("");
  const [dia, setDia] = useState<string>("");
  const [imc, setImc] = useState<string>("");
  const [fumD, setFumD] = useState<string>("");
  const [fumM, setFumM] = useState<string>("");
  const [fumY, setFumY] = useState<string>("");
  const [gestas, setGestas] = useState<number>(1);
  const [cesareas, setCesareas] = useState<number>(0);
  const [abortos, setAbortos] = useState<number>(0);
  const [edad, setEdad] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [community, setCommunity] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Prellenar el formulario una sola vez por paciente.
  useEffect(() => {
    if (!patient || patient.id === loadedId) return;
    setLoadedId(patient.id);
    setHb(`${patient.hbObserved}`);
    setSys(`${patient.bpSys}`);
    setDia(`${patient.bpDia}`);
    setImc(`${patient.imc}`);
    const fum = dateFromKey(patient.fumKey);
    setFumD(`${fum.getDate()}`);
    setFumM(`${fum.getMonth() + 1}`);
    setFumY(`${fum.getFullYear()}`);
    setGestas(patient.gestas);
    setCesareas(patient.cesareas);
    setAbortos(patient.abortos);
    setEdad(`${patient.age}`);
    setPhone(patient.phone);
    setCommunity(patient.community);
  }, [patient, loadedId]);

  /** Clave YYYY-MM-DD solo si día/mes/año forman una fecha real. */
  const fumKey = useMemo(() => {
    const d = parseInt(fumD, 10);
    const m = parseInt(fumM, 10);
    const y = parseInt(fumY, 10);
    if (!d || !m || !y || `${y}`.length !== 4) return null;
    const key = `${y}-${pad2(m)}-${pad2(d)}`;
    const dt = dateFromKey(key);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return key;
  }, [fumD, fumM, fumY]);

  const preview = useMemo(() => {
    if (!fumKey || fumKey > todayKey) return null;
    return { weeks: weeksLocal(fumKey, todayKey), fpp: fppKeyLocal(fumKey) };
  }, [fumKey, todayKey]);

  if (!patient) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Actualizar datos" showBack />
        <EmptyState icon={UserRound} title="Paciente no encontrada" />
      </View>
    );
  }

  const save = () => {
    const hbN = parseNum(hb);
    if (hbN === null || hbN < 4 || hbN > 20) {
      setError("Hemoglobina: escribe un valor entre 4 y 20 g/dL.");
      return;
    }
    const sysN = parseNum(sys);
    if (sysN === null || sysN < 70 || sysN > 240) {
      setError("Presión alta (sistólica): escribe un valor entre 70 y 240.");
      return;
    }
    const diaN = parseNum(dia);
    if (diaN === null || diaN < 40 || diaN > 140) {
      setError("Presión baja (diastólica): escribe un valor entre 40 y 140.");
      return;
    }
    const imcN = parseNum(imc);
    if (imcN === null || imcN < 12 || imcN > 60) {
      setError("IMC: escribe un valor entre 12 y 60.");
      return;
    }
    const edadN = parseNum(edad);
    if (edadN === null || edadN < 12 || edadN > 60) {
      setError("Edad: escribe un valor entre 12 y 60 años.");
      return;
    }
    if (!fumKey) {
      setError("La fecha de última menstruación no es una fecha real. Revísala.");
      return;
    }
    if (fumKey > todayKey) {
      setError("La FUM no puede ser una fecha futura.");
      return;
    }
    if (community.trim().length === 0) {
      setError("Escribe la comunidad de la gestante.");
      return;
    }
    setError(null);
    const fields: PatientUpdateFields = {
      hbObserved: hbN,
      bpSys: sysN,
      bpDia: diaN,
      imc: imcN,
      age: edadN,
      fumKey,
      gestas,
      cesareas,
      abortos,
      community: community.trim(),
      phone: phone.trim(),
    };
    dispatch({ type: "update_patient", patientId: patient.id, fields });
    show(
      online
        ? "Ficha actualizada · los cálculos se refrescan solos ✓"
        : "Guardado en tu teléfono · se enviará al volver la señal",
      online ? "success" : "info",
    );
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Actualizar datos"
        subtitle={`${patient.firstName} ${patient.lastName}`}
        showBack
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroNote}>
          <Illustration source={ILU.carnet} width={68} height={68} />
          <Text style={styles.heroText}>
            Registra lo que midas en el control. La semana, la anemia y el semáforo de riesgo
            se recalculan solos.
          </Text>
        </View>

        <SectionHeader title="Análisis y medidas" />
        <Card style={styles.formCard}>
          <View style={styles.row2}>
            <Field
              label="Hemoglobina"
              value={hb}
              onChangeText={setHb}
              keyboardType="decimal-pad"
              hint="g/dL medida en laboratorio"
              accent={accent.main}
              style={styles.flex}
              testID="campo-hb"
            />
            <Field
              label="IMC"
              value={imc}
              onChangeText={setImc}
              keyboardType="decimal-pad"
              hint="Peso / talla²"
              accent={accent.main}
              style={styles.flex}
              testID="campo-imc"
            />
          </View>
          <View style={styles.row2}>
            <Field
              label="Presión alta"
              value={sys}
              onChangeText={setSys}
              keyboardType="number-pad"
              hint="Sistólica"
              accent={accent.main}
              style={styles.flex}
              testID="campo-sys"
            />
            <Field
              label="Presión baja"
              value={dia}
              onChangeText={setDia}
              keyboardType="number-pad"
              hint="Diastólica"
              accent={accent.main}
              style={styles.flex}
              testID="campo-dia"
            />
          </View>
        </Card>

        <SectionHeader title="Embarazo" />
        <Card style={styles.formCard}>
          <Text style={styles.groupLabel}>Fecha de última menstruación (FUM)</Text>
          <View style={styles.row3}>
            <Field
              label="Día"
              value={fumD}
              onChangeText={setFumD}
              keyboardType="number-pad"
              maxLength={2}
              accent={accent.main}
              style={styles.flex}
              testID="campo-fum-dia"
            />
            <Field
              label="Mes"
              value={fumM}
              onChangeText={setFumM}
              keyboardType="number-pad"
              maxLength={2}
              accent={accent.main}
              style={styles.flex}
            />
            <Field
              label="Año"
              value={fumY}
              onChangeText={setFumY}
              keyboardType="number-pad"
              maxLength={4}
              accent={accent.main}
              style={styles.flex}
            />
          </View>
          {preview ? (
            <View style={styles.previewBox}>
              <Sparkles size={15} color={gwarm.tealDeep} />
              <Text style={styles.previewText}>
                Semana {preview.weeks} · nacería el {fechaCompleta(preview.fpp)}
              </Text>
            </View>
          ) : (
            <Text style={styles.previewHint}>
              Con esta fecha se calculan la semana de embarazo y la fecha probable de parto.
            </Text>
          )}
        </Card>

        <SectionHeader title="Su historia" />
        <Card style={styles.formCard}>
          <View style={styles.row3}>
            <Stepper
              label="Gestas"
              value={gestas}
              onChange={setGestas}
              min={1}
              max={20}
              accent={accent.main}
              style={styles.flex}
              testID="stepper-gestas"
            />
            <Stepper
              label="Cesáreas"
              value={cesareas}
              onChange={setCesareas}
              min={0}
              max={10}
              accent={accent.main}
              style={styles.flex}
            />
            <Stepper
              label="Abortos"
              value={abortos}
              onChange={setAbortos}
              min={0}
              max={10}
              accent={accent.main}
              style={styles.flex}
            />
          </View>
        </Card>

        <SectionHeader title="Contacto" />
        <Card style={styles.formCard}>
          <View style={styles.row2}>
            <Field
              label="Edad"
              value={edad}
              onChangeText={setEdad}
              keyboardType="number-pad"
              hint="Años"
              maxLength={2}
              accent={accent.main}
              style={styles.flex}
            />
            <Field
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="987 654 321"
              accent={accent.main}
              style={styles.flex}
            />
          </View>
          <Field
            label="Comunidad"
            value={community}
            onChangeText={setCommunity}
            placeholder="San Juan, Talavera…"
            accent={accent.main}
          />
        </Card>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppButton
          title="Guardar cambios"
          onPress={save}
          color={accent.main}
          icon={Check}
          large
          testID="btn-guardar-datos"
        />
        <Text style={styles.footNote}>
          Si no hay señal, el cambio queda guardado en el teléfono y se envía solo.
        </Text>
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
  formCard: { gap: 12 },
  row2: { flexDirection: "row", gap: 10 },
  row3: { flexDirection: "row", gap: 8 },
  groupLabel: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: gwarm.tealSoft,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  previewText: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    lineHeight: 20,
    color: gwarm.tealDeep,
    flex: 1,
  },
  previewHint: {
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
  footNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
    textAlign: "center",
  },
});
