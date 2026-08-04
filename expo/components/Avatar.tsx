/**
 * Avatar profesional: muestra la foto de perfil si existe; si no, un icono
 * de usuario por defecto (nunca iniciales). Acepta un anillo opcional de
 * color, por ejemplo el semáforo de riesgo.
 */
import { Image } from "expo-image";
import { UserRound } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { gwarm, withAlpha } from "@/constants/theme";

interface AvatarProps {
  /** URL de la foto; sin ella se muestra el icono por defecto. */
  uri?: string;
  color: string;
  background: string;
  size?: number;
  /** Anillo exterior opcional (p. ej. color del semáforo). */
  ring?: string;
}

export function Avatar({ uri, color, background, size = 44, ring }: AvatarProps): React.ReactElement {
  const body = uri ? (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: gwarm.border,
        backgroundColor: gwarm.surfaceSoft,
      }}
      contentFit="cover"
      transition={120}
    />
  ) : (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderColor: withAlpha(color, 0.25),
        },
      ]}
    >
      <UserRound size={Math.round(size * 0.5)} color={color} strokeWidth={1.9} />
    </View>
  );

  if (!ring) return body;
  return <View style={[styles.ringWrap, { borderColor: ring }]}>{body}</View>;
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  ringWrap: {
    borderWidth: 2,
    borderRadius: 999,
    padding: 2,
  },
});
