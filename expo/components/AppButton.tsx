/** Botón principal: sólido, suave, contorno o peligro. Zonas táctiles ≥44pt. */
import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { common, radius, semantic, spacing, type, withAlpha } from "@/constants/theme";
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
  /** Botón alto con letra grande (sección gestante). */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppButton({
  title,
  onPress,
  color = "#0C8174",
  variant = "solid",
  icon: Icon,
  loading = false,
  disabled = false,
  small = false,
  large = false,
  style,
  testID,
}: AppButtonProps): React.ReactElement {
  const height = small ? 42 : large ? 58 : 52;
  const textStyle = small ? type.buttonSm : large ? { ...type.button, fontSize: 17 } : type.button;
  const accent = variant === "danger" ? semantic.danger : color;
  const contentColor = variant === "solid" || variant === "danger" ? common.white : accent;

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
            backgroundColor: common.surface,
            borderWidth: 1.5,
            borderColor: accent,
          },
          variant === "soft" && { backgroundColor: withAlpha(accent, 0.1) },
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
    borderRadius: radius.md,
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
