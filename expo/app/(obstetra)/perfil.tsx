/** Perfil de la obstetra: datos y cierre de sesión. */
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { common, obstetraTheme, semantic, spacing, type } from "@/constants/theme";
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
            accentColor={obstetraTheme.primary}
            accentBackground={obstetraTheme.primaryLight}
          />
          <Text style={styles.name}>
            Obst. {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.meta}>
            {view.center.name} · {patients.length} gestantes en seguimiento
          </Text>
        </Card>

        <SectionHeader title="Datos" />
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
          color={semantic.danger}
          icon={LogOut}
        />

        <Text style={styles.about}>VitMaterna · {view.center.name}</Text>
      </ScrollView>
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
  headerCard: {
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md2,
  },
  name: { ...type.h3, color: common.text, textAlign: "center" as const, marginTop: spacing.xs },
  meta: {
    ...type.bodySm,
    color: common.textSecondary,
    textAlign: "center" as const,
  },
  card: { gap: spacing.sm },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 28,
  },
  infoLabel: { ...type.bodySm, color: common.textSecondary },
  infoValue: { ...type.bodyMd, color: common.text, flexShrink: 1, textAlign: "right" },
  about: {
    ...type.caption,
    color: common.textTertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
