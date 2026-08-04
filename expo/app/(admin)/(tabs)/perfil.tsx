/**
 * Perfil de administración ("cuaderno"): foto, datos y cierre de sesión.
 * La restauración de demostración y el mantenimiento viven en la pestaña
 * Sistema.
 */
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, warmPlum } from "@/constants/theme";
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
  const { user, view, logout } = useApp();

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
  about: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 18,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: 16,
  },
});
