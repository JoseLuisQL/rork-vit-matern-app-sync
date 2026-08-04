/** Tarjeta base: superficie blanca con borde fino (diseño clínico minimalista). */
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { cardBorder, common, radius, spacing } from "@/constants/theme";
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
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...cardBorder,
  },
});
