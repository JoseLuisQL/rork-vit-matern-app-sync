/**
 * Panel de indicadores cálido: número grande a mano arriba y etiqueta
 * pequeña debajo, separados por líneas finas color crema.
 */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, spacing } from "@/constants/theme";

export interface StatItem {
  key: string;
  value: string;
  label: string;
  /** Se mantiene por compatibilidad; el panel no dibuja iconos. */
  icon?: LucideIcon;
  color?: string;
}

export function StatGroup({ items }: { items: StatItem[] }): React.ReactElement {
  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={item.key} style={[styles.cell, index > 0 && styles.cellBorder]}>
          <Text style={[styles.value, { color: item.color ?? gwarm.ink }]} numberOfLines={1}>
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
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingVertical: spacing.md,
    ...gShadow,
  },
  cell: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 1,
  },
  cellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: gwarm.border,
  },
  value: {
    fontFamily: gfonts.hand,
    fontSize: 30,
    lineHeight: 37,
  },
  label: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
});
