/** Pestañas de administración: iconos dibujados a crayola y letra a mano. */
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GICON } from "@/constants/illustrations";
import { gfonts, gwarm, warmPlum } from "@/constants/theme";

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

export default function AdminTabsLayout(): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: warmPlum.main,
        tabBarInactiveTintColor: gwarm.inkFaint,
        tabBarStyle: {
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
        name="usuarios"
        options={{
          title: "Usuarios",
          tabBarIcon: ({ focused }) => <TabIcon uri={GICON.usuarios} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: "Reportes",
          tabBarIcon: ({ focused }) => <TabIcon uri={GICON.reportes} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sistema"
        options={{
          title: "Sistema",
          tabBarIcon: ({ focused }) => <TabIcon uri={GICON.ajustes} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <TabIcon uri={GICON.perfil} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
