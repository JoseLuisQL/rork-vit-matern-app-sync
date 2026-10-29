/**
 * Registro de gestante (obstetra, estilo "cuaderno"): crea la cuenta y la
 * ficha clínica en un formulario compacto de dos bloques. El servidor valida
 * el DNI, genera el cronograma de 8 controles MINSA y asigna los suplementos.
 * Adaptado con arquitectura responsiva Web (contenedor centrado en escritorio).
 */
import { useRouter } from "expo-router";
import { UserRoundPlus, WifiOff } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { gfonts, gwarm, warmBlue } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { showNotice } from "@/lib/confirm";
import { useApp } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { DatePickerField } from "@/components/DatePickerField";
import { Field } from "@/components/Field";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Stepper } from "@/components/Stepper";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmBlue;

export default function NuevaGestanteScreen(): React.ReactElement {
  const router = useRouter();
  const { createUser, online, user } = useApp();

  const [dni, setDni] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("Test@1234");

  const [fumKey, setFumKey] = useState<string>("");
  const [age, setAge] = useState<string>("25");
  const [community, setCommunity] = useState<string>("Talavera");
  const [hb, setHb] = useState<string>("13.0");
  const [bpSys, setBpSys] = useState<string>("110");
  const [bpDia, setBpDia] = useState<string>("70");
  const [weight, setWeight] = useState<string>("58.0");
  const [height, setHeight] = useState<string>("1.55");
  const [imc, setImc] = useState<string>("24.1");
  const [gestas, setGestas] = useState<number>(1);
  const [cesareas, setCesareas] = useState<number>(0);
  const [abortos, setAbortos] = useState<number>(0);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateComputedImc = useCallback((wStr: string, hStr: string) => {
    const w = parseFloat(wStr.replace(",", "."));
    let h = parseFloat(hStr.replace(",", "."));
    if (w > 0 && h > 0) {
      if (h > 3) h = h / 100;
      const calculated = (w / (h * h)).toFixed(1);
      setImc(calculated);
    }
  }, []);

  const handleWeightChange = useCallback(
    (val: string) => {
      setWeight(val);
      updateComputedImc(val, height);
    },
    [height, updateComputedImc],
  );

  const handleHeightChange = useCallback(
    (val: string) => {
      setHeight(val);
      updateComputedImc(weight, val);
    },
    [weight, updateComputedImc],
  );

  const imcInfo = useMemo(() => {
    const val = parseFloat(imc.replace(",", "."));
    if (!val || isNaN(val) || val <= 0) return null;
    if (val < 18.5) return { label: "Bajo peso", color: gwarm.amber };
    if (val < 25) return { label: "Peso normal", color: gwarm.tealDeep };
    if (val < 30) return { label: "Sobrepeso", color: gwarm.amber };
    return { label: "Obesidad", color: gwarm.rose };
  }, [imc]);

  const submit = useCallback(async () => {
    setError(null);
    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }
    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      setError("Nombres y apellidos son obligatorios.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fumKey)) {
      setError("La FUM debe tener el formato AAAA-MM-DD, por ejemplo 2026-05-10.");
      return;
    }
    const parsedWeight = parseFloat(weight.replace(",", "."));
    let parsedHeight = parseFloat(height.replace(",", "."));
    if (parsedHeight > 3) parsedHeight = parsedHeight / 100;

    setSubmitting(true);
    try {
      await createUser({
        dni,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "gestante",
        phone: phone.trim() || undefined,
        obstetraDni: user?.dni,
        patient: {
          obstetraDni: user?.dni,
          fumKey,
          age: parseInt(age, 10) || 25,
          community: community.trim() || "Talavera",
          hbObserved: parseFloat(hb.replace(",", ".")) || 13,
          bpSys: parseInt(bpSys, 10) || 110,
          bpDia: parseInt(bpDia, 10) || 70,
          weight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined,
          height: Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : undefined,
          imc: parseFloat(imc.replace(",", ".")) || 24,
          gestas,
          cesareas,
          abortos,
        },
      });
      showNotice(
        "Gestante registrada",
        `${firstName.trim()} ya puede iniciar sesión con su DNI. Sus controles y citas prenatales se programan manualmente desde su ficha.`,
      );
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        setError("Necesitas conexión para registrar gestantes.");
      } else {
        setError(e instanceof Error ? e.message : "No se pudo registrar a la gestante.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    dni,
    firstName,
    lastName,
    password,
    phone,
    fumKey,
    age,
    community,
    hb,
    bpSys,
    bpDia,
    weight,
    height,
    imc,
    gestas,
    cesareas,
    abortos,
    createUser,
    router,
    user?.dni,
  ]);

  return (
    <View style={styles.container}>
      <WebContainer size="form">
        <ScreenHeader
          title="Nueva gestante"
          subtitle="Cuenta + ficha clínica"
          showBack
          fallbackHref="/(obstetra)/(tabs)/gestantes"
        />
      </WebContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <WebContainer size="form">
            <View style={styles.formStack}>
              {!online ? (
                <View style={styles.offlineBox}>
                  <WifiOff size={15} color={gwarm.amber} />
                  <Text style={styles.offlineText}>
                    Sin conexión: el registro necesita al servidor.
                  </Text>
                </View>
              ) : null}

              <SectionHeader title="Datos de la cuenta" />
              <Card style={styles.formCard}>
                <Field
                  label="DNI"
                  value={dni}
                  onChangeText={(t) => setDni(t.replace(/[^0-9]/g, ""))}
                  placeholder="8 dígitos"
                  keyboardType="number-pad"
                  maxLength={8}
                  accent={accent.main}
                  testID="ng-dni"
                />
                <View style={styles.row2}>
                  <Field
                    label="Nombres"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Nombres"
                    autoCapitalize="words"
                    accent={accent.main}
                    style={styles.flex}
                    testID="ng-nombres"
                  />
                  <Field
                    label="Apellidos"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Apellidos"
                    autoCapitalize="words"
                    accent={accent.main}
                    style={styles.flex}
                  />
                </View>
                <View style={styles.row2}>
                  <Field
                    label="Teléfono (opcional)"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="9xx xxx xxx"
                    keyboardType="phone-pad"
                    accent={accent.main}
                    style={styles.flex}
                  />
                  <Field
                    label="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 6 caracteres"
                    autoCapitalize="none"
                    accent={accent.main}
                    style={styles.flex}
                  />
                </View>
              </Card>

              <SectionHeader title="Ficha clínica" />
              <Card style={styles.formCard}>
                <DatePickerField
                  label="Última menstruación (FUM)"
                  value={fumKey}
                  onChangeDate={setFumKey}
                  placeholder="Seleccionar FUM en el calendario"
                  accent={accent.main}
                  isFum={true}
                  hint="Con la FUM se calculan automáticamente la edad gestacional y la fecha probable de parto (FPP)."
                  testID="ng-fum"
                />
                <View style={styles.row2}>
                  <Field
                    label="Edad"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    accent={accent.main}
                    style={styles.flex}
                  />
                  <Field
                    label="Dirección"
                    value={community}
                    onChangeText={setCommunity}
                    placeholder="Ej. Jr. Apurímac, Talavera"
                    autoCapitalize="words"
                    accent={accent.main}
                    style={styles.flex}
                  />
                </View>
                <View style={styles.row2}>
                  <Field
                    label="Peso (kg)"
                    value={weight}
                    onChangeText={handleWeightChange}
                    placeholder="Ej. 58.0"
                    keyboardType="decimal-pad"
                    hint="Se usa para calcular IMC"
                    accent={accent.main}
                    style={styles.flex}
                    testID="ng-peso"
                  />
                  <Field
                    label="Talla (m o cm)"
                    value={height}
                    onChangeText={handleHeightChange}
                    placeholder="Ej. 1.55 o 155"
                    keyboardType="decimal-pad"
                    hint="En metros o cm"
                    accent={accent.main}
                    style={styles.flex}
                    testID="ng-talla"
                  />
                </View>
                <View style={styles.row2}>
                  <Field
                    label="IMC automático (peso / talla²)"
                    value={imc}
                    onChangeText={setImc}
                    keyboardType="decimal-pad"
                    accent={accent.main}
                    style={styles.flex}
                    testID="ng-imc"
                  />
                  <Field
                    label="Hb observada (g/dL)"
                    value={hb}
                    onChangeText={setHb}
                    keyboardType="decimal-pad"
                    accent={accent.main}
                    style={styles.flex}
                  />
                </View>
                {imcInfo ? (
                  <View style={styles.imcBox}>
                    <Text style={styles.imcText}>
                      IMC calculado automáticamente:{" "}
                      <Text style={{ color: imcInfo.color, fontFamily: gfonts.hand }}>
                        {imc} kg/m² ({imcInfo.label})
                      </Text>
                    </Text>
                  </View>
                ) : null}
                <View style={styles.row2}>
                  <Field
                    label="Presión sistólica"
                    value={bpSys}
                    onChangeText={setBpSys}
                    keyboardType="number-pad"
                    accent={accent.main}
                    style={styles.flex}
                  />
                  <Field
                    label="Presión diastólica"
                    value={bpDia}
                    onChangeText={setBpDia}
                    keyboardType="number-pad"
                    accent={accent.main}
                    style={styles.flex}
                  />
                </View>
              </Card>

              <SectionHeader title="Su historia" />
              <Card style={[styles.formCard, styles.historyCard]}>
                <View style={styles.historySummaryRow}>
                  <Text style={styles.historySummaryText}>
                    Gestaciones: <Text style={styles.historyNum}>{gestas}</Text> · Cesáreas:{" "}
                    <Text style={styles.historyNum}>{cesareas}</Text> · Abortos:{" "}
                    <Text style={styles.historyNum}>{abortos}</Text>
                  </Text>
                </View>
                <View style={styles.row3}>
                  <Stepper
                    label="Gestaciones"
                    value={gestas}
                    onChange={setGestas}
                    min={1}
                    max={20}
                    accent={accent.main}
                    style={styles.flex}
                    compact
                  />
                  <Stepper
                    label="Cesáreas"
                    value={cesareas}
                    onChange={setCesareas}
                    min={0}
                    max={10}
                    accent={accent.main}
                    style={styles.flex}
                    compact
                  />
                  <Stepper
                    label="Abortos"
                    value={abortos}
                    onChange={setAbortos}
                    min={0}
                    max={10}
                    accent={accent.main}
                    style={styles.flex}
                    compact
                  />
                </View>
              </Card>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <AppButton
                title="Registrar gestante"
                onPress={() => void submit()}
                color={accent.main}
                icon={UserRoundPlus}
                loading={submitting}
                disabled={!online || submitting}
                testID="btn-registrar-gestante"
              />
              <Text style={styles.footNote}>
                La cuenta queda activa al instante y asignada a tu cargo ({user?.firstName ?? "Obstetra"}).
              </Text>
            </View>
          </WebContainer>
        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.amber,
    flex: 1,
  },
  formCard: { gap: 12 },
  historyCard: {
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  historySummaryRow: {
    backgroundColor: gwarm.surfaceSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  historySummaryText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.inkSoft,
  },
  historyNum: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    color: accent.main,
  },
  row2: { flexDirection: "row", gap: 12 },
  row3: { flexDirection: "row", gap: 6 },
  imcBox: {
    backgroundColor: gwarm.surfaceSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  imcText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.ink,
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
    fontSize: 14,
    lineHeight: 19,
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
