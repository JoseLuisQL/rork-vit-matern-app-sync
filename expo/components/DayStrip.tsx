/**
 * Selector horizontal de días con altura FIJA (no se estira en ningún layout).
 * Cada día es una casilla del mismo tamaño: día de semana arriba, número abajo.
 */
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { common, radius, spacing, type } from "@/constants/theme";
import { dateFromKey } from "@/lib/format";
import { PressableScale } from "@/components/PressableScale";

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

interface DayStripProps {
  days: string[];
  selected: string;
  onSelect: (dayKey: string) => void;
  todayKey: string;
  accent: string;
  accentLight: string;
}

export function DayStrip({
  days,
  selected,
  onSelect,
  todayKey,
  accent,
  accentLight,
}: DayStripProps): React.ReactElement {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {days.map((day) => {
          const active = day === selected;
          const isToday = day === todayKey;
          const d = dateFromKey(day);
          return (
            <PressableScale
              key={day}
              onPress={() => onSelect(day)}
              accessibilityLabel={`Día ${DOW[d.getDay()]} ${d.getDate()}`}
            >
              <View
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: accent, borderColor: accent }
                    : { backgroundColor: common.surface, borderColor: common.border },
                  !active && isToday && { borderColor: accent, backgroundColor: accentLight },
                ]}
              >
                <Text
                  style={[
                    styles.dow,
                    { color: active ? common.white : isToday ? accent : common.textTertiary },
                  ]}
                >
                  {isToday ? "Hoy" : DOW[d.getDay()]}
                </Text>
                <Text style={[styles.num, { color: active ? common.white : common.text }]}>
                  {d.getDate()}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    width: 58,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dow: {
    ...type.label,
    fontSize: 12,
  },
  num: {
    ...type.numericSm,
    fontSize: 19,
  },
});
