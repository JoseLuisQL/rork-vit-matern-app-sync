/** Sección de administración: tabs + creación de usuarios. */
import { Redirect, Stack } from "expo-router";
import React from "react";
import { common } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";

export default function AdminLayout(): React.ReactElement | null {
  const { hydrated, user } = useApp();
  if (!hydrated) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== "admin") return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: common.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="nuevo-usuario" options={{ presentation: "modal" }} />
    </Stack>
  );
}
