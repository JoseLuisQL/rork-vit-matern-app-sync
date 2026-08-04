/** Sección de la obstetra: tabs + ficha, chat por paciente, programación y perfil. */
import { Redirect, Stack } from "expo-router";
import React from "react";
import { common } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";

export default function ObstetraLayout(): React.ReactElement | null {
  const { hydrated, user } = useApp();
  if (!hydrated) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== "obstetra") return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: common.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="gestante/[id]" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="programar" options={{ presentation: "modal" }} />
      <Stack.Screen name="perfil" />
    </Stack>
  );
}
