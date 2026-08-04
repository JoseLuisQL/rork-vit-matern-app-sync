/**
 * Pedir ayuda: signos de alarma con casillas grandes y botón SOS gigante
 * siempre visible abajo. El reporte y el SOS incluyen ubicación GPS si está
 * disponible y funcionan sin señal (quedan en cola y se envían solos).
 */
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Check, CheckCircle2, CloudUpload, Siren } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALARM_SIGNS } from "@/constants/content";
import { common, radius, semantic, spacing, type } from "@/constants/theme";
import { confirmAction } from "@/lib/confirm";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Field } from "@/components/Field";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";

type SentKind = "alarma" | "sos" | null;

async function getCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (Platform.OS === "web") {
      return await new Promise((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 },
        );
      });
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    const current = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
    return current ? { lat: current.coords.latitude, lng: current.coords.longitude } : null;
  } catch (e) {
    console.log("[VitMaterna] GPS no disponible:", e);
    return null;
  }
}

export default function AlarmasScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch, online } = useApp();
  const patient = useMyPatient();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<SentKind>(null);

  const selectedLabels = useMemo(
    () => ALARM_SIGNS.filter((s) => selected.includes(s.id)).map((s) => s.label),
    [selected],
  );

  const toggleSign = useCallback((signId: string) => {
    setSelected((prev) =>
      prev.includes(signId) ? prev.filter((s) => s !== signId) : [...prev, signId],
    );
  }, []);

  const sendReport = useCallback(async () => {
    if (selectedLabels.length === 0 || sending) return;
    setSending(true);
    const coords = await getCoords();
    dispatch({
      type: "report_alarm",
      signs: selectedLabels,
      note: note.trim() || undefined,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });
    setSending(false);
    setSent("alarma");
  }, [selectedLabels, note, dispatch, sending]);

  const sendSOS = useCallback(async () => {
    if (sending) return;
    const ok = await confirmAction({
      title: "Botón de emergencia",
      message: "Tu obstetra recibirá una alerta URGENTE con tu ubicación.",
      confirmText: "Enviar SOS",
      destructive: true,
    });
    if (!ok) return;
    setSending(true);
    const coords = await getCoords();
    dispatch({ type: "panic", lat: coords?.lat ?? null, lng: coords?.lng ?? null });
    setSending(false);
    setSent("sos");
  }, [dispatch, sending]);

  if (sent) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={sent === "sos" ? "SOS enviado" : "Aviso enviado"} showBack />
        <View style={styles.successWrap}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: online ? semantic.successLight : semantic.warningLight },
            ]}
          >
            {online ? (
              <CheckCircle2 size={48} color={semantic.success} />
            ) : (
              <CloudUpload size={48} color={semantic.warning} />
            )}
          </View>
          <Text style={styles.successTitle}>
            {online ? "Tu obstetra ya fue avisada" : "Guardado en tu teléfono"}
          </Text>
          <Text style={styles.successText}>
            {online
              ? "Mantén la calma. Si puedes movilizarte, acude al centro de salud mientras te contactan."
              : "No hay señal ahora. Tu aviso se enviará solo apenas vuelva la conexión. Si puedes, acude al centro de salud o pide apoyo a tu promotor de salud."}
          </Text>
          <AppButton
            title="Volver al inicio"
            onPress={() => router.back()}
            color={semantic.info}
            large
            style={styles.successButton}
          />
        </View>
      </View>
    );
  }

  if (!patient) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Pedir ayuda" showBack />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.question}>¿Qué sientes?</Text>
        <Text style={styles.hint}>Marca todo lo que te pasa.</Text>
        <View style={styles.signsCard}>
          {ALARM_SIGNS.map((sign, index) => {
            const active = selected.includes(sign.id);
            return (
              <PressableScale
                key={sign.id}
                onPress={() => toggleSign(sign.id)}
                accessibilityLabel={sign.label}
                style={[styles.signRow, index > 0 && styles.signRowBorder]}
                testID={`sign-${sign.id}`}
              >
                <View
                  style={[
                    styles.signCheck,
                    active
                      ? { backgroundColor: semantic.danger, borderColor: semantic.danger }
                      : { borderColor: common.borderStrong },
                  ]}
                >
                  {active ? <Check size={20} color={common.white} /> : null}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.signLabel}>{sign.label}</Text>
                  <Text style={styles.signDetail}>{sign.detail}</Text>
                </View>
              </PressableScale>
            );
          })}
        </View>

        <Field
          label="¿Algo más? (opcional)"
          value={note}
          onChangeText={setNote}
          placeholder="Desde cuándo, qué tan fuerte…"
          multiline
          accent={semantic.danger}
          maxLength={280}
        />

        <AppButton
          title="Avisar a mi obstetra"
          onPress={() => void sendReport()}
          variant="danger"
          large
          disabled={selectedLabels.length === 0}
          loading={sending}
          testID="btn-enviar-reporte"
        />
        <Text style={styles.reportHint}>
          {selectedLabels.length === 0
            ? "Primero marca lo que sientes."
            : `Vas a avisar ${selectedLabels.length === 1 ? "1 síntoma" : `${selectedLabels.length} síntomas`}.`}
        </Text>
      </ScrollView>

      <View style={[styles.sosBar, { paddingBottom: Math.max(insets.bottom, spacing.sm2) }]}>
        <Text style={styles.sosBarText}>¿Es una emergencia?</Text>
        <PressableScale
          onPress={() => void sendSOS()}
          accessibilityLabel="Botón de emergencia SOS"
          style={styles.sosButton}
          testID="btn-panico"
        >
          <Siren size={28} color={common.white} />
          <Text style={styles.sosButtonText}>SOS</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm2,
  },
  question: { ...type.h2, color: common.text },
  hint: { ...type.bodyXl, color: common.textSecondary, marginTop: -spacing.sm },
  signsCard: {
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: common.border,
    paddingHorizontal: spacing.md,
  },
  signRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm2,
    minHeight: 64,
  },
  signRowBorder: {
    borderTopWidth: 1,
    borderTopColor: common.border,
  },
  signCheck: {
    width: 34,
    height: 34,
    borderRadius: radius.xs,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  signLabel: { ...type.bodyXlMd, color: common.text },
  signDetail: { ...type.body, color: common.textSecondary },
  reportHint: {
    ...type.body,
    color: common.textTertiary,
    textAlign: "center",
  },
  sosBar: {
    backgroundColor: common.surface,
    borderTopWidth: 1,
    borderTopColor: common.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm2,
    gap: spacing.sm,
  },
  sosBarText: { ...type.bodyXlMd, color: common.text, textAlign: "center" },
  sosButton: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: semantic.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm2,
  },
  sosButtonText: { ...type.h2, color: common.white, letterSpacing: 2 },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm2,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  successTitle: { ...type.h2, color: common.text, textAlign: "center" },
  successText: {
    ...type.bodyXl,
    color: common.textSecondary,
    textAlign: "center",
  },
  successButton: { alignSelf: "stretch", marginTop: spacing.md },
});
