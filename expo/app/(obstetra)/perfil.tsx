/** Perfil de la obstetra ("cuaderno"): foto, datos y cierre de sesión. */
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, warmBlue } from "@/constants/theme";
import { confirmAction } from "@/lib/confirm";
import { useApp, usePatients } from "@/providers/AppProvider";
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

export default function PerfilObstetra(): React.ReactElement {
  const router = useRouter();
  const { user, view, logout, pendingCount } = useApp();
  const patients = usePatients();

  const handleLogout = useCallback(async () => {
    const warning =
      pendingCount > 0
        ? `Tienes ${pendingCount} ${pendingCount === 1 ? "cambio pendiente" : "cambios pendientes"} que se perderán. `
        : "";
    const ok = await confirmAction({
      title: "Cerrar sesión",
      message: `${warning}Para volver a entrar necesitarás conexión.`,
      confirmText: "Cerrar sesión",
      destructive: true,
    });
    if (ok) {
      logout();
      router.replace("/login");
    }
  }, [logout, pendingCount, router]);

  if (!user || !view) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mi perfil" showBack />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <ProfilePhoto
            accentColor={warmBlue.main}
            accentBackground={warmBlue.soft}
          />
          <Text style={styles.name}>
            Obst. {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.meta}>
            {view.center.name} · {patients.length} gestantes a tu cuidado
          </Text>
        </Card>

        <SectionHeader title="Tus datos" />
        <Card style={styles.card}>
          <InfoRow label="DNI" value={user.dni} />
          <InfoRow label="Rol" value="Obstetra" />
          <InfoRow label="Teléfono" value={user.phone ?? "—"} />
          <InfoRow label="Centro" value={view.center.name} />
        </Card>

        <SectionHeader title="Cuenta" />
        <AppButton
          title="Cerrar sesión"
          onPress={() => void handleLogout()}
          variant="outline"
          color={gwarm.rose}
          icon={LogOut}
        />

        <Text style={styles.about}>VitMaterna · {view.center.name}</Text>
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
  card: { gap: 10 },
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
    lineHeight: 17,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: 16,
  },
});
