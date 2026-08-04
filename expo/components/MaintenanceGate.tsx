/**
 * Telón de mantenimiento en tiempo real: cuando administración activa el
 * modo mantenimiento, gestantes y obstetras ven esta pantalla cálida a
 * pantalla completa (con su dibujo y mensaje amable). La sincronización
 * sigue viva por debajo, así que al desactivarlo la app vuelve sola.
 */
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { brand, gfonts, gShadow, gwarm } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { Illustration } from "@/components/gestante/Illustration";
import { useApp } from "@/providers/AppProvider";

export function MaintenanceGate(): React.ReactElement | null {
  const { user, systemConfig } = useApp();
  const active = systemConfig?.maintenance === true && user !== null && user.role !== "admin";
  const float = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const native = Platform.OS !== "web";
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: native }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: native,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: native,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, fade, float]);

  if (!active) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]} testID="maintenance-gate">
      <View style={styles.center}>
        <Animated.View
          style={{
            transform: [
              { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
            ],
          }}
        >
          <Illustration source={ILU.mantenimiento} width={250} height={250} />
        </Animated.View>
        <Text style={styles.title}>Estamos en mantenimiento</Text>
        <Text style={styles.message}>
          {systemConfig?.maintenanceMessage ??
            "Estamos mejorando VitMaterna para cuidarte mejor. Vuelve en un ratito."}
        </Text>
        <View style={styles.pill}>
          <View style={styles.dot} />
          <Text style={styles.pillText}>La app volverá sola en cuanto terminemos</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>
          <Text style={{ color: brand.plum }}>Vit</Text>
          <Text style={{ color: gwarm.ink }}>Materna</Text>
        </Text>
        <Text style={styles.footerText}>Gracias por tu paciencia · Tus datos están seguros</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: gwarm.bg,
    zIndex: 900,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  center: {
    alignItems: "center",
    gap: 10,
    maxWidth: 420,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 32,
    lineHeight: 39,
    color: gwarm.ink,
    textAlign: "center",
    marginTop: 6,
  },
  message: {
    fontFamily: gfonts.handBody,
    fontSize: 16.5,
    lineHeight: 24,
    color: gwarm.inkSoft,
    textAlign: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.amberMid,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
    ...gShadow,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: gwarm.amber,
  },
  pillText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.amber,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
    gap: 2,
  },
  footerBrand: {
    fontFamily: gfonts.hand,
    fontSize: 22,
    lineHeight: 28,
  },
  footerText: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
});
