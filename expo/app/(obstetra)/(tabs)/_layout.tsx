/** Pestañas de la obstetra: iconos dibujados a crayola y letra a mano. */
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GICON } from "@/constants/illustrations";
import { gfonts, gwarm, warmBlue } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { useApp, useUnreadCount } from "@/providers/AppProvider";
import { type NavItem } from "@/components/web/WebSidebar";
import { WebShell } from "@/components/web/WebShell";

/** Icono ilustrado de pestaña: a color cuando está activa, difuminado si no. */
function TabIcon({ uri, focused }: { uri: string; focused: boolean }): React.ReactElement {
  return (
    <Image
      source={{ uri }}
      style={{
        width: 31,
        height: 31,
        opacity: focused ? 1 : 0.4,
        transform: [{ scale: focused ? 1 : 0.9 }],
      }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={150}
    />
  );
}

export default function ObstetraTabsLayout(): React.ReactElement {
  const unread = useUnreadCount();
  const { view } = useApp();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  const openAlerts = useMemo(
    () => (view?.alerts ?? []).filter((a) => a.status === "abierta").length,
    [view?.alerts],
  );

  const navItems: NavItem[] = useMemo(
    () => [
      {
        key: "inicio",
        label: "Inicio",
        route: "/(obstetra)/(tabs)/inicio",
        iconUri: GICON.casa,
      },
      {
        key: "gestantes",
        label: "Gestantes",
        route: "/(obstetra)/(tabs)/gestantes",
        iconUri: GICON.gestantes,
      },
      {
        key: "agenda",
        label: "Agenda",
        route: "/(obstetra)/(tabs)/agenda",
        iconUri: GICON.citas,
      },
      {
        key: "alertas",
        label: "Alertas",
        route: "/(obstetra)/(tabs)/alertas",
        iconUri: GICON.campana,
        badge: openAlerts > 0 ? openAlerts : undefined,
      },
      {
        key: "chat",
        label: "Chat",
        route: "/(obstetra)/(tabs)/chat",
        iconUri: GICON.mensajes,
        badge: unread > 0 ? unread : undefined,
      },
    ],
    [openAlerts, unread],
  );

  return (
    <WebShell navItems={navItems} role="obstetra">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: warmBlue.deep,
          tabBarInactiveTintColor: gwarm.inkFaint,
          tabBarStyle: isDesktop
            ? { display: "none" }
            : {
                backgroundColor: gwarm.surfaceSoft,
                borderTopColor: gwarm.border,
                borderTopWidth: 1,
                height: 66 + Math.max(insets.bottom, 6),
                paddingTop: 8,
                paddingBottom: Math.max(insets.bottom, 8),
              },
          tabBarLabelStyle: { fontFamily: gfonts.hand, fontSize: 13 },
        }}
      >
        <Tabs.Screen
          name="inicio"
          options={{
            title: "Inicio",
            tabBarIcon: ({ focused }) => <TabIcon uri={GICON.casa} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="gestantes"
          options={{
            title: "Gestantes",
            tabBarIcon: ({ focused }) => <TabIcon uri={GICON.gestantes} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="agenda"
          options={{
            title: "Agenda",
            tabBarIcon: ({ focused }) => <TabIcon uri={GICON.citas} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="alertas"
          options={{
            title: "Alertas",
            tabBarIcon: ({ focused }) => <TabIcon uri={GICON.campana} focused={focused} />,
            tabBarBadge: openAlerts > 0 ? openAlerts : undefined,
            tabBarBadgeStyle: {
              backgroundColor: gwarm.rose,
              color: "#FFFFFF",
              fontFamily: gfonts.hand,
              fontSize: 12,
            },
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ focused }) => <TabIcon uri={GICON.mensajes} focused={focused} />,
            tabBarBadge: unread > 0 ? unread : undefined,
            tabBarBadgeStyle: {
              backgroundColor: gwarm.terracotta,
              color: "#FFFFFF",
              fontFamily: gfonts.hand,
              fontSize: 12,
            },
          }}
        />
      </Tabs>
    </WebShell>
  );
}
