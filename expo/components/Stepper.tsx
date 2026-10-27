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
      <View style={styles.labelRow}>
        <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.countPill, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
          <Text style={[styles.countPillText, { color: accent }]}>{value}</Text>
        </View>
      </View>
      <View style={[styles.row, compact && styles.rowCompact]}>
        <PressableScale
          onPress={() => canDown && onChange(value - 1)}
          disabled={!canDown}
          hitSlop={8}
          accessibilityLabel={`Restar ${label}`}
          style={[styles.button, compact && styles.buttonCompact, !canDown && styles.buttonOff]}
        >
          <Minus size={compact ? 14 : 16} color={canDown ? accent : gwarm.inkFaint} strokeWidth={2.8} />
        </PressableScale>
        <View style={styles.valueWrap}>
          <Text
            style={[styles.value, compact && styles.valueCompact, { color: accent }]}
            numberOfLines={1}
          >
            {String(value)}
          </Text>
        </View>
        <PressableScale
          onPress={() => canUp && onChange(value + 1)}
          disabled={!canUp}
          hitSlop={8}
          accessibilityLabel={`Sumar ${label}`}
          style={[styles.button, compact && styles.buttonCompact, !canUp && styles.buttonOff]}
        >
          <Plus size={compact ? 14 : 16} color={canUp ? accent : gwarm.inkFaint} strokeWidth={2.8} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  label: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.ink,
    textAlign: "center",
  },
  labelCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  countPill: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countPillText: {
    fontFamily: gfonts.hand,
    fontSize: 13,
    lineHeight: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 15,
    height: 48,
    paddingHorizontal: 4,
  },
  rowCompact: {
    height: 42,
    paddingHorizontal: 4,
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
    width: 30,
    height: 30,
    borderRadius: 9,
  },
  buttonOff: { backgroundColor: gwarm.surfaceSoft },
  valueWrap: {
    flex: 1,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    textAlign: "center",
    fontFamily: gfonts.hand,
    fontSize: 21,
    lineHeight: 26,
    color: gwarm.ink,
    fontWeight: "700",
  },
  valueCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
});
