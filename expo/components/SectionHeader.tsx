/** Encabezado de sección con acción opcional ("Ver todo"). */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { common, spacing, type } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void; color?: string };
}

export function SectionHeader({ title, action }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <Text style={[styles.action, action.color != null && { color: action.color }]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  title: {
    ...type.h3,
    fontSize: 16,
    color: common.text,
  },
  action: {
    ...type.buttonSm,
    fontSize: 14,
    color: common.textSecondary,
  },
});
