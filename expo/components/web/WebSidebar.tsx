/**
 * Barra lateral de navegación (Sidebar) para el entorno Web de VitMaterna.
 * Diseñada con la estética cálida de "cuaderno de cuidado", respetando los colores
 * por rol, tipografía manuscrita, insignias de estado y accesos de perfil/cierre.
 */
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { LogOut, User as UserIcon, Wifi, WifiOff } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { brand, gfonts, gwarm, roleAccent, warmAccent } from "@/constants/theme";
import { ROLE_LABEL } from "@/constants/labels";
import { avatarUri } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { useApp } from "@/providers/AppProvider";
import type { Role } from "@/types";
import { Avatar } from "@/components/Avatar";
import { PressableScale } from "@/components/PressableScale";

export interface NavItem {
  key: string;
  label: string;
  route: string;
  iconUri: string;
  badge?: number;
}

interface WebSidebarProps {
  items: NavItem[];
  role: Role;
}

export function WebSidebar({ items, role }: WebSidebarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, online } = useApp();
  const accent = warmAccent(role);

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: "Cerrar sesión",
      message: "¿Deseas salir de tu cuenta de VitMaterna?",
      confirmText: "Cerrar sesión",
      destructive: true,
    });
    if (ok) {
      await logout();
      router.replace("/login");
    }
  };

  const isCurrent = (route: string) => {
    if (route === "/(obstetra)/(tabs)/inicio" && (pathname === "/inicio" || pathname === "/" || pathname.includes("/(obstetra)/(tabs)/inicio"))) return true;
    if (route === "/(admin)/(tabs)/inicio" && (pathname === "/inicio" || pathname === "/" || pathname.includes("/(admin)/(tabs)/inicio"))) return true;
    if (route === "/(gestante)/(tabs)/inicio" && (pathname === "/inicio" || pathname === "/" || pathname.includes("/(gestante)/(tabs)/inicio"))) return true;
    return pathname.includes(route) || pathname === route;
  };

  return (
    <View style={styles.sidebar}>
      {/* Encabezado con Logo y Marca */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require("@/assets/images/vitmaterna_logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={styles.brandTitles}>
            <Text style={styles.brandName}>
              <Text style={{ color: brand.plum }}>Vit</Text>
              <Text style={{ color: gwarm.ink }}>Materna</Text>
            </Text>
            <Text style={styles.brandCenter}>C.S. Talavera</Text>
          </View>
        </View>

        {/* Indicador de conexión */}
        <View
          style={[
            styles.connBadge,
            { backgroundColor: online ? gwarm.tealSoft : gwarm.amberSoft },
          ]}
        >
          {online ? (
            <>
              <View style={[styles.connDot, { backgroundColor: gwarm.teal }]} />
              <Text style={[styles.connText, { color: gwarm.tealDeep }]}>En línea</Text>
            </>
          ) : (
            <>
              <WifiOff size={12} color={gwarm.amber} />
              <Text style={[styles.connText, { color: gwarm.amber }]}>Sin conexión</Text>
            </>
          )}
        </View>
      </View>

      {/* Lista de Navegación */}
      <View style={styles.navSection}>
        <Text style={styles.navSectionTitle}>MENÚ PRINCIPAL</Text>
        <View style={styles.navList}>
          {items.map((item) => {
            const active = isCurrent(item.route);
            return (
              <PressableScale
                key={item.key}
                onPress={() => router.push(item.route as any)}
                accessibilityLabel={item.label}
                style={[
                  styles.navItem,
                  active && [styles.navItemActive, { backgroundColor: accent.soft }],
                ]}
              >
                <View style={styles.navItemLeft}>
                  <Image
                    source={{ uri: item.iconUri }}
                    style={[styles.navIcon, { opacity: active ? 1 : 0.65 }]}
                    contentFit="contain"
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      active ? [styles.navLabelActive, { color: accent.deep }] : styles.navLabelInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                {item.badge && item.badge > 0 ? (
                  <View style={[styles.badge, { backgroundColor: gwarm.rose }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}

                {active ? (
                  <View style={[styles.activeIndicator, { backgroundColor: accent.main }]} />
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      </View>

      {/* Pie con Perfil de Usuario y Cerrar Sesión */}
      {user ? (
        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              if (role === "obstetra") router.push("/(obstetra)/perfil");
              else if (role === "admin") router.push("/(admin)/(tabs)/perfil");
              else router.push("/(gestante)/perfil");
            }}
            style={styles.userCard}
          >
            <Avatar
              uri={avatarUri(user.dni, user.avatarVersion)}
              color={accent.main}
              background={accent.soft}
              size={40}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.firstName} {user.lastName.split(" ")[0]}
              </Text>
              <Text style={[styles.userRole, { color: accent.main }]}>
                {ROLE_LABEL[user.role]}
              </Text>
            </View>
          </Pressable>

          <PressableScale
            onPress={handleLogout}
            accessibilityLabel="Cerrar sesión"
            style={styles.logoutBtn}
          >
            <LogOut size={16} color={gwarm.inkFaint} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: gwarm.surfaceSoft,
    borderRightWidth: 1,
    borderRightColor: gwarm.border,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
    height: "100%",
    ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, height: "100vh" } as any) : {}),
  },
  header: {
    gap: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandTitles: {
    flex: 1,
  },
  brandName: {
    fontFamily: gfonts.hand,
    fontSize: 26,
    lineHeight: 30,
  },
  brandCenter: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 15,
    color: gwarm.inkFaint,
  },
  connBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connText: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 15,
  },
  navSection: {
    flex: 1,
    paddingTop: 18,
    gap: 10,
  },
  navSectionTitle: {
    fontFamily: gfonts.handBody,
    fontSize: 11,
    letterSpacing: 0.8,
    color: gwarm.inkFaint,
    paddingHorizontal: 8,
  },
  navList: {
    gap: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    position: "relative",
  },
  navItemActive: {},
  navItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navIcon: {
    width: 26,
    height: 26,
  },
  navLabel: {
    fontSize: 15.5,
    lineHeight: 20,
  },
  navLabelActive: {
    fontFamily: gfonts.hand,
  },
  navLabelInactive: {
    fontFamily: gfonts.handBody,
    color: gwarm.inkSoft,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: gfonts.hand,
    fontSize: 12,
    color: "#FFFFFF",
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    gap: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.surface,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 18,
    color: gwarm.ink,
  },
  userRole: {
    fontFamily: gfonts.hand,
    fontSize: 12.5,
    lineHeight: 15,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  logoutText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
});
