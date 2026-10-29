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
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initNotifications, setupNotificationListeners } from "@/lib/notifications";
import { gwarm } from "@/constants/theme";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { ToastHost, ToastProvider } from "@/components/Toast";
import { ConfirmHost, ConfirmProvider } from "@/components/ConfirmDialog";
import { AppProvider } from "@/providers/AppProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

initNotifications();

async function checkAndApplyOtaUpdate() {
  if (Platform.OS === "web" || __DEV__) return;
  try {
    if (!Updates.isEnabled) return;
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (err) {
    console.log("[VitMaterna OTA] Verificación de actualización omitida:", err);
  }
}

function NotificationResponder() {
  const router = useRouter();
  useEffect(() => {
    void checkAndApplyOtaUpdate();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void checkAndApplyOtaUpdate();
      }
    });
    const unsubscribeNotif = setupNotificationListeners((route) => {
      try {
        router.push(route as any);
      } catch (e) {
        console.warn("[VitMaterna] No se pudo navegar a la ruta de la notificación:", e);
      }
    });
    return () => {
      sub.remove();
      unsubscribeNotif();
    };
  }, [router]);
  return null;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: gwarm.bg },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(gestante)" />
      <Stack.Screen name="(obstetra)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PatrickHand_400Regular,
    Delius_400Regular,
  });
  const [fontTimedOut, setFontTimedOut] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || Boolean(fontError) || fontTimedOut;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AppProvider>
            <NotificationResponder />
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: gwarm.bg }}>
              <StatusBar style="dark" backgroundColor={gwarm.bg} />
              <RootLayoutNav />
              <MaintenanceGate />
              <ToastHost />
              <ConfirmHost />
            </GestureHandlerRootView>
          </AppProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
