/**
 * Accesos a módulos: fila de tarjetas blancas independientes con icono
 * en contenedor tintado y etiqueta corta. Sobrio, moderno y ordenado.
 */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { cardBorder, common, radius, semantic, spacing, type, withAlpha } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

export interface ModuleItem {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  onPress: () => void;
  badge?: number;
  testID?: string;
}

export function ModuleGrid({ items }: { items: ModuleItem[] }): React.ReactElement {
  return (
    <View style={styles.row}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <PressableScale
            key={item.key}
            onPress={item.onPress}
            accessibilityLabel={item.label}
            style={styles.tile}
            testID={item.testID}
          >
            <View>
              <View style={[styles.iconBox, { backgroundColor: withAlpha(item.color, 0.1) }]}>
                <Icon size={21} color={item.color} strokeWidth={2} />
              </View>
              {item.badge != null && item.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge > 99 ? "99" : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm2,
    alignItems: "center",
    gap: spacing.sm,
    ...cardBorder,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: semantic.danger,
    borderWidth: 2,
    borderColor: common.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    ...type.label,
    fontSize: 10,
    lineHeight: 12,
    color: common.white,
  },
  label: {
    ...type.label,
    fontSize: 12,
    lineHeight: 15,
    color: common.textSecondary,
    textAlign: "center",
  },
});
