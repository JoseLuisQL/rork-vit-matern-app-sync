/**
 * Selector horizontal de días con altura FIJA y letra a mano: los días
 * flotan sin recuadro; el seleccionado se rellena con el acento y "hoy"
 * se distingue por su ficha de color suave.
 */
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, spacing, gwarm } from "@/constants/theme";
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
                    ? { backgroundColor: accent }
                    : isToday
                      ? { backgroundColor: accentLight }
                      : null,
                ]}
              >
                <Text
                  style={[
                    styles.dow,
                    { color: active ? "#FFFFFF" : isToday ? accent : gwarm.inkFaint },
                  ]}
                >
                  {isToday ? "Hoy" : DOW[d.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.num,
                    { color: active ? "#FFFFFF" : isToday ? accent : gwarm.ink },
                  ]}
                >
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
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    width: 56,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  dow: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
  },
  num: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 25,
  },
});
