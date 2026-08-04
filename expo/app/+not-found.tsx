/** Pantalla 404 con el estilo Clinical Calm. */
import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { common, gestanteTheme, radius, spacing, type } from "@/constants/theme";

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
    padding: spacing.md2,
    backgroundColor: common.background,
  },
  title: {
    ...type.h2,
    color: common.text,
  },
  link: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm2,
    paddingHorizontal: spacing.lg,
    backgroundColor: gestanteTheme.primaryLight,
    borderRadius: radius.pill,
  },
  linkText: {
    ...type.button,
    color: gestanteTheme.primary,
  },
});
