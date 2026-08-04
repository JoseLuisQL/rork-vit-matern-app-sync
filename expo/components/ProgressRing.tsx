/** Anillo de progreso animado (adherencia al tratamiento). */
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { common } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0–1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 92,
  strokeWidth = 9,
  color,
  trackColor = common.surfaceAlt,
  children,
}: ProgressRingProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(1, progress));
  const animated = useRef(new Animated.Value(0)).current;
  const [dashOffset, setDashOffset] = useState<number>(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const id = animated.addListener(({ value }) => {
      setDashOffset(circumference * (1 - value));
    });
    Animated.timing(animated, {
      toValue: clamped,
      duration: 900,
      useNativeDriver: false,
    }).start();
    return () => animated.removeListener(id);
  }, [clamped, animated, circumference]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
