/**
 * Control segmentado cálido: contenedor crema con el segmento activo en
 * blanco elevado y letra a mano.
 */
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { gfonts, gwarm } from "@/constants/theme";

export interface SegmentedOption {
  key: string;
  label: string;
  /** Punto de color opcional (p. ej. semáforo de riesgo). */
  dot?: string;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export function Segmented({ options, value, onChange, style }: SegmentedProps): React.ReactElement {
  const select = (key: string) => {
    if (key === value) return;
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onChange(key);
  };

  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            onPress={() => select(opt.key)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            {opt.dot ? <View style={[styles.dot, { backgroundColor: opt.dot }]} /> : null}
            <Text
              style={[styles.label, { color: active ? gwarm.ink : gwarm.inkSoft }]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1E9D8",
    borderRadius: 17,
    padding: 3,
    height: 44,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  segmentActive: {
    backgroundColor: gwarm.surface,
    ...Platform.select({
      web: { boxShadow: "0 2px 6px rgba(148,124,90,0.18)" },
      default: {
        shadowColor: "#947C5A",
        shadowOpacity: 0.16,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  label: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 19,
  },
});
