/** Entrada suave (aparece subiendo) con retardo opcional para efecto escalonado. */
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleProp, ViewStyle } from "react-native";

interface PopInProps {
  delay?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PopIn({ delay = 0, children, style }: PopInProps): React.ReactElement {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: Platform.OS !== "web",
        speed: 14,
        bounciness: 5,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
