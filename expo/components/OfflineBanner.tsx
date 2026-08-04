/** Indicador de conexión: sin señal (datos guardados) y cambios pendientes de envío. */
import { CloudUpload, WifiOff } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { semantic, spacing, type } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";

export function OfflineBanner(): React.ReactElement | null {
  const { online, pendingCount, session } = useApp();
  if (!session) return null;

  if (!online) {
    return (
      <View style={[styles.banner, styles.offline]} testID="offline-banner">
        <WifiOff size={14} color={semantic.warning} />
        <Text style={[styles.text, { color: semantic.warning }]} numberOfLines={1}>
          Sin conexión · mostrando datos guardados
          {pendingCount > 0 ? ` · ${pendingCount} por enviar` : ""}
        </Text>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <View style={[styles.banner, styles.syncing]} testID="syncing-banner">
        <CloudUpload size={14} color={semantic.info} />
        <Text style={[styles.text, { color: semantic.info }]} numberOfLines={1}>
          Enviando {pendingCount} {pendingCount === 1 ? "cambio pendiente" : "cambios pendientes"}…
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  offline: {
    backgroundColor: semantic.warningLight,
  },
  syncing: {
    backgroundColor: semantic.infoLight,
  },
  text: {
    ...type.label,
    fontSize: 12,
  },
});
