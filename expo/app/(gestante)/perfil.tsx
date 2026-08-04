/**
 * Perfil de la gestante: datos personales, embarazo, recordatorios
 * configurables y cierre de sesión.
 */
import { useRouter } from "expo-router";
import { Bell, LogOut } from "lucide-react-native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { common, gestanteTheme, radius, semantic, spacing, type } from "@/constants/theme";
import { confirmAction, showNotice } from "@/lib/confirm";
import { fechaCompleta } from "@/lib/format";
import {
  REMINDER_HOURS,
  REMINDERS_SUPPORTED,
  requestNotificationPermission,
} from "@/lib/notifications";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { Card } from "@/components/Card";
import { PressableScale } from "@/components/PressableScale";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { AppButton } from "@/components/AppButton";

const accent = gestanteTheme;

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function PerfilGestante(): React.ReactElement {
  const router = useRouter();
  const { user, view, logout, pendingCount, reminders, setReminders } = useApp();
  const patient = useMyPatient();

  const toggleTomas = useCallback(
    async (value: boolean) => {
      if (value) {
        if (!REMINDERS_SUPPORTED) {
          showNotice(
            "No disponible en esta vista previa",
            "Los recordatorios funcionan en la app instalada en el teléfono. Aquí no se pueden programar avisos.",
          );
          return;
        }
        const granted = await requestNotificationPermission();
        if (!granted) {
          showNotice(
            "Permiso necesario",
            "Activa las notificaciones de VitMaterna en los ajustes de tu teléfono para recibir recordatorios.",
          );
          return;
        }
      }
      setReminders({ ...reminders, tomas: value });
    },
    [reminders, setReminders],
  );

  const toggleCitas = useCallback(
    async (value: boolean) => {
      if (value) {
        if (!REMINDERS_SUPPORTED) {
          showNotice(
            "No disponible en esta vista previa",
            "Los recordatorios funcionan en la app instalada en el teléfono. Aquí no se pueden programar avisos.",
          );
          return;
        }
        const granted = await requestNotificationPermission();
        if (!granted) {
          showNotice(
            "Permiso necesario",
            "Activa las notificaciones de VitMaterna en los ajustes de tu teléfono.",
          );
          return;
        }
      }
      setReminders({ ...reminders, citas: value });
    },
    [reminders, setReminders],
  );

  const handleLogout = useCallback(async () => {
    const warning =
      pendingCount > 0
        ? `Tienes ${pendingCount} ${pendingCount === 1 ? "cambio pendiente" : "cambios pendientes"} de envío que se perderán. `
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

  if (!user || !patient || !view) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mi perfil" showBack />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.photoCard}>
          <ProfilePhoto accentColor={accent.primary} accentBackground={accent.primaryLight} />
          <Text style={styles.photoName}>
            {patient.firstName} {patient.lastName}
          </Text>
          <Text style={styles.photoMeta}>
            Semana {patient.weeks} · {patient.community}
          </Text>
        </Card>

        <SectionHeader title="Mis datos" />
        <Card style={styles.card}>
          <InfoRow label="DNI" value={patient.dni} />
          <InfoRow label="Edad" value={`${patient.age} años`} />
          <InfoRow label="Comunidad" value={patient.community} />
          <InfoRow label="Teléfono" value={patient.phone || "—"} />
        </Card>

        <SectionHeader title="Mi embarazo" />
        <Card style={styles.card}>
          <InfoRow label="Semanas" value={`${patient.weeks}`} />
          <InfoRow label="Fecha probable de parto" value={fechaCompleta(patient.fppKey)} />
        </Card>

        <SectionHeader title="Recordatorios" />
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={[styles.switchIcon, { backgroundColor: accent.primaryLight }]}>
              <Bell size={17} color={accent.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>Aviso para tus pastillas</Text>
              <Text style={styles.switchText}>Todos los días, funciona sin señal</Text>
            </View>
            <Switch
              value={reminders.tomas}
              onValueChange={(v) => void toggleTomas(v)}
              trackColor={{ true: accent.primary, false: common.borderStrong }}
              thumbColor={common.white}
              testID="switch-tomas"
            />
          </View>

          {reminders.tomas ? (
            <View style={styles.hoursRow}>
              {REMINDER_HOURS.map((h) => {
                const active = reminders.hora === h;
                return (
                  <PressableScale
                    key={h}
                    onPress={() => setReminders({ ...reminders, hora: h })}
                    accessibilityLabel={`Recordar a las ${h}:00`}
                    style={[
                      styles.hourChip,
                      active
                        ? { backgroundColor: accent.primary, borderColor: accent.primary }
                        : { borderColor: common.border },
                    ]}
                  >
                    <Text style={[styles.hourText, { color: active ? common.white : common.textSecondary }]}>
                      {`${h}`.padStart(2, "0")}:00
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          ) : null}

          <View style={[styles.switchRow, styles.switchRowBorder]}>
            <View style={[styles.switchIcon, { backgroundColor: accent.primaryLight }]}>
              <Bell size={17} color={accent.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>Aviso de cita</Text>
              <Text style={styles.switchText}>Un día antes, a las 6:00 p. m.</Text>
            </View>
            <Switch
              value={reminders.citas}
              onValueChange={(v) => void toggleCitas(v)}
              trackColor={{ true: accent.primary, false: common.borderStrong }}
              thumbColor={common.white}
              testID="switch-citas"
            />
          </View>
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
  card: { gap: spacing.sm },
  photoCard: {
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md2,
  },
  photoName: {
    ...type.h2,
    color: common.text,
    textAlign: "center" as const,
    marginTop: spacing.xs,
  },
  photoMeta: { ...type.body, color: common.textSecondary },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 34,
  },
  infoLabel: { ...type.body, color: common.textSecondary },
  infoValue: { ...type.bodyXlMd, color: common.text, flexShrink: 1, textAlign: "right" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  switchRowBorder: {
    borderTopWidth: 1,
    borderTopColor: common.border,
    paddingTop: spacing.sm2,
  },
  switchIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  switchTitle: { ...type.bodyXlMd, color: common.text },
  switchText: { ...type.body, color: common.textSecondary },
  hoursRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  hourChip: {
    paddingHorizontal: spacing.sm2,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: common.surface,
  },
  hourText: { ...type.buttonSm },
  about: {
    ...type.caption,
    color: common.textTertiary,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
