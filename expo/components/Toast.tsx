/**
 * Sistema de toasts del cuaderno: avisos flotantes cálidos (guardado, error,
 * información) con entrada animada, vibración suave y cierre automático.
 * `ToastProvider` va sobre el proveedor central; `ToastHost` se dibuja una
 * sola vez encima de la navegación.
 */
import createContextHook from "@nkzw/create-context-hook";
import * as Haptics from "expo-haptics";
import { CheckCircle2, CircleAlert, Info, type LucideIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gfonts, gwarm } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

export type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

export const [ToastProvider, useToast] = createContextHook(() => {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const counter = useRef<number>(0);

  /** Muestra un aviso corto. El anterior se reemplaza. */
  const show = useCallback((text: string, kind: ToastKind = "success") => {
    counter.current += 1;
    setToast({ id: counter.current, kind, text });
  }, []);

  const hide = useCallback(() => setToast(null), []);

  return useMemo(() => ({ toast, show, hide }), [toast, show, hide]);
});

const META: Record<ToastKind, { icon: LucideIcon; color: string; soft: string; border: string }> = {
  success: { icon: CheckCircle2, color: gwarm.tealDeep, soft: gwarm.tealSoft, border: gwarm.tealMid },
  error: { icon: CircleAlert, color: gwarm.rose, soft: gwarm.roseSoft, border: gwarm.redMid },
  info: { icon: Info, color: gwarm.amber, soft: gwarm.amberSoft, border: gwarm.amberMid },
};

const AUTO_HIDE_MS = 3400;

export function ToastHost(): React.ReactElement | null {
  const { toast, hide } = useToast();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState<ToastItem | null>(null);

  useEffect(() => {
    if (!toast) return;
    setVisible(toast);
    if (Platform.OS !== "web") {
      const kind =
        toast.kind === "success"
          ? Haptics.NotificationFeedbackType.Success
          : toast.kind === "error"
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning;
      Haptics.notificationAsync(kind).catch(() => {});
    }
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      speed: 16,
      bounciness: 7,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== "web",
      }).start(({ finished }) => {
        if (finished) {
          setVisible(null);
          hide();
        }
      });
    }, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [toast, anim, hide]);

  const dismiss = useCallback(() => {
    setVisible(null);
    hide();
  }, [hide]);

  if (!visible) return null;
  const meta = META[visible.kind];
  const Icon = meta.icon;

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + 8 }]}>
      <Animated.View
        style={{
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        }}
      >
        <PressableScale onPress={dismiss} accessibilityLabel="Cerrar aviso" style={styles.card} testID="toast">
          <View style={[styles.iconCircle, { backgroundColor: meta.soft }]}>
            <Icon size={18} color={meta.color} strokeWidth={2.4} />
          </View>
          <Text style={styles.text} numberOfLines={2}>
            {visible.text}
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 999,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 460,
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...Platform.select({
      web: { boxShadow: "0 12px 30px rgba(148,124,90,0.24)" },
      default: {
        shadowColor: "#947C5A",
        shadowOpacity: 0.24,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 9,
      },
    }),
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 19,
    color: gwarm.ink,
    flexShrink: 1,
  },
});
