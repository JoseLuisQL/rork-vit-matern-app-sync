/** Tarjeta cálida de la sección gestante: esquinas amplias y sombra suave. */
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { gShadow, gwarm, spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

interface SoftCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

export function SoftCard({ children, style, onPress, testID }: SoftCardProps): React.ReactElement {
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
