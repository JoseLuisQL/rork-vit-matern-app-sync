/**
 * Control segmentado profesional: contenedor gris con el segmento activo en
 * blanco elevado. Reemplaza las filas de chips de colores en los filtros.
 */
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { common, radius, type } from "@/constants/theme";

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
              style={[styles.label, { color: active ? common.text : common.textSecondary }]}
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
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.md,
    padding: 3,
    height: 40,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    borderRadius: radius.md - 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  segmentActive: {
    backgroundColor: common.surface,
    ...Platform.select({
      web: { boxShadow: "0 1px 4px rgba(22,36,43,0.12)" },
      default: {
        shadowColor: "#16242B",
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      },
    }),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  label: {
    ...type.buttonSm,
    fontSize: 13,
  },
});
