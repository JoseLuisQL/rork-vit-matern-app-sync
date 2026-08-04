/**
 * Estado del interlocutor como en WhatsApp: "En línea" con puntito verde,
 * "Escribiendo…" con animación, o la última conexión ("Últ. vez hoy a las
 * 14:05"). Se usa como subtítulo en las cabeceras del chat.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, semantic } from "@/constants/theme";
import { ultimaConexion } from "@/lib/format";
import type { PresenceView } from "@/types";
import { TypingDots } from "@/components/TypingDots";

interface PresenceStatusProps {
  presence: PresenceView | null;
  /** Color del "Escribiendo…" (acento del rol). */
  accent: string;
  /** Texto mientras llega la primera sincronización. */
  fallback?: string;
}

export function PresenceStatus({
  presence,
  accent,
  fallback = "Conectando…",
}: PresenceStatusProps): React.ReactElement {
  if (!presence) {
    return (
      <Text style={styles.muted} numberOfLines={1}>
        {fallback}
      </Text>
    );
  }
  if (presence.typing) {
    return (
      <View style={styles.row}>
        <TypingDots color={accent} size={6} />
        <Text style={[styles.status, { color: accent }]} numberOfLines={1}>
          Escribiendo…
        </Text>
      </View>
    );
  }
  if (presence.online) {
    return (
      <View style={styles.row}>
        <View style={styles.dot} />
        <Text style={[styles.status, { color: semantic.success }]} numberOfLines={1}>
          En línea
        </Text>
      </View>
    );
  }
  return (
    <Text style={styles.muted} numberOfLines={1}>
      {ultimaConexion(presence.lastSeenISO)}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
    minHeight: 19,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: semantic.success,
  },
  status: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
  },
  muted: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
    marginTop: 1,
    minHeight: 19,
  },
});
