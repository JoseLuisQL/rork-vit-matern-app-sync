/**
 * Registro de gestante (obstetra): crea la cuenta y la ficha clínica en un
 * formulario compacto de dos bloques. El servidor valida el DNI, genera el
 * cronograma de 8 controles MINSA y asigna los suplementos automáticamente.
 */
import { useRouter } from "expo-router";
import { UserRoundPlus, WifiOff } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { common, obstetraTheme, radius, semantic, spacing, type } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { showNotice } from "@/lib/confirm";
import { useApp } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";

const accent = obstetraTheme;

export default function NuevaGestanteScreen(): React.ReactElement {
  const router = useRouter();
  const { createUser, online } = useApp();

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
  const [imc, setImc] = useState<string>("24.0");
  const [gestas, setGestas] = useState<string>("1");

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fumKey)) {
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
        role: "gestante",
        phone: phone.trim() || undefined,
        patient: {
          fumKey,
          age: parseInt(age, 10) || 25,
          community: community.trim() || "Talavera",
          hbObserved: parseFloat(hb) || 13,
          bpSys: parseInt(bpSys, 10) || 110,
          bpDia: parseInt(bpDia, 10) || 70,
          imc: parseFloat(imc) || 24,
          gestas: parseInt(gestas, 10) || 1,
        },
      });
      showNotice(
        "Gestante registrada",
        `${firstName.trim()} ya puede iniciar sesión con su DNI. Su cronograma de 8 controles se generó automáticamente.`,
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
  }, [dni, firstName, lastName, password, phone, fumKey, age, community, hb, bpSys, bpDia, imc, gestas, createUser, router]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Nueva gestante" subtitle="Cuenta + ficha clínica" showBack />
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
          {!online ? (
            <View style={styles.offlineBox}>
              <WifiOff size={15} color={semantic.warning} />
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
              accent={accent.primary}
              testID="ng-dni"
            />
            <View style={styles.row2}>
              <Field
                label="Nombres"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombres"
                autoCapitalize="words"
                accent={accent.primary}
                style={styles.flex}
                testID="ng-nombres"
              />
              <Field
                label="Apellidos"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellidos"
                autoCapitalize="words"
                accent={accent.primary}
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
                accent={accent.primary}
                style={styles.flex}
              />
              <Field
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                autoCapitalize="none"
                accent={accent.primary}
                style={styles.flex}
              />
            </View>
          </Card>

          <SectionHeader title="Ficha clínica" />
          <Card style={styles.formCard}>
            <Field
              label="Última menstruación (FUM)"
              value={fumKey}
              onChangeText={setFumKey}
              placeholder="AAAA-MM-DD"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              accent={accent.primary}
              hint="Con la FUM se calculan la edad gestacional, la FPP y los 8 controles."
              testID="ng-fum"
            />
            <View style={styles.row2}>
              <Field
                label="Edad"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                accent={accent.primary}
                style={styles.flex}
              />
              <Field
                label="Comunidad"
                value={community}
                onChangeText={setCommunity}
                autoCapitalize="words"
                accent={accent.primary}
                style={styles.flex}
              />
            </View>
            <View style={styles.row2}>
              <Field
                label="Hb observada (g/dL)"
                value={hb}
                onChangeText={setHb}
                keyboardType="decimal-pad"
                accent={accent.primary}
                style={styles.flex}
              />
              <Field
                label="IMC"
                value={imc}
                onChangeText={setImc}
                keyboardType="decimal-pad"
                accent={accent.primary}
                style={styles.flex}
              />
            </View>
            <View style={styles.row2}>
              <Field
                label="Presión sistólica"
                value={bpSys}
                onChangeText={setBpSys}
                keyboardType="number-pad"
                accent={accent.primary}
                style={styles.flex}
              />
              <Field
                label="Presión diastólica"
                value={bpDia}
                onChangeText={setBpDia}
                keyboardType="number-pad"
                accent={accent.primary}
                style={styles.flex}
              />
            </View>
            <Field
              label="Número de gestas"
              value={gestas}
              onChangeText={setGestas}
              keyboardType="number-pad"
              accent={accent.primary}
            />
          </Card>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <AppButton
            title="Registrar gestante"
            onPress={() => void submit()}
            color={accent.primary}
            icon={UserRoundPlus}
            loading={submitting}
            disabled={!online || submitting}
            testID="btn-registrar-gestante"
          />
          <Text style={styles.footNote}>
            La cuenta queda activa al instante y aparece en tu lista de gestantes.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: common.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: common.border,
    borderLeftWidth: 3,
    borderLeftColor: semantic.warning,
    padding: spacing.sm2,
  },
  offlineText: { ...type.bodySm, color: common.textSecondary, flex: 1 },
  formCard: { gap: spacing.sm2 },
  row2: { flexDirection: "row", gap: spacing.sm2 },
  errorBox: {
    backgroundColor: common.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: common.border,
    borderLeftWidth: 3,
    borderLeftColor: semantic.danger,
    padding: spacing.sm2,
  },
  errorText: { ...type.bodySm, color: semantic.danger },
  footNote: {
    ...type.caption,
    color: common.textTertiary,
    textAlign: "center",
  },
});
