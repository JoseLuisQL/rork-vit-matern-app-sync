/**
 * Perfil de la gestante: foto, datos personales, embarazo, recordatorios
 * configurables y cierre de sesión — en el mismo tono cálido de la sección.
 */
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { gfonts, gwarm, semantic, spacing } from "@/constants/theme";
import { GICON, ILU } from "@/constants/illustrations";
import { confirmAction, showNotice } from "@/lib/confirm";
import { fechaCompleta } from "@/lib/format";
import {
  REMINDER_HOURS,
  REMINDERS_SUPPORTED,
  requestNotificationPermission,
} from "@/lib/notifications";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { SoftCard } from "@/components/gestante/SoftCard";

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
      <GHeader title="Mi perfil" back />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SoftCard style={styles.photoCard}>
          <ProfilePhoto accentColor={gwarm.teal} accentBackground={gwarm.tealSoft} />
          <Text style={styles.photoName}>
            {patient.firstName} {patient.lastName}
          </Text>
          <Text style={styles.photoMeta}>
            Semana {patient.weeks} · {patient.community}
          </Text>
          <Illustration source={ILU.flores} width={132} height={38} />
        </SoftCard>

        <Text style={styles.sectionTitle}>Mis datos</Text>
        <SoftCard style={styles.card}>
          <InfoRow label="DNI" value={patient.dni} />
          <InfoRow label="Edad" value={`${patient.age} años`} />
          <InfoRow label="Comunidad" value={patient.community} />
          <InfoRow label="Teléfono" value={patient.phone || "—"} />
        </SoftCard>

        <Text style={styles.sectionTitle}>Mi embarazo</Text>
        <SoftCard style={styles.card}>
          <InfoRow label="Semanas" value={`${patient.weeks}`} />
          <InfoRow label="Fecha probable de parto" value={fechaCompleta(patient.fppKey)} />
        </SoftCard>

        <Text style={styles.sectionTitle}>Recordatorios</Text>
        <SoftCard style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchIcon}>
              <Illustration source={GICON.campana} width={26} height={26} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>Aviso para tus pastillas</Text>
              <Text style={styles.switchText}>Todos los días, funciona sin señal</Text>
            </View>
            <Switch
              value={reminders.tomas}
              onValueChange={(v) => void toggleTomas(v)}
              trackColor={{ true: gwarm.teal, false: gwarm.borderStrong }}
              thumbColor="#FFFFFF"
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
                        ? { backgroundColor: gwarm.teal, borderColor: gwarm.teal }
                        : { borderColor: gwarm.border },
                    ]}
                  >
                    <Text
                      style={[styles.hourText, { color: active ? "#FFFFFF" : gwarm.inkSoft }]}
                    >
                      {`${h}`.padStart(2, "0")}:00
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          ) : null}

          <View style={[styles.switchRow, styles.switchRowBorder]}>
            <View style={styles.switchIcon}>
              <Illustration source={GICON.citas} width={26} height={26} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>Aviso de cita</Text>
              <Text style={styles.switchText}>Un día antes, a las 6:00 p. m.</Text>
            </View>
            <Switch
              value={reminders.citas}
              onValueChange={(v) => void toggleCitas(v)}
              trackColor={{ true: gwarm.teal, false: gwarm.borderStrong }}
              thumbColor="#FFFFFF"
              testID="switch-citas"
            />
          </View>
        </SoftCard>

        <Text style={styles.sectionTitle}>Cuenta</Text>
        <AppButton
          title="Cerrar sesión"
          onPress={() => void handleLogout()}
          variant="outline"
          color={semantic.danger}
          hand
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm2,
  },
  card: { gap: spacing.sm },
  photoCard: {
    alignItems: "center",
    gap: spacing.xs,
  },
  photoName: {
    fontFamily: gfonts.hand,
    fontSize: 25,
    lineHeight: 31,
    color: gwarm.ink,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  photoMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.inkSoft,
  },
  sectionTitle: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.inkSoft,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 36,
  },
  infoLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    color: gwarm.inkSoft,
  },
  infoValue: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    color: gwarm.ink,
    flexShrink: 1,
    textAlign: "right",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  switchRowBorder: {
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    paddingTop: spacing.sm2,
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: gwarm.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  switchTitle: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 24,
    color: gwarm.ink,
  },
  switchText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  hoursRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  hourChip: {
    paddingHorizontal: spacing.sm2,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: gwarm.surface,
  },
  hourText: {
    fontFamily: gfonts.hand,
    fontSize: 16,
  },
  about: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
