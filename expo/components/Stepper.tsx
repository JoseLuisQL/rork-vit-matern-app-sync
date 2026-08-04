/** Contador − / + del cuaderno para números pequeños (gestas, cesáreas…). */
import { Minus, Plus } from "lucide-react-native";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { gfonts, gwarm } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  accent?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  accent = gwarm.teal,
  style,
  testID,
}: StepperProps): React.ReactElement {
  const canDown = value > min;
  const canUp = value < max;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.row}>
        <PressableScale
          onPress={() => canDown && onChange(value - 1)}
          disabled={!canDown}
          accessibilityLabel={`Restar ${label}`}
          style={[styles.button, !canDown && styles.buttonOff]}
        >
          <Minus size={17} color={canDown ? accent : gwarm.inkFaint} strokeWidth={2.8} />
        </PressableScale>
        <Text style={styles.value}>{value}</Text>
        <PressableScale
          onPress={() => canUp && onChange(value + 1)}
          disabled={!canUp}
          accessibilityLabel={`Sumar ${label}`}
          style={[styles.button, !canUp && styles.buttonOff]}
        >
          <Plus size={17} color={canUp ? accent : gwarm.inkFaint} strokeWidth={2.8} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 5 },
  label: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 15,
    height: 48,
    paddingHorizontal: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOff: { backgroundColor: gwarm.surfaceSoft },
  value: {
    flex: 1,
    textAlign: "center",
    fontFamily: gfonts.hand,
    fontSize: 21,
    lineHeight: 26,
    color: gwarm.ink,
  },
});
