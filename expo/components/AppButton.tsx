/** Botón principal del cuaderno: letra a mano siempre. Zonas táctiles ≥44pt. */
import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { gfonts, gwarm, semantic, spacing, withAlpha } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  variant?: "solid" | "outline" | "soft" | "danger";
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  /** Botón alto con letra más grande. */
  large?: boolean;
  /** Compatibilidad: la letra manuscrita ya es el estilo por defecto. */
  hand?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppButton({
  title,
  onPress,
  color = gwarm.teal,
  variant = "solid",
  icon: Icon,
  loading = false,
  disabled = false,
  small = false,
  large = false,
  style,
  testID,
}: AppButtonProps): React.ReactElement {
  const height = small ? 42 : large ? 58 : 50;
  const textStyle = {
    fontFamily: gfonts.hand,
    fontSize: small ? 16 : large ? 21 : 18,
    lineHeight: small ? 20 : large ? 26 : 23,
    letterSpacing: 0.3,
  };
  const accent = variant === "danger" ? semantic.danger : color;
  const contentColor = variant === "solid" || variant === "danger" ? "#FFFFFF" : accent;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      accessibilityLabel={title}
      testID={testID}
    >
      <View
        style={[
          styles.base,
          { height },
          (variant === "solid" || variant === "danger") && { backgroundColor: accent },
          variant === "outline" && {
            backgroundColor: gwarm.surface,
            borderWidth: 1.5,
            borderColor: withAlpha(accent, 0.45),
          },
          variant === "soft" && { backgroundColor: withAlpha(accent, 0.11) },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={contentColor} />
        ) : (
          <View style={styles.row}>
            {Icon ? <Icon size={small ? 16 : large ? 21 : 19} color={contentColor} /> : null}
            <Text style={[textStyle, { color: contentColor }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
