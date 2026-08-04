/**
 * Indicadores en una sola tarjeta con separadores finos: etiqueta corta
 * arriba (con icono pequeño) y número grande debajo. Estilo panel clínico.
 */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { cardBorder, common, radius, spacing, type } from "@/constants/theme";

export interface StatItem {
  key: string;
  value: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

export function StatGroup({ items }: { items: StatItem[] }): React.ReactElement {
  return (
    <View style={styles.card}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const color = item.color ?? common.text;
        return (
          <View key={item.key} style={[styles.cell, index > 0 && styles.cellBorder]}>
            <View style={styles.labelRow}>
              {Icon ? <Icon size={13} color={color} strokeWidth={2.2} /> : null}
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
            <Text style={[styles.value, { color }]} numberOfLines={1}>
              {item.value}
            </Text>
          </View>
        );
      })}
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
    paddingHorizontal: spacing.sm2,
    gap: 4,
  },
  cellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: common.border,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 16,
  },
  label: {
    ...type.overline,
    fontSize: 10.5,
    lineHeight: 14,
    color: common.textSecondary,
    textTransform: "uppercase" as const,
    flexShrink: 1,
  },
  value: {
    ...type.numeric,
    fontSize: 27,
    lineHeight: 33,
  },
});
