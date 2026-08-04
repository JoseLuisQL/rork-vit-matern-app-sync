/** Tile de indicador: número grande y una etiqueta corta. */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { cardBorder, common, radius, spacing, type, withAlpha } from "@/constants/theme";

interface StatTileProps {
  value: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
  sub?: string;
}

export function StatTile({
  value,
  label,
  icon: Icon,
  color = common.text,
  sub,
}: StatTileProps): React.ReactElement {
  return (
    <View style={styles.tile}>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.1) }]}>
          <Icon size={17} color={color} />
        </View>
      ) : null}
      <Text style={[styles.value, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {sub ? (
        <Text style={styles.sub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
    ...cardBorder,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: {
    ...type.numeric,
    fontSize: 28,
    lineHeight: 34,
  },
  label: {
    ...type.bodySm,
    color: common.textSecondary,
  },
  sub: {
    ...type.caption,
    color: common.textTertiary,
  },
});
