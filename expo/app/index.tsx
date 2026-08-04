/** Pantalla inicial: splash cálido de marca + redirección según el rol de la sesión. */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";
import { brand, gfonts, gwarm } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";

export default function IndexScreen(): React.ReactElement {
  const router = useRouter();
  const { hydrated, user } = useApp();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = setTimeout(() => {
      if (user?.role === "gestante") {
        router.replace("/(gestante)/(tabs)/inicio");
      } else if (user?.role === "obstetra") {
        router.replace("/(obstetra)/(tabs)/inicio");
      } else if (user?.role === "admin") {
        router.replace("/(admin)/(tabs)/inicio");
      } else {
        router.replace("/login");
      }
    }, 900);
    return () => clearTimeout(timeout);
  }, [hydrated, user, router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, { opacity: fade }]}>
        <Image
          source={require("@/assets/images/vitmaterna_logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>
          <Text style={styles.titleBrand}>Vit</Text>
          <Text style={styles.titleRest}>Materna</Text>
        </Text>
        <Text style={styles.tagline}>Tu salud prenatal, siempre contigo</Text>
      </Animated.View>
      <View style={styles.footer}>
        <ActivityIndicator color={gwarm.teal} />
        <Text style={styles.footerText}>C.S. Talavera · Andahuaylas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gwarm.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 40,
    lineHeight: 49,
    marginTop: 12,
  },
  titleBrand: {
    color: brand.plum,
  },
  titleRest: {
    color: gwarm.ink,
  },
  tagline: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 22,
    color: gwarm.inkSoft,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 64,
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 18,
    color: gwarm.inkFaint,
  },
});
