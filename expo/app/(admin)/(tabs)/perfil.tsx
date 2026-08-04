/** Perfil de administración ("cuaderno"): foto, datos, restaurar demo y cierre de sesión. */
import { useRouter } from "expo-router";
import { LogOut, RotateCcw } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, warmPlum } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { useApp } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function PerfilAdmin(): React.ReactElement {
  const router = useRouter();
  const { user, view, logout, adminReset, online } = useApp();
  const [resetting, setResetting] = useState<boolean>(false);

  const handleReset = useCallback(async () => {
    if (!online) {
      Alert.alert("Sin conexión", "Restaurar la demostración necesita conexión con el servidor.");
      return;
    }
    const ok = await confirmAction({
      title: "Restaurar demostración",
      message:
        "Se borrarán los cambios y el servidor volverá a los datos de demostración (pacientes, citas, alertas y mensajes de ejemplo).",
      confirmText: "Restaurar",
      destructive: true,
    });
    if (!ok) return;
    setResetting(true);
    try {
      await adminReset();
      Alert.alert("Listo", "Los datos de demostración fueron restaurados en el servidor.");
    } catch (e) {
      Alert.alert(
        "No se pudo restaurar",
        e instanceof ApiError && e.status === 0
          ? "Sin conexión con el servidor."
          : e instanceof Error
            ? e.message
            : "Error desconocido",
      );
    } finally {
      setResetting(false);
    }
  }, [adminReset, online]);

  const handleLogout = useCallback(async () => {
    const ok = await confirmAction({
      title: "Cerrar sesión",
      message: "Para volver a entrar necesitarás conexión.",
      confirmText: "Cerrar sesión",
      destructive: true,
    });
    if (ok) {
      logout();
      router.replace("/login");
    }
  }, [logout, router]);

  if (!user || !view) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Perfil" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <ProfilePhoto
            accentColor={warmPlum.main}
            accentBackground={warmPlum.soft}
          />
          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.meta}>Administración · {view.center.name}</Text>
        </Card>

        <SectionHeader title="Tus datos" />
        <Card style={styles.card}>
          <InfoRow label="DNI" value={user.dni} />
          <InfoRow label="Rol" value="Administración" />
          <InfoRow label="Centro" value={`${view.center.name} (${view.center.altitudeMsnm} msnm)`} />
        </Card>

        <SectionHeader title="Demostración" />
        <Card style={styles.card}>
          <Text style={styles.resetText}>
            Vuelve a los datos de ejemplo del servidor: pacientes con distintos niveles de riesgo,
            citas, alertas, mensajes y visitas.
          </Text>
          <AppButton
            title="Restaurar datos de demostración"
            onPress={() => void handleReset()}
            color={warmPlum.main}
            variant="soft"
            icon={RotateCcw}
            loading={resetting}
            testID="btn-reset-demo"
          />
        </Card>

        <SectionHeader title="Cuenta" />
        <AppButton
          title="Cerrar sesión"
          onPress={() => void handleLogout()}
          variant="outline"
          color={gwarm.rose}
          icon={LogOut}
        />

        <Text style={styles.about}>
          VitMaterna · plataforma de salud prenatal{"\n"}Cálculos clínicos y alertas en el servidor.
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
  headerCard: {
    alignItems: "center",
    gap: 4,
    padding: 20,
  },
  name: {
    fontFamily: gfonts.hand,
    fontSize: 24,
    lineHeight: 30,
    color: gwarm.ink,
    textAlign: "center" as const,
    marginTop: 6,
  },
  meta: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
    textAlign: "center" as const,
  },
  card: { gap: 12 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    minHeight: 28,
  },
  infoLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  infoValue: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
    flexShrink: 1,
    textAlign: "right",
  },
  resetText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.inkSoft,
  },
  about: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 18,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: 16,
  },
});
