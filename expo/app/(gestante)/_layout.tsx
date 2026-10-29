/** Sección de la gestante: tabs + pantallas apiladas (alarmas, perfil, artículo). */
import { Redirect, Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import { gwarm } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";

export default function GestanteLayout(): React.ReactElement | null {
  const { hydrated, user } = useApp();
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: gwarm.bg }} />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== "gestante") return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: gwarm.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="alarmas" options={{ presentation: "modal" }} />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="educacion/[id]" />
    </Stack>
  );
}
