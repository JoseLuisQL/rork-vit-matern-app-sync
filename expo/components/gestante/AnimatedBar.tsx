/** Barra de avance que se llena con una animación suave al aparecer. */
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface AnimatedBarProps {
  /** Avance de 0 a 1. */
  progress: number;
  color: string;
  trackColor: string;
  height?: number;
}

export function AnimatedBar({
  progress,
  color,
  trackColor,
  height = 14,
}: AnimatedBarProps): React.ReactElement {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0.045, Math.min(1, progress)),
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, progress]);

  return (
    <View
      style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            borderRadius: height / 2,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden", width: "100%" },
  fill: { height: "100%" },
});
