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
  compact?: boolean;
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
  compact = false,
  testID,
}: StepperProps): React.ReactElement {
  const canDown = value > min;
  const canUp = value < max;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.row, compact && styles.rowCompact]}>
        <PressableScale
          onPress={() => canDown && onChange(value - 1)}
          disabled={!canDown}
          hitSlop={8}
          accessibilityLabel={`Restar ${label}`}
          style={[styles.button, compact && styles.buttonCompact, !canDown && styles.buttonOff]}
        >
          <Minus size={compact ? 13 : 16} color={canDown ? accent : gwarm.inkFaint} strokeWidth={2.8} />
        </PressableScale>
        <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
          {value}
        </Text>
        <PressableScale
          onPress={() => canUp && onChange(value + 1)}
          disabled={!canUp}
          hitSlop={8}
          accessibilityLabel={`Sumar ${label}`}
          style={[styles.button, compact && styles.buttonCompact, !canUp && styles.buttonOff]}
        >
          <Plus size={compact ? 13 : 16} color={canUp ? accent : gwarm.inkFaint} strokeWidth={2.8} />
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
    textAlign: "center",
  },
  labelCompact: {
    fontSize: 12.5,
    lineHeight: 16,
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
  rowCompact: {
    height: 40,
    paddingHorizontal: 3,
    borderRadius: 12,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonCompact: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  buttonOff: { backgroundColor: gwarm.surfaceSoft },
  value: {
    flex: 1,
    textAlign: "center",
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 25,
    color: gwarm.ink,
    minWidth: 18,
  },
  valueCompact: {
    fontSize: 16,
    lineHeight: 20,
    minWidth: 16,
  },
});
