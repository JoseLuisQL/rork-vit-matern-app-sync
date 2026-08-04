/**
 * Envoltura presionable con escala + haptics (micro-interacción del original).
 * El estilo se aplica directamente al nodo presionable (AnimatedPressable):
 * así `flex`, anchos y disposición participan en el layout del padre.
 */
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export function PressableScale({
  onPress,
  onLongPress,
  disabled = false,
  haptic = true,
  style,
  children,
  accessibilityLabel,
  testID,
}: PressableScaleProps): React.ReactElement {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (value: number) => {
      Animated.spring(scale, {
        toValue: value,
        useNativeDriver: Platform.OS !== "web",
        speed: 40,
        bounciness: 5,
      }).start();
    },
    [scale],
  );

  const handlePress = useCallback(() => {
    if (haptic && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  }, [haptic, onPress]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.6 }]}
    >
      {children}
    </AnimatedPressable>
  );
}
