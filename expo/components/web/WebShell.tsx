/**
 * Shell principal para la interfaz Web de VitMaterna.
 * En pantallas de escritorio muestra la barra lateral fija a la izquierda
 * y el área de trabajo a la derecha. En pantallas móviles se desactiva
 * automáticamente para permitir la navegación nativa de pestañas inferiores.
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import { gwarm } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import type { Role } from "@/types";
import { type NavItem, WebSidebar } from "./WebSidebar";

interface WebShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: Role;
}

export function WebShell({ children, navItems, role }: WebShellProps): React.ReactElement {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.shell}>
      <WebSidebar items={navItems} role={role} />
      <View style={styles.contentArea}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: gwarm.bg,
    height: "100%",
  },
  contentArea: {
    flex: 1,
    height: "100%",
    backgroundColor: gwarm.bg,
    overflow: "hidden",
  },
});
