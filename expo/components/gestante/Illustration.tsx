/** Ilustración remota con caché en disco: visible sin señal tras la primera carga. */
import { Image } from "expo-image";
import React from "react";
import type { ImageStyle, StyleProp } from "react-native";

interface IllustrationProps {
  source: string;
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
}

export function Illustration({
  source,
  width,
  height,
  style,
}: IllustrationProps): React.ReactElement {
  return (
    <Image
      source={{ uri: source }}
      style={[{ width, height }, style]}
      contentFit="contain"
      transition={250}
      cachePolicy="memory-disk"
    />
  );
}
