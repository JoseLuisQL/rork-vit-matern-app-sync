/** Tarjeta cálida del cuaderno: esquinas amplias, borde crema y sombra suave. */
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { gShadow, gwarm, spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

export function Card({ children, style, onPress, testID }: CardProps): React.ReactElement {
  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[styles.card, style]} testID={testID}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: spacing.md2,
    ...gShadow,
  },
});
