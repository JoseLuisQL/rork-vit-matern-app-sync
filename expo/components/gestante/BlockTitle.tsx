/** Título de bloque con dibujo a crayola en ficha de color suave — reconocible sin leer. */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { Illustration } from "./Illustration";

interface BlockTitleProps {
  /** Icono de respaldo cuando no hay dibujo. */
  icon?: LucideIcon;
  /** Dibujo a crayola (URL); tiene prioridad sobre el icono. */
  illu?: string;
  title: string;
  color: string;
  soft: string;
}

export function BlockTitle({
  icon: Icon,
  illu,
  title,
  color,
  soft,
}: BlockTitleProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: soft }]}>
        {illu ? (
          <Illustration source={illu} width={28} height={28} />
        ) : Icon ? (
          <Icon size={19} color={color} strokeWidth={2.4} />
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm2 },
  tile: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 26,
    color: gwarm.ink,
    flex: 1,
  },
});
