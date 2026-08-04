/** Mensaje de celebración con el sol andino: aparece con un rebote alegre. */
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { Illustration } from "./Illustration";

interface CelebrationProps {
  title: string;
  text?: string;
}

export function Celebration({ title, text }: CelebrationProps): React.ReactElement {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      speed: 10,
      bounciness: 11,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: anim,
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
          ],
        },
      ]}
    >
      <Illustration source={ILU.sol} width={56} height={56} />
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        {text ? <Text style={styles.text}>{text}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    backgroundColor: gwarm.amberSoft,
    borderRadius: 18,
    padding: spacing.sm2,
    paddingHorizontal: spacing.md,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 25,
    color: gwarm.amber,
  },
  text: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
});
