/** Estado vacío con ícono, título y texto de apoyo. */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { common, radius, spacing, type } from "@/constants/theme";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
}

export function EmptyState({ icon: Icon, title, text }: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={26} color={common.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: common.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...type.h3,
    color: common.text,
    textAlign: "center",
  },
  text: {
    ...type.bodySm,
    color: common.textSecondary,
    textAlign: "center",
  },
});
