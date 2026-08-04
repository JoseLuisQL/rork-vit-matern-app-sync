/**
 * Indicadores clínicos ligeros: estado de cita en una palabra con color,
 * punto de semáforo y tipo de alerta. Sin cápsulas recargadas.
 */
import {
  CalendarClock,
  CalendarX,
  Droplets,
  Pill,
  Siren,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, radius, risk, semantic, type } from "@/constants/theme";
import { ALERT_LABEL, RISK_LABEL, STATUS_LABEL } from "@/constants/labels";
import type { AlertType, AppointmentStatus, RiskLevel } from "@/types";

export const STATUS_COLOR: Record<AppointmentStatus, string> = {
  programada: semantic.info,
  confirmada: semantic.success,
  asistida: semantic.success,
  no_asistida: semantic.danger,
  solicitud_reprogramacion: semantic.warning,
};

/** Estado de cita: punto de color + una palabra. `hand` usa letra manuscrita (gestante). */
export function StatusWord({
  estado,
  hand = false,
}: {
  estado: AppointmentStatus;
  hand?: boolean;
}): React.ReactElement {
  const color = STATUS_COLOR[estado];
  return (
    <View style={styles.wordRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.wordText, hand && styles.wordTextHand, { color }]} numberOfLines={1}>
        {STATUS_LABEL[estado]}
      </Text>
    </View>
  );
}

/** Punto del semáforo de riesgo. */
export function RiskDot({ level, size = 12 }: { level: RiskLevel; size?: number }): React.ReactElement {
  return (
    <View
      accessibilityLabel={RISK_LABEL[level]}
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: risk[level].solid,
      }}
    />
  );
}

/** Semáforo con texto (para la ficha clínica). */
export function RiskBadge({ level }: { level: RiskLevel }): React.ReactElement {
  const palette = risk[level];
  return (
    <View style={[styles.chip, { backgroundColor: palette.light, borderColor: palette.mid }]}>
      <View style={[styles.dot, { backgroundColor: palette.solid }]} />
      <Text style={[styles.chipText, { color: palette.solid }]} numberOfLines={1}>
        {RISK_LABEL[level]}
      </Text>
    </View>
  );
}

export const ALERT_META: Record<AlertType, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  emergencia: { icon: Siren, color: semantic.danger, bg: semantic.dangerLight, border: semantic.dangerMid },
  alarma: { icon: TriangleAlert, color: semantic.danger, bg: semantic.dangerLight, border: semantic.dangerMid },
  inasistencia: { icon: CalendarX, color: semantic.warning, bg: semantic.warningLight, border: semantic.warningMid },
  adherencia: { icon: Pill, color: semantic.warning, bg: semantic.warningLight, border: semantic.warningMid },
  anemia: { icon: Droplets, color: semantic.danger, bg: semantic.dangerLight, border: semantic.dangerMid },
  sin_control: { icon: CalendarClock, color: semantic.warning, bg: semantic.warningLight, border: semantic.warningMid },
};

/** Tipo de alerta: icono + palabra, sin cápsula. */
export function AlertTypeWord({ alertType }: { alertType: AlertType }): React.ReactElement {
  const meta = ALERT_META[alertType];
  const Icon = meta.icon;
  return (
    <View style={styles.wordRow}>
      <Icon size={14} color={meta.color} />
      <Text style={[styles.wordText, { color: meta.color }]} numberOfLines={1}>
        {ALERT_LABEL[alertType]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  wordText: {
    ...type.label,
    fontSize: 13,
    lineHeight: 18,
  },
  wordTextHand: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    letterSpacing: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  chipText: {
    ...type.label,
    fontSize: 13,
  },
});
