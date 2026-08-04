/** Encabezado de sección editorial: etiqueta pequeña en mayúsculas + acción opcional. */
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
    marginTop: spacing.sm2,
    marginBottom: 2,
  },
  title: {
    ...type.overline,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
    color: common.textTertiary,
    textTransform: "uppercase" as const,
  },
  action: {
    ...type.buttonSm,
    fontSize: 13,
    color: common.textSecondary,
  },
});
