/**
 * Cuadrícula de horarios en filas parejas de 4: todas las casillas del mismo
 * tamaño (la última fila se completa con espacios vacíos, sin estirarse).
 * Libres: blancas con borde fino. Ocupados: apagados y tachados.
 */
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { common, radius, spacing, type } from "@/constants/theme";
import { AGENDA_SLOTS } from "@/constants/labels";
import { PressableScale } from "@/components/PressableScale";

const PER_ROW = 4;

interface SlotGridProps {
  taken: Set<string>;
  selected: string | null;
  onSelect: (slot: string) => void;
  accent: string;
}

export function SlotGrid({ taken, selected, onSelect, accent }: SlotGridProps): React.ReactElement {
  const rows = useMemo(() => {
    const out: (string | null)[][] = [];
    for (let i = 0; i < AGENDA_SLOTS.length; i += PER_ROW) {
      const row: (string | null)[] = AGENDA_SLOTS.slice(i, i + PER_ROW);
      while (row.length < PER_ROW) row.push(null);
      out.push(row);
    }
    return out;
  }, []);

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((slot, colIndex) => {
            if (slot === null) {
              return <View key={`empty-${colIndex}`} style={styles.cell} />;
            }
            const isTaken = taken.has(slot);
            const active = selected === slot;
            return (
              <PressableScale
                key={slot}
                onPress={() => onSelect(slot)}
                disabled={isTaken}
                haptic={!isTaken}
                accessibilityLabel={isTaken ? `${slot} ocupado` : `Horario ${slot}`}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.slot,
                    active
                      ? { backgroundColor: accent, borderColor: accent }
                      : { backgroundColor: common.surface, borderColor: common.border },
                    isTaken && styles.slotTaken,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotText,
                      { color: active ? common.white : isTaken ? common.disabled : common.text },
                      active && styles.slotTextActive,
                      isTaken && styles.slotTextTaken,
                    ]}
                  >
                    {slot}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
  },
  slot: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slotTaken: {
    backgroundColor: common.surfaceAlt,
    borderColor: common.surfaceAlt,
  },
  slotText: {
    ...type.bodyMd,
    fontSize: 14,
  },
  slotTextActive: {
    fontFamily: type.button.fontFamily,
  },
  slotTextTaken: {
    textDecorationLine: "line-through" as const,
  },
});
