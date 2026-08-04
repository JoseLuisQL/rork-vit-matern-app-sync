/**
 * Botón de ubicación GPS estilo "nota del cuaderno": pin en un círculo de
 * color, título a mano y las coordenadas debajo. Al tocarlo abre la app de
 * mapas del teléfono (Apple/Google Maps) con el punto marcado y su nombre.
 * Incluye una fila apagada para avisos que llegaron sin ubicación.
 */
import { MapPinned, MapPinOff, Navigation } from "lucide-react-native";
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm } from "@/constants/theme";
import { formatCoords, openInMaps } from "@/lib/maps";
import { PressableScale } from "@/components/PressableScale";

interface LocationChipProps {
  lat: number;
  lng: number;
  /** Nombre del pin en la app de mapas (ej. "SOS de María"). */
  label: string;
  /** Título visible del botón. */
  title?: string;
  color?: string;
  testID?: string;
}

export function LocationChip({
  lat,
  lng,
  label,
  title = "Ver ubicación GPS",
  color = gwarm.teal,
  testID,
}: LocationChipProps): React.ReactElement {
  const handleOpen = useCallback(() => {
    void openInMaps(lat, lng, label);
  }, [lat, lng, label]);

  return (
    <PressableScale
      onPress={handleOpen}
      accessibilityLabel={`${title}. Abre el mapa del teléfono`}
      style={styles.chip}
      testID={testID}
    >
      <View style={[styles.badge, { backgroundColor: color }]}>
        <MapPinned size={19} color="#FFFFFF" />
      </View>
      <View style={styles.texts}>
        <Text style={[styles.title, { color }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.coords} numberOfLines={1}>
          {formatCoords(lat, lng)}
        </Text>
      </View>
      <View style={[styles.goBubble, { backgroundColor: color }]}>
        <Navigation size={13} color="#FFFFFF" />
        <Text style={styles.goText}>Ir</Text>
      </View>
    </PressableScale>
  );
}

/** Fila apagada cuando el aviso llegó sin ubicación GPS disponible. */
export function LocationMissing({
  text = "Llegó sin ubicación GPS",
}: {
  text?: string;
}): React.ReactElement {
  return (
    <View style={styles.missingRow}>
      <MapPinOff size={14} color={gwarm.inkFaint} />
      <Text style={styles.missingText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 56,
    ...gShadow,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    lineHeight: 21,
  },
  coords: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
  goBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  goText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    lineHeight: 17,
    color: "#FFFFFF",
  },
  missingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  missingText: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
});
