/**
 * Foto de perfil editable: tocar abre la galería (recorte cuadrado y
 * compresión automática); si ya hay foto se puede quitar. Cambiarla
 * necesita conexión con el servidor.
 */
import { Camera } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { common, radius, spacing, type } from "@/constants/theme";
import { ApiError, avatarUri } from "@/lib/api";
import { confirmAction, showNotice } from "@/lib/confirm";
import { pickAvatarDataUrl } from "@/lib/photo";
import { useApp } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";

interface ProfilePhotoProps {
  accentColor: string;
  accentBackground: string;
  size?: number;
}

export function ProfilePhoto({
  accentColor,
  accentBackground,
  size = 92,
}: ProfilePhotoProps): React.ReactElement | null {
  const { user, online, setAvatar } = useApp();
  const [busy, setBusy] = useState<boolean>(false);

  const uri = avatarUri(user?.dni, user?.avatarVersion);

  const upload = useCallback(
    async (dataUrl: string | null) => {
      setBusy(true);
      try {
        await setAvatar(dataUrl);
      } catch (e) {
        showNotice(
          "No se pudo guardar",
          e instanceof ApiError && e.status === 0
            ? "Sin conexión con el servidor. Inténtalo cuando tengas señal."
            : e instanceof Error
              ? e.message
              : "Error desconocido",
        );
      } finally {
        setBusy(false);
      }
    },
    [setAvatar],
  );

  const handlePick = useCallback(async () => {
    if (!online) {
      showNotice("Sin conexión", "Para cambiar tu foto necesitas señal. Inténtalo más tarde.");
      return;
    }
    try {
      const dataUrl = await pickAvatarDataUrl();
      if (!dataUrl) return;
      await upload(dataUrl);
    } catch (e) {
      console.log("[VitMaterna] foto de perfil:", e);
      showNotice("No se pudo abrir tus fotos", "Vuelve a intentarlo.");
    }
  }, [online, upload]);

  const handleRemove = useCallback(async () => {
    if (!online) {
      showNotice("Sin conexión", "Para quitar tu foto necesitas señal.");
      return;
    }
    const ok = await confirmAction({
      title: "Quitar foto",
      message: "Se mostrará el icono de usuario en su lugar.",
      confirmText: "Quitar",
      destructive: true,
    });
    if (ok) await upload(null);
  }, [online, upload]);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar foto de perfil"
        onPress={() => void handlePick()}
        disabled={busy}
        testID="btn-cambiar-foto"
      >
        <View>
          <Avatar uri={uri} color={accentColor} background={accentBackground} size={size} />
          {busy ? (
            <View style={[styles.busyOverlay, { borderRadius: size / 2 }]}>
              <ActivityIndicator color={common.white} />
            </View>
          ) : null}
          <View style={[styles.cameraBadge, { backgroundColor: accentColor }]}>
            <Camera size={14} color={common.white} strokeWidth={2.2} />
          </View>
        </View>
      </Pressable>
      {uri && !busy ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleRemove()}
          hitSlop={8}
          style={styles.removeWrap}
          testID="btn-quitar-foto"
        >
          <Text style={styles.removeText}>Quitar foto</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xs,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: common.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: common.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  removeWrap: {
    minHeight: 32,
    justifyContent: "center",
  },
  removeText: {
    ...type.bodySm,
    color: common.textSecondary,
    textDecorationLine: "underline" as const,
  },
});
