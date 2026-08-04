/** Título de bloque con icono en ficha de color suave — reconocible sin leer. */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, gwarm, spacing } from "@/constants/theme";

interface BlockTitleProps {
  icon: LucideIcon;
  title: string;
  color: string;
  soft: string;
}

export function BlockTitle({ icon: Icon, title, color, soft }: BlockTitleProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: soft }]}>
        <Icon size={19} color={color} strokeWidth={2.4} />
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
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    color: gwarm.ink,
    flex: 1,
  },
});
