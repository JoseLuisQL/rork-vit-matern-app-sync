/**
 * Panel de indicadores: número grande arriba y etiqueta pequeña debajo,
 * separados por líneas finas. Sin adornos — estilo tablero clínico.
 */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { cardBorder, common, radius, spacing, type } from "@/constants/theme";

export interface StatItem {
  key: string;
  value: string;
  label: string;
  /** Se mantiene por compatibilidad; el panel ya no dibuja iconos. */
  icon?: LucideIcon;
  color?: string;
}

export function StatGroup({ items }: { items: StatItem[] }): React.ReactElement {
  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={item.key} style={[styles.cell, index > 0 && styles.cellBorder]}>
          <Text style={[styles.value, { color: item.color ?? common.text }]} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    ...cardBorder,
  },
  cell: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 3,
  },
  cellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: common.border,
  },
  value: {
    ...type.numeric,
    fontSize: 26,
    lineHeight: 32,
  },
  label: {
    ...type.overline,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.7,
    color: common.textTertiary,
    textTransform: "uppercase" as const,
  },
});
