/** Pantalla 404 con el estilo cálido del cuaderno. */
import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm } from "@/constants/theme";

export default function NotFoundScreen(): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title: "No encontrada", headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta pantalla no existe</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: gwarm.bg,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 24,
    lineHeight: 30,
    color: gwarm.ink,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: gwarm.tealSoft,
    borderRadius: 999,
  },
  linkText: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.tealDeep,
  },
});
