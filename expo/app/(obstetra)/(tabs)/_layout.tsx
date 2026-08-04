/** Tabs de la obstetra: Inicio, Gestantes, Agenda, Alertas y Chat. */
import { Tabs } from "expo-router";
import { Bell, CalendarDays, Home, MessageCircle, Users } from "lucide-react-native";
import React, { useMemo } from "react";
import { common, fonts, obstetraTheme, semantic } from "@/constants/theme";
import { useApp, useUnreadCount } from "@/providers/AppProvider";

export default function ObstetraTabsLayout(): React.ReactElement {
  const unread = useUnreadCount();
  const { view } = useApp();

  const openAlerts = useMemo(
    () => (view?.alerts ?? []).filter((a) => a.status === "abierta").length,
    [view?.alerts],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: obstetraTheme.primary,
        tabBarInactiveTintColor: common.textTertiary,
        tabBarStyle: {
          backgroundColor: common.surface,
          borderTopColor: common.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gestantes"
        options={{
          title: "Gestantes",
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
          tabBarBadge: openAlerts > 0 ? openAlerts : undefined,
          tabBarBadgeStyle: { backgroundColor: semantic.danger, color: common.white },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: obstetraTheme.primary, color: common.white },
        }}
      />
    </Tabs>
  );
}
