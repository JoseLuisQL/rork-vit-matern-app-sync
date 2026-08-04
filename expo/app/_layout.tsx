/** VITMATERNA — Layout raíz: fuentes (Inter + manuscritas), React Query, proveedor central y notificaciones. */
import "@/lib/warnings";
import { Delius_400Regular } from "@expo-google-fonts/delius";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { PatrickHand_400Regular } from "@expo-google-fonts/patrick-hand";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initNotifications } from "@/lib/notifications";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { ToastHost, ToastProvider } from "@/components/Toast";
import { AppProvider } from "@/providers/AppProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

initNotifications();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(gestante)" />
      <Stack.Screen name="(obstetra)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PatrickHand_400Regular,
    Delius_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="dark" />
            <RootLayoutNav />
            <MaintenanceGate />
            <ToastHost />
          </GestureHandlerRootView>
        </AppProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
