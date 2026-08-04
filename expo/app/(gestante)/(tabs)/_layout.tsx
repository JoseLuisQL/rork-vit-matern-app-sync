/** Pestañas de la gestante: 4 opciones grandes con icono y palabra, en tono cálido. */
import { Tabs } from "expo-router";
import { CalendarHeart, House, MessageCircleHeart, Pill } from "lucide-react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, gwarm } from "@/constants/theme";
import { useUnreadCount } from "@/providers/AppProvider";

export default function GestanteTabsLayout(): React.ReactElement {
  const unread = useUnreadCount();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: gwarm.teal,
        tabBarInactiveTintColor: gwarm.inkFaint,
        tabBarStyle: {
          backgroundColor: gwarm.surfaceSoft,
          borderTopColor: gwarm.border,
          borderTopWidth: 1,
          height: 62 + Math.max(insets.bottom, 6),
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <House size={25} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="citas"
        options={{
          title: "Citas",
          tabBarIcon: ({ color }) => <CalendarHeart size={25} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="tratamiento"
        options={{
          title: "Pastillas",
          tabBarIcon: ({ color }) => <Pill size={25} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color }) => (
            <MessageCircleHeart size={25} color={color} strokeWidth={2.2} />
          ),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: gwarm.terracotta,
            color: "#FFFFFF",
            fontFamily: fonts.semibold,
            fontSize: 11,
          },
        }}
      />
    </Tabs>
  );
}
