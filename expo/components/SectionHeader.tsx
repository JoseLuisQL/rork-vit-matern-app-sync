/** Título de sección a mano con acción opcional a la derecha. */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, spacing } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void; color?: string };
}

export function SectionHeader({ title, action }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <Text style={[styles.action, { color: action.color ?? gwarm.tealDeep }]}>
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
    gap: spacing.sm,
    marginTop: spacing.sm2,
    marginBottom: 2,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 21,
    lineHeight: 27,
    color: gwarm.ink,
    flex: 1,
  },
  action: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 21,
  },
});
