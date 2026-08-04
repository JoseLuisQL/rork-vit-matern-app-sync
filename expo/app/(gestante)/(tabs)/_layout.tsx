/** Tabs de la gestante (4, lo más simple posible): Inicio, Citas, Pastillas y Mensajes. */
import { Tabs } from "expo-router";
import { CalendarDays, Home, MessageCircle, Pill } from "lucide-react-native";
import React from "react";
import { common, fonts, gestanteTheme } from "@/constants/theme";
import { useUnreadCount } from "@/providers/AppProvider";

export default function GestanteTabsLayout(): React.ReactElement {
  const unread = useUnreadCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: gestanteTheme.primary,
        tabBarInactiveTintColor: common.textTertiary,
        tabBarStyle: {
          backgroundColor: common.surface,
          borderTopColor: common.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="citas"
        options={{
          title: "Citas",
          tabBarIcon: ({ color }) => <CalendarDays size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tratamiento"
        options={{
          title: "Pastillas",
          tabBarIcon: ({ color }) => <Pill size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: gestanteTheme.primary, color: common.white },
        }}
      />
    </Tabs>
  );
}
