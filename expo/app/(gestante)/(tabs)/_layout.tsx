/** Pestañas de la gestante: 4 opciones con iconos dibujados a crayola y letra a mano. */
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GICON } from "@/constants/illustrations";
import { gfonts, gwarm } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { useUnreadCount } from "@/providers/AppProvider";
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

export default function GestanteTabsLayout(): React.ReactElement {
  const unread = useUnreadCount();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  const navItems: NavItem[] = useMemo(
    () => [
      {
        key: "inicio",
        label: "Inicio",
        route: "/(gestante)/(tabs)/inicio",
        iconUri: GICON.casa,
      },
      {
        key: "citas",
        label: "Citas",
        route: "/(gestante)/(tabs)/citas",
        iconUri: GICON.citas,
      },
      {
        key: "tratamiento",
        label: "Pastillas",
        route: "/(gestante)/(tabs)/tratamiento",
        iconUri: GICON.pastillas,
      },
      {
        key: "chat",
        label: "Mensajes",
        route: "/(gestante)/(tabs)/chat",
        iconUri: GICON.mensajes,
        badge: unread > 0 ? unread : undefined,
      },
    ],
    [unread],
  );

  return (
    <WebShell navItems={navItems} role="gestante">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: gwarm.tealDeep,
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
          tabBarLabelStyle: { fontFamily: gfonts.hand, fontSize: 13.5 },
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
          name="citas"
          options={{
            title: "Citas",
            tabBarIcon: ({ focused }) => <TabIcon uri={GICON.citas} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="tratamiento"
          options={{
            title: "Pastillas",
            tabBarIcon: ({ focused }) => <TabIcon uri={GICON.pastillas} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Mensajes",
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
