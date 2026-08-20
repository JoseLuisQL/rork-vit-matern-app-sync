/**
 * Contenedor responsivo para el entorno Web de VitMaterna.
 * En pantallas grandes centra el contenido con un ancho máximo armónico,
 * evitando que los componentes se estiren desproporcionadamente.
 * En dispositivos móviles se comporta de manera transparente (100% de ancho).
 */
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";

export type WebContainerSize = "full" | "dashboard" | "form" | "reading" | "compact";

interface WebContainerProps {
  children: React.ReactNode;
  size?: WebContainerSize;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

const MAX_WIDTHS: Record<WebContainerSize, number | "100%"> = {
  full: "100%",
  dashboard: 1240,
  form: 880,
  reading: 720,
  compact: 520,
};

export function WebContainer({
  children,
  size = "dashboard",
  style,
  contentStyle,
}: WebContainerProps): React.ReactElement {
  const { isDesktop, isTablet } = useResponsive();
  const maxWidth = MAX_WIDTHS[size];

  if (!isDesktop && !isTablet) {
    return <View style={[styles.mobileWrapper, style]}>{children}</View>;
  }

  return (
    <View style={[styles.outerWrapper, style]}>
      <View
        style={[
          styles.innerContainer,
          maxWidth !== "100%" && { maxWidth },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileWrapper: {
    width: "100%",
  },
  outerWrapper: {
    width: "100%",
    alignItems: "center",
  },
  innerContainer: {
    width: "100%",
    alignSelf: "center",
  },
});
