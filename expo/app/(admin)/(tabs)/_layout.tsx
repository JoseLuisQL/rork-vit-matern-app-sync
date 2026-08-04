/** Tabs de administración: Inicio, Usuarios, Reportes y Perfil. */
import { Tabs } from "expo-router";
import { ChartBar, Home, UserRound, Users } from "lucide-react-native";
import React from "react";
import { adminTheme, common, fonts } from "@/constants/theme";

export default function AdminTabsLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: adminTheme.primary,
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
        name="usuarios"
        options={{
          title: "Usuarios",
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color }) => <ChartBar size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <UserRound size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
