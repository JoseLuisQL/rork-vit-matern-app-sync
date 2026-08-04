/**
 * Casilla gigante de un toque (pastillas, síntomas): toda la ficha es táctil,
 * el círculo hace "pop" al marcarse y el teléfono vibra suavecito. Cuando hay
 * un icono o un dibujo, se muestra dentro del círculo para reconocer la
 * opción sin leer.
 */
import * as Haptics from "expo-haptics";
import { Check, type LucideIcon } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";
import { Illustration } from "@/components/gestante/Illustration";

interface BigCheckRowProps {
  checked: boolean;
  label: string;
  sublabel?: string;
  onToggle: () => void;
  /** Acento al marcar (teal por defecto). */
  color?: string;
  /** Fondo de la ficha al marcar. */
  softColor?: string;
  /** Icono ilustrativo mostrado cuando aún no está marcada. */
  icon?: LucideIcon;
  /** Dibujo (URL) mostrado dentro del círculo cuando aún no está marcada. */
  illustration?: string;
  testID?: string;
}

export function BigCheckRow({
  checked,
  label,
  sublabel,
  onToggle,
  color = gwarm.teal,
  softColor = gwarm.tealSoft,
  icon: Icon,
  illustration,
  testID,
}: BigCheckRowProps): React.ReactElement {
  const pop = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const isFirst = useRef<boolean>(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (checked) {
      pop.setValue(0.2);
      Animated.spring(pop, {
        toValue: 1,
        useNativeDriver: Platform.OS !== "web",
        speed: 22,
        bounciness: 14,
      }).start();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      Animated.timing(pop, {
        toValue: 0,
        duration: 120,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [checked, pop]);

  return (
    <PressableScale
      onPress={onToggle}
      haptic={false}
      accessibilityLabel={`${checked ? "Desmarcar" : "Marcar"} ${label}`}
      style={[
        styles.row,
        checked && { backgroundColor: softColor, borderColor: "transparent" },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.circle,
          checked
            ? { backgroundColor: color, borderColor: color }
            : Icon || illustration
              ? { backgroundColor: softColor, borderColor: "transparent" }
              : { borderColor: gwarm.borderStrong },
        ]}
      >
        {checked ? (
          <Animated.View style={{ transform: [{ scale: pop }], opacity: pop }}>
            <Check size={28} color="#FFFFFF" strokeWidth={3} />
          </Animated.View>
        ) : Icon ? (
          <Icon size={24} color={color} strokeWidth={2.2} />
        ) : illustration ? (
          <Illustration source={illustration} width={36} height={36} />
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surface,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.sm2,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  label: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 26,
    color: gwarm.ink,
  },
  sublabel: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
});
