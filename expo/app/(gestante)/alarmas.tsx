/**
 * Pedir ayuda: cada síntoma tiene su dibujito y una casilla gigante, para
 * reconocerlo sin necesidad de leer. El botón SOS late suavemente y siempre
 * está visible abajo. Todo funciona sin señal (queda en cola y se envía solo)
 * e incluye la ubicación GPS si está disponible.
 */
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  Baby,
  Brain,
  CheckCircle2,
  CloudUpload,
  Droplets,
  Eye,
  Hand,
  Siren,
  Thermometer,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALARM_SIGNS } from "@/constants/content";
import { fonts, gwarm, semantic, spacing } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { confirmAction } from "@/lib/confirm";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Field } from "@/components/Field";
import { PressableScale } from "@/components/PressableScale";
import { BigCheckRow } from "@/components/gestante/BigCheckRow";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";

type SentKind = "alarma" | "sos" | null;

/** Dibujito de cada síntoma: se reconoce la opción sin leer. */
const SIGN_ICONS: Record<string, LucideIcon> = {
  sangrado: Droplets,
  cabeza: Brain,
  vision: Eye,
  fiebre: Thermometer,
  hinchazon: Hand,
  movimientos: Baby,
  contracciones: Zap,
  liquido: Waves,
};

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

/** Botón SOS gigante que late suavemente para llamar la atención. */
function SOSButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }): React.ReactElement {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="Botón de emergencia SOS"
      style={styles.sosButton}
      testID="btn-panico"
    >
      <Animated.View
        style={{
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
          ],
        }}
      >
        <Siren size={30} color="#FFFFFF" />
      </Animated.View>
      <Text style={styles.sosButtonText}>SOS</Text>
    </PressableScale>
  );
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
        <GHeader title={sent === "sos" ? "SOS enviado" : "Aviso enviado"} back />
        <View style={styles.successWrap}>
          <Illustration source={ILU.manos} width={132} height={132} />
          <View style={styles.successBadge}>
            {online ? (
              <CheckCircle2 size={22} color={semantic.success} />
            ) : (
              <CloudUpload size={22} color={semantic.warning} />
            )}
            <Text
              style={[
                styles.successBadgeText,
                { color: online ? semantic.success : semantic.warning },
              ]}
            >
              {online ? "Tu obstetra ya fue avisada" : "Guardado en tu teléfono"}
            </Text>
          </View>
          <Text style={styles.successText}>
            {online
              ? "Mantén la calma. Si puedes movilizarte, acude al centro de salud mientras te contactan."
              : "No hay señal ahora. Tu aviso se enviará solo apenas vuelva la conexión. Si puedes, acude al centro de salud o pide apoyo a tu promotor de salud."}
          </Text>
          <AppButton
            title="Volver al inicio"
            onPress={() => router.back()}
            color={gwarm.teal}
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
      <GHeader title="Pedir ayuda" back />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introRow}>
          <Illustration source={ILU.manos} width={70} height={70} />
          <View style={styles.flex}>
            <Text style={styles.question}>¿Qué sientes?</Text>
            <Text style={styles.hint}>Marca todo lo que te pasa.</Text>
          </View>
        </View>

        <View style={styles.signsList}>
          {ALARM_SIGNS.map((sign) => (
            <BigCheckRow
              key={sign.id}
              checked={selected.includes(sign.id)}
              label={sign.label}
              sublabel={sign.detail}
              icon={SIGN_ICONS[sign.id]}
              color={semantic.danger}
              softColor={gwarm.redSoft}
              onToggle={() => toggleSign(sign.id)}
              testID={`sign-${sign.id}`}
            />
          ))}
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
        <SOSButton onPress={() => void sendSOS()} disabled={sending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm2,
  },
  introRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  question: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: gwarm.ink,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  signsList: { gap: spacing.sm },
  reportHint: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 19,
    color: gwarm.inkFaint,
    textAlign: "center",
  },
  sosBar: {
    backgroundColor: gwarm.surfaceSoft,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm2,
    gap: spacing.sm,
  },
  sosBarText: {
    fontFamily: fonts.semibold,
    fontSize: 16.5,
    lineHeight: 22,
    color: gwarm.ink,
    textAlign: "center",
  },
  sosButton: {
    height: 66,
    borderRadius: 20,
    backgroundColor: semantic.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm2,
  },
  sosButtonText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm2,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  successBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  successText: {
    fontFamily: fonts.regular,
    fontSize: 16.5,
    lineHeight: 25,
    color: gwarm.inkSoft,
    textAlign: "center",
  },
  successButton: { alignSelf: "stretch", marginTop: spacing.md },
});
