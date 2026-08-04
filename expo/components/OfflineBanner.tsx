/** Indicador de conexión: sin señal (con hora del último guardado) y cambios pendientes de envío. */
import { CloudUpload, WifiOff } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { tiempoRelativo } from "@/lib/format";
import { useApp } from "@/providers/AppProvider";

export function OfflineBanner(): React.ReactElement | null {
  const { online, pendingCount, session, lastSyncISO } = useApp();
  if (!session) return null;

  if (!online) {
    const rel = lastSyncISO ? tiempoRelativo(lastSyncISO) : "";
    const when =
      rel.length === 0
        ? "mostrando datos guardados"
        : rel.startsWith("hace") || rel === "ahora"
          ? `guardado ${rel}`
          : /^\d{2}:\d{2}$/.test(rel)
            ? `guardado a las ${rel}`
            : `guardado el ${rel}`;
    return (
      <View style={[styles.banner, styles.offline]} testID="offline-banner">
        <WifiOff size={14} color={gwarm.amber} />
        <Text style={[styles.text, { color: gwarm.amber }]} numberOfLines={1}>
          Sin conexión · {when}
          {pendingCount > 0 ? ` · ${pendingCount} por enviar` : ""}
        </Text>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <View style={[styles.banner, styles.syncing]} testID="syncing-banner">
        <CloudUpload size={14} color={gwarm.teal} />
        <Text style={[styles.text, { color: gwarm.tealDeep }]} numberOfLines={1}>
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
    backgroundColor: gwarm.amberSoft,
  },
  syncing: {
    backgroundColor: gwarm.tealSoft,
  },
  text: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
  },
});
