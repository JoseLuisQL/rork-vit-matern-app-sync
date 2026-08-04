/**
 * Accesos a módulos del cuaderno: tarjetas cálidas con dibujo a crayola
 * (o icono de respaldo) en ficha de color suave y etiqueta a mano.
 */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, spacing, withAlpha } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";
import { Illustration } from "@/components/gestante/Illustration";

export interface ModuleItem {
  key: string;
  label: string;
  /** Icono de respaldo cuando no hay dibujo. */
  icon: LucideIcon;
  /** Dibujo a crayola (URL); tiene prioridad sobre el icono. */
  illu?: string;
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
                {item.illu ? (
                  <Illustration source={item.illu} width={34} height={34} />
                ) : (
                  <Icon size={22} color={item.color} strokeWidth={2.2} />
                )}
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
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingVertical: spacing.sm2,
    alignItems: "center",
    gap: spacing.sm,
    ...gShadow,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: gwarm.terracotta,
    borderWidth: 2,
    borderColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: gfonts.hand,
    fontSize: 11.5,
    lineHeight: 14,
    color: "#FFFFFF",
  },
  label: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 16,
    color: gwarm.inkSoft,
    textAlign: "center",
  },
});
