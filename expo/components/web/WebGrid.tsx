/**
 * Componentes de Grilla Responsiva para el entorno Web de VitMaterna.
 * Permiten crear layouts en columnas (60/40, 50/50, 33/33/33, etc.) que en móvil
 * se apilan verticalmente y en escritorio/tableta se distribuyen en paralelo.
 */
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";

interface WebRowProps {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}

export function WebRow({
  children,
  gap = 16,
  style,
  alignItems = "stretch",
}: WebRowProps): React.ReactElement {
  const { isDesktop, isTablet } = useResponsive();
  const isHorizontal = isDesktop || isTablet;

  return (
    <View
      style={[
        styles.rowBase,
        isHorizontal
          ? { flexDirection: "row", gap, alignItems }
          : { flexDirection: "column", gap: Math.round(gap * 0.75) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface WebColProps {
  children: React.ReactNode;
  flex?: number;
  widthPercent?: number; // e.g. 50, 60, 40
  minWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export function WebCol({
  children,
  flex = 1,
  widthPercent,
  minWidth,
  style,
}: WebColProps): React.ReactElement {
  const { isDesktop, isTablet } = useResponsive();
  const isHorizontal = isDesktop || isTablet;

  return (
    <View
      style={[
        isHorizontal
          ? widthPercent
            ? { width: `${widthPercent}%` as any, flexShrink: 0 }
            : { flex, minWidth: minWidth ?? 0 }
          : { width: "100%" },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rowBase: {
    width: "100%",
  },
});
