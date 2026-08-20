/**
 * Perfil de la gestante: foto, datos personales, embarazo, recordatorios
 * configurables y cierre de sesión — en el mismo tono cálido de la sección.
 * Adaptado con arquitectura responsiva Web (contenedor centrado en escritorio).
 */
import { useRouter } from "expo-router";
import { LogOut, MessageCircle, Phone } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { gfonts, gwarm, semantic, spacing } from "@/constants/theme";
import { GICON, ILU, TOASTILU } from "@/constants/illustrations";
import { avatarUri } from "@/lib/api";
import { confirmAction, showNotice } from "@/lib/confirm";
import { fechaCompleta } from "@/lib/format";
import { playAppSound } from "@/lib/sounds";
import {
  REMINDER_HOURS,
  REMINDERS_SUPPORTED,
  requestNotificationPermission,
} from "@/lib/notifications";
import { useApp, useMyPatient, usePresence } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { PresenceStatus } from "@/components/PresenceStatus";
import { useToast } from "@/components/Toast";
import { PressableScale } from "@/components/PressableScale";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { SoftCard } from "@/components/gestante/SoftCard";
import { WebContainer } from "@/components/web/WebContainer";

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
  const { user, view, logout, pendingCount, reminders, setReminders, soundsEnabled, setSoundsEnabled } =
    useApp();
  const { show: showToast } = useToast();
  const patient = useMyPatient();
  const presence = usePresence("obstetra");
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  /** Al encender suena una muestra para que escuche cómo avisan los mensajes. */
  const toggleSounds = useCallback(
    (value: boolean) => {
      setSoundsEnabled(value);
      if (value) {
        playAppSound("mensaje");
        showToast("Sonidos activados: así suenan tus mensajes", "success");
      } else {
        showToast("Sonidos apagados. El SOS seguirá vibrando", "info");
      }
    },
    [setSoundsEnabled, showToast],
  );

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
      <WebContainer size="form">
        <GHeader title="Mi perfil" back />
      </WebContainer>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="form">
          <View style={styles.formStack}>
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

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Mis datos</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditModalOpen(true)}
                hitSlop={8}
              >
                <Text style={styles.editAction}>Editar</Text>
              </Pressable>
            </View>
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

            <Text style={styles.sectionTitle}>Tu obstetra a cargo</Text>
            <SoftCard style={styles.card}>
              <View style={styles.obstetraHeader}>
                <Avatar
                  uri={
                    view.obstetrician
                      ? avatarUri(view.obstetrician.dni, view.obstetrician.avatarVersion)
                      : undefined
                  }
                  color={gwarm.teal}
                  background={gwarm.tealSoft}
                  size={54}
                />
                <View style={styles.flex}>
                  <Text style={styles.obstetraName}>
                    {view.obstetrician
                      ? `Obst. ${view.obstetrician.firstName} ${view.obstetrician.lastName}`
                      : "Obstetra a cargo"}
                  </Text>
                  <Text style={styles.obstetraRole}>
                    {view.center.name} · Obstetricia
                  </Text>
                  <View style={styles.presenceBox}>
                    <PresenceStatus
                      presence={presence}
                      accent={gwarm.teal}
                      fallback="Personal de salud"
                    />
                  </View>
                </View>
              </View>

              {view.obstetrician?.phone ? (
                <InfoRow label="Teléfono" value={view.obstetrician.phone} />
              ) : null}

              <View style={styles.actionsRow}>
                {view.obstetrician?.phone ? (
                  <View style={styles.actionBtnWrap}>
                    <AppButton
                      title="Llamar"
                      onPress={() => {
                        const rawPhone = view.obstetrician?.phone?.replace(/\s+/g, "");
                        if (rawPhone) void Linking.openURL(`tel:${rawPhone}`);
                      }}
                      variant="soft"
                      color={gwarm.teal}
                      icon={Phone}
                      small
                      testID="btn-llamar-obstetra"
                    />
                  </View>
                ) : null}
                <View style={styles.actionBtnWrap}>
                  <AppButton
                    title="Mensaje"
                    onPress={() => router.push("/(gestante)/(tabs)/chat")}
                    variant="soft"
                    color={gwarm.terracotta}
                    icon={MessageCircle}
                    small
                    testID="btn-chat-obstetra"
                  />
                </View>
              </View>
            </SoftCard>

            <Text style={styles.sectionTitle}>Recordatorios</Text>
            <SoftCard style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchIcon}>
                  <Illustration source={GICON.campana} width={26} height={26} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Aviso para tus medicamentos</Text>
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

            <Text style={styles.sectionTitle}>Sonidos</Text>
            <SoftCard style={styles.card}>
              <View style={styles.switchRow}>
                <View style={[styles.switchIcon, styles.soundIcon]}>
                  <Illustration source={TOASTILU.aviso} width={26} height={26} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Sonidos de los avisos</Text>
                  <Text style={styles.switchText}>Al llegar mensajes, citas o medicamentos nuevos</Text>
                </View>
                <Switch
                  value={soundsEnabled}
                  onValueChange={toggleSounds}
                  trackColor={{ true: gwarm.teal, false: gwarm.borderStrong }}
                  thumbColor="#FFFFFF"
                  testID="switch-sonidos"
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
          </View>
        </WebContainer>
      </ScrollView>

      <EditProfileModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        accentColor={gwarm.teal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  formStack: {
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: spacing.xs,
  },
  sectionTitle: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.inkSoft,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  editAction: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 21,
    color: gwarm.teal,
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
  soundIcon: { backgroundColor: gwarm.amberSoft },
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
  obstetraHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingBottom: spacing.xs,
  },
  obstetraName: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 24,
    color: gwarm.ink,
  },
  obstetraRole: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.inkSoft,
    marginTop: 1,
  },
  presenceBox: {
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtnWrap: {
    flex: 1,
  },
});
