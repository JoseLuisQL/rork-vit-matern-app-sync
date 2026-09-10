/**
 * Crear usuario (administración, estilo "cuaderno"): formulario compacto en
 * bloques con rol segmentado. Para una gestante, el servidor crea también su
 * ficha clínica y genera automáticamente el cronograma de 8 controles MINSA.
 * Adaptado con arquitectura responsiva Web (contenedor centrado en escritorio).
 */
import { useRouter } from "expo-router";
import { UserPlus, WifiOff, Stethoscope } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { gfonts, gwarm, warmPlum } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { showNotice } from "@/lib/confirm";
import { useApp } from "@/providers/AppProvider";
import type { Role } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { DatePickerField } from "@/components/DatePickerField";
import { Field } from "@/components/Field";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Segmented } from "@/components/Segmented";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmPlum;

export default function NuevoUsuarioScreen(): React.ReactElement {
  const router = useRouter();
  const { view, createUser, online } = useApp();

  const obstetras = useMemo(() => {
    return (view?.users ?? []).filter((u) => u.role === "obstetra" && u.active);
  }, [view?.users]);

  const [role, setRole] = useState<Role>("gestante");
  const [dni, setDni] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("Test@1234");
  const [obstetraDni, setObstetraDni] = useState<string>("");

  const [fumKey, setFumKey] = useState<string>("");
  const [age, setAge] = useState<string>("25");
  const [community, setCommunity] = useState<string>("Talavera");
  const [hb, setHb] = useState<string>("13.0");
  const [bpSys, setBpSys] = useState<string>("110");
  const [bpDia, setBpDia] = useState<string>("70");
  const [weight, setWeight] = useState<string>("58.0");
  const [height, setHeight] = useState<string>("1.55");
  const [imc, setImc] = useState<string>("24.1");
  const [gestas, setGestas] = useState<string>("1");

  const updateComputedImc = useCallback((wStr: string, hStr: string) => {
    const w = parseFloat(wStr.replace(",", "."));
    let h = parseFloat(hStr.replace(",", "."));
    if (w > 0 && h > 0) {
      if (h > 3) h = h / 100; // Si el usuario ingresa en cm (ej: 155)
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
    const val = parseFloat(imc);
    if (!val || isNaN(val) || val <= 0) return null;
    if (val < 18.5) return { label: "Bajo peso", color: gwarm.amber };
    if (val < 25) return { label: "Normal", color: gwarm.tealDeep };
    if (val < 30) return { label: "Sobrepeso", color: gwarm.amber };
    return { label: "Obesidad", color: gwarm.rose };
  }, [imc]);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    if (role === "gestante" && !/^\d{4}-\d{2}-\d{2}$/.test(fumKey)) {
      setError("La FUM debe tener el formato AAAA-MM-DD, por ejemplo 2026-05-10.");
      return;
    }
    setSubmitting(true);
    try {
      await createUser({
        dni,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        phone: phone.trim() || undefined,
        obstetraDni: role === "gestante" && obstetraDni ? obstetraDni : undefined,
        patient:
          role === "gestante"
            ? {
                fumKey,
                age: parseInt(age, 10) || 25,
                community: community.trim() || "Talavera",
                hbObserved: parseFloat(hb) || 13,
                bpSys: parseInt(bpSys, 10) || 110,
                bpDia: parseInt(bpDia, 10) || 70,
                imc: parseFloat(imc) || 24,
                gestas: parseInt(gestas, 10) || 1,
              }
            : undefined,
      });
      showNotice(
        "Usuario creado",
        role === "gestante"
          ? `${firstName.trim()} ya puede iniciar sesión. El servidor generó su cronograma de controles MINSA.`
          : `${firstName.trim()} ya puede iniciar sesión.`,
      );
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        setError("Necesitas conexión para crear usuarios.");
      } else {
        setError(e instanceof Error ? e.message : "No se pudo crear el usuario.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    dni,
    firstName,
    lastName,
    password,
    role,
    phone,
    obstetraDni,
    fumKey,
    age,
    community,
    hb,
    bpSys,
    bpDia,
    imc,
    gestas,
    createUser,
    router,
  ]);

  return (
    <View style={styles.container}>
      <WebContainer size="form">
        <ScreenHeader
          title="Nuevo usuario"
          subtitle="La cuenta queda activa al instante"
          showBack
          fallbackHref="/(admin)/(tabs)/usuarios"
        />
      </WebContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                    Sin conexión: crear usuarios necesita al servidor.
                  </Text>
                </View>
              ) : null}

              <SectionHeader title="Rol" />
              <Segmented
                options={[
                  { key: "gestante", label: "Gestante" },
                  { key: "obstetra", label: "Obstetra" },
                  { key: "admin", label: "Admin" },
                ]}
                value={role}
                onChange={(k) => setRole(k as Role)}
              />

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
                  testID="nuevo-dni"
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

              {role === "gestante" ? (
                <>
                  <SectionHeader title="Obstetra responsable" />
                  <Card style={styles.formCard}>
                    <Text style={styles.hintText}>
                      Asigna la obstetra que realizará el seguimiento de controles y citas prenatales.
                    </Text>
                    {obstetras.length === 0 ? (
                      <Text style={styles.emptyHint}>No hay obstetras activos registrados.</Text>
                    ) : (
                      <View style={styles.obstetraList}>
                        <PressableScale
                          onPress={() => setObstetraDni("")}
                          style={[
                            styles.obstetraChip,
                            obstetraDni === "" && styles.obstetraChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.obstetraChipText,
                              obstetraDni === "" && styles.obstetraChipTextActive,
                            ]}
                          >
                            Sin asignar
                          </Text>
                        </PressableScale>
                        {obstetras.map((o) => {
                          const active = obstetraDni === o.dni;
                          return (
                            <PressableScale
                              key={o.dni}
                              onPress={() => setObstetraDni(o.dni)}
                              style={[
                                styles.obstetraChip,
                                active && styles.obstetraChipActive,
                              ]}
                            >
                              <Stethoscope size={15} color={active ? "#FFFFFF" : accent.main} />
                              <Text
                                style={[
                                  styles.obstetraChipText,
                                  active && styles.obstetraChipTextActive,
                                ]}
                              >
                                {o.firstName} {o.lastName}
                              </Text>
                            </PressableScale>
                          );
                        })}
                      </View>
                    )}
                  </Card>

                  <SectionHeader title="Ficha clínica inicial" />
                  <Card style={styles.formCard}>
                    <DatePickerField
                      label="Última menstruación (FUM)"
                      value={fumKey}
                      onChangeDate={setFumKey}
                      placeholder="Seleccionar FUM en el calendario"
                      accent={accent.main}
                      isFum={true}
                      hint="Con la FUM se calculan la edad gestacional, la FPP y los 8 controles."
                      testID="nuevo-fum"
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
                        label="Comunidad"
                        value={community}
                        onChangeText={setCommunity}
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
                        placeholder="Ej. 58"
                        keyboardType="decimal-pad"
                        accent={accent.main}
                        style={styles.flex}
                      />
                      <Field
                        label="Talla (m o cm)"
                        value={height}
                        onChangeText={handleHeightChange}
                        placeholder="Ej. 1.55 o 155"
                        keyboardType="decimal-pad"
                        accent={accent.main}
                        style={styles.flex}
                      />
                    </View>
                    <View style={styles.row2}>
                      <Field
                        label="IMC (peso / talla²)"
                        value={imc}
                        onChangeText={setImc}
                        keyboardType="decimal-pad"
                        accent={accent.main}
                        style={styles.flex}
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
                          Estado nutricional:{" "}
                          <Text style={{ color: imcInfo.color, fontFamily: gfonts.hand }}>
                            {imcInfo.label}
                          </Text>{" "}
                          ({imc} kg/m²)
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
                    <Field
                      label="Número de gestas"
                      value={gestas}
                      onChangeText={setGestas}
                      keyboardType="number-pad"
                      accent={accent.main}
                    />
                  </Card>
                </>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <AppButton
                title="Crear usuario"
                onPress={() => void submit()}
                color={accent.main}
                icon={UserPlus}
                loading={submitting}
                disabled={!online || submitting}
                testID="btn-crear-usuario"
              />
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
  hintText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.inkSoft,
  },
  emptyHint: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.inkFaint,
    fontStyle: "italic",
  },
  obstetraList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  obstetraChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surface,
  },
  obstetraChipActive: {
    backgroundColor: accent.main,
    borderColor: accent.main,
  },
  obstetraChipText: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    color: gwarm.ink,
  },
  obstetraChipTextActive: {
    color: "#FFFFFF",
  },
  row2: { flexDirection: "row", gap: 12 },
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
});
