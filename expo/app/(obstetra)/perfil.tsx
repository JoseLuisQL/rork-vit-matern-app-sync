/**
 * Perfil de la obstetra ("cuaderno"): foto, datos y cierre de sesión.
 * Adaptado con arquitectura responsiva Web (contenedor centrado en escritorio).
 */
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { gfonts, gwarm, warmBlue } from "@/constants/theme";
import { GICON, TOASTILU } from "@/constants/illustrations";
import { confirmAction } from "@/lib/confirm";
import { playAppSound } from "@/lib/sounds";
import { useApp, usePatients } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { EditProfileModal } from "@/components/EditProfileModal";
import { useToast } from "@/components/Toast";
import { Illustration } from "@/components/gestante/Illustration";
import { WebContainer } from "@/components/web/WebContainer";

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
  const {
    user,
    view,
    logout,
    pendingCount,
    soundsEnabled,
    setSoundsEnabled,
    setAutoControls,
    online,
  } = useApp();
  const { show: showToast } = useToast();
  const patients = usePatients();
  const [updatingControls, setUpdatingControls] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  /** Al encender suena una muestra para escuchar cómo avisan los mensajes. */
  const toggleSounds = useCallback(
    (value: boolean) => {
      setSoundsEnabled(value);
      if (value) {
        playAppSound("mensaje");
        showToast("Sonidos activados: así suenan los mensajes", "success");
      } else {
        showToast("Sonidos apagados. El SOS seguirá vibrando", "info");
      }
    },
    [setSoundsEnabled, showToast],
  );

  /** Configuración independiente de controles automáticos según FUM para esta obstetra. */
  const toggleAutoControls = useCallback(
    async (value: boolean) => {
      if (!online) {
        showToast("Necesitas conexión para cambiar esta preferencia", "info");
        return;
      }
      setUpdatingControls(true);
      try {
        await setAutoControls(value);
        if (value) {
          showToast(
            "Controles automáticos activados: se generarán los 8 controles MINSA al registrar gestantes",
            "success",
          );
        } else {
          showToast(
            "Controles automáticos desactivados: registrarás los controles manualmente",
            "info",
          );
        }
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "No se pudo actualizar la preferencia",
          "error",
        );
      } finally {
        setUpdatingControls(false);
      }
    },
    [online, setAutoControls, showToast],
  );

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

  const autoControlsEnabled = user.autoControls !== false;

  return (
    <View style={styles.container}>
      <WebContainer size="form">
        <ScreenHeader title="Mi perfil" showBack />
      </WebContainer>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="form">
          <View style={styles.formStack}>
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

            <SectionHeader
              title="Tus datos"
              action={{
                label: "Editar",
                onPress: () => setEditModalOpen(true),
                color: warmBlue.main,
              }}
            />
            <Card style={styles.card}>
              <InfoRow label="DNI" value={user.dni} />
              <InfoRow label="Rol" value="Obstetra" />
              <InfoRow label="Teléfono" value={user.phone ?? "—"} />
              <InfoRow label="Centro" value={view.center.name} />
            </Card>

            <SectionHeader title="Controles prenatales" />
            <Card style={styles.card}>
              <View style={styles.switchRow}>
                <View style={[styles.switchIcon, { backgroundColor: warmBlue.soft }]}>
                  <Illustration source={GICON.citas} width={24} height={24} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Generar 8 controles según FUM</Text>
                  <Text style={styles.switchText}>
                    {autoControlsEnabled
                      ? "Al registrar una gestante se crean automáticamente sus 8 controles MINSA."
                      : "Desactivado: tú registrarás manualmente cada control prenatal en la agenda."}
                  </Text>
                </View>
                <Switch
                  value={autoControlsEnabled}
                  onValueChange={toggleAutoControls}
                  disabled={updatingControls}
                  trackColor={{ true: warmBlue.main, false: gwarm.borderStrong }}
                  thumbColor="#FFFFFF"
                  testID="switch-auto-controles"
                />
              </View>
            </Card>

            <SectionHeader title="Sonidos" />
            <Card style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchIcon}>
                  <Illustration source={TOASTILU.aviso} width={24} height={24} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Sonidos de los avisos</Text>
                  <Text style={styles.switchText}>Mensajes de tus gestantes y alertas SOS</Text>
                </View>
                <Switch
                  value={soundsEnabled}
                  onValueChange={toggleSounds}
                  trackColor={{ true: warmBlue.main, false: gwarm.borderStrong }}
                  thumbColor="#FFFFFF"
                  testID="switch-sonidos"
                />
              </View>
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
          </View>
        </WebContainer>
      </ScrollView>

      <EditProfileModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        accentColor={warmBlue.main}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  formStack: {
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: gwarm.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  switchTitle: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.ink,
  },
  switchText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.inkSoft,
  },
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
