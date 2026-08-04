/**
 * Botones de módulos: fila de accesos con icono en contenedor redondeado
 * tintado, etiqueta clara y globo de pendientes. Diseño moderno y sobrio.
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
    <View style={styles.card}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <PressableScale
            key={item.key}
            onPress={item.onPress}
            accessibilityLabel={item.label}
            style={styles.item}
            testID={item.testID}
          >
            <View>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: withAlpha(item.color, 0.1),
                    borderColor: withAlpha(item.color, 0.18),
                  },
                ]}
              >
                <Icon size={24} color={item.color} strokeWidth={2} />
              </View>
              {item.badge != null && item.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge > 99 ? "99" : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </PressableScale>
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
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    ...cardBorder,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: semantic.danger,
    borderWidth: 2,
    borderColor: common.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    ...type.label,
    fontSize: 10.5,
    lineHeight: 13,
    color: common.white,
  },
  label: {
    ...type.label,
    fontSize: 12.5,
    lineHeight: 16,
    color: common.textSecondary,
    textAlign: "center",
  },
});
