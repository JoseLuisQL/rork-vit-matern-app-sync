/**
 * Tarjeta de la próxima cita: la fecha como hoja de calendario, la hora en
 * palabras ("9:00 de la mañana") y un solo botón grande "Sí, iré".
 * Compartida entre Inicio y Citas.
 */
import { CalendarHeart, Check, CheckCircle2, Clock3, MapPin } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, gwarm, semantic, spacing } from "@/constants/theme";
import { capitalize, etiquetaRelativa, fechaLarga, horaAmigable } from "@/lib/format";
import type { Appointment } from "@/types";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";
import { BlockTitle } from "./BlockTitle";
import { SoftCard } from "./SoftCard";

const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
] as const;

interface CitaProximaProps {
  appt: Appointment;
  todayKey: string;
  onConfirm: () => void;
  onReschedule: () => void;
}

export function CitaProxima({
  appt,
  todayKey,
  onConfirm,
  onReschedule,
}: CitaProximaProps): React.ReactElement {
  const day = parseInt(appt.dateKey.slice(8, 10), 10);
  const month = MONTHS_SHORT[parseInt(appt.dateKey.slice(5, 7), 10) - 1] ?? "";

  return (
    <SoftCard style={styles.card}>
      <BlockTitle
        icon={CalendarHeart}
        title="Mi próxima cita"
        color={gwarm.teal}
        soft={gwarm.tealSoft}
      />
      <View style={styles.mainRow}>
        <View style={styles.dateLeaf}>
          <Text style={styles.leafMonth}>{month}</Text>
          <Text style={styles.leafDay}>{day}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.when}>{etiquetaRelativa(appt.dateKey, todayKey)}</Text>
          <Text style={styles.date}>{capitalize(fechaLarga(appt.dateKey))}</Text>
          <View style={styles.timeRow}>
            <Clock3 size={16} color={gwarm.terracotta} />
            <Text style={styles.time}>{horaAmigable(appt.time)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.placeRow}>
        <MapPin size={16} color={gwarm.inkFaint} />
        <Text style={styles.placeText} numberOfLines={1}>
          {appt.lugar}
        </Text>
      </View>
      {appt.estado === "programada" ? (
        <>
          <AppButton
            title="Sí, iré"
            onPress={onConfirm}
            color={gwarm.teal}
            large
            icon={Check}
            testID="btn-confirmar-cita"
          />
          <PressableScale
            onPress={onReschedule}
            haptic={false}
            accessibilityLabel="No puedo ese día"
            style={styles.linkWrap}
          >
            <Text style={styles.linkText}>No puedo ese día</Text>
          </PressableScale>
        </>
      ) : appt.estado === "confirmada" ? (
        <View style={styles.confirmedRow}>
          <CheckCircle2 size={22} color={semantic.success} />
          <Text style={styles.confirmedText}>Confirmada. Te esperamos.</Text>
        </View>
      ) : appt.estado === "solicitud_reprogramacion" ? (
        <View style={styles.pendingRow}>
          <Text style={styles.pendingText}>Pediste otra fecha. Tu obstetra te avisará.</Text>
        </View>
      ) : null}
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm2 },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dateLeaf: {
    width: 70,
    height: 78,
    borderRadius: 18,
    backgroundColor: gwarm.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  leafMonth: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: gwarm.tealDeep,
  },
  leafDay: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 36,
    color: gwarm.tealDeep,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  when: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: gwarm.teal,
  },
  date: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    color: gwarm.ink,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  time: {
    fontFamily: fonts.semibold,
    fontSize: 16.5,
    lineHeight: 23,
    color: gwarm.terracotta,
  },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  placeText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: gwarm.inkSoft,
    flex: 1,
  },
  linkWrap: {
    alignSelf: "center",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: gwarm.inkSoft,
    textDecorationLine: "underline",
  },
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: semantic.successLight,
    borderRadius: 16,
    padding: spacing.sm2,
    paddingHorizontal: spacing.md,
  },
  confirmedText: {
    fontFamily: fonts.semibold,
    fontSize: 16.5,
    lineHeight: 22,
    color: semantic.success,
    flex: 1,
  },
  pendingRow: {
    backgroundColor: gwarm.amberSoft,
    borderRadius: 16,
    padding: spacing.sm2,
    paddingHorizontal: spacing.md,
  },
  pendingText: {
    fontFamily: fonts.medium,
    fontSize: 15.5,
    lineHeight: 22,
    color: gwarm.amber,
  },
});
