/**
 * Ficha clínica de la gestante (vista obstetra): riesgo con factores,
 * salud con hemoglobina corregida, tratamiento, controles y visitas.
 * La corrección por altitud aparece como nota pequeña al pie.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarPlus,
  HousePlus,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { common, obstetraTheme, radius, risk, semantic, spacing, type } from "@/constants/theme";
import { ANEMIA_LABEL } from "@/constants/labels";
import { avatarUri } from "@/lib/api";
import { fechaCompleta, fechaCorta, fechaLarga } from "@/lib/format";
import { useApp, usePatient } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ProgressRing } from "@/components/ProgressRing";
import { RiskBadge, StatusWord } from "@/components/Badges";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";

const accent = obstetraTheme;

function DataItem({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, alert === true && { color: semantic.danger }]}>{value}</Text>
    </View>
  );
}

export default function FichaGestante(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { view, todayKey } = useApp();
  const patient = usePatient(id);

  const supplements = useMemo(
    () => (view?.supplements ?? []).filter((s) => s.patientId === id),
    [view?.supplements, id],
  );
  const todayIntakes = view?.intakes[id ?? ""]?.[todayKey] ?? [];

  const upcoming = useMemo(() => {
    const list = (view?.appointments ?? []).filter(
      (a) =>
        a.patientId === id &&
        a.dateKey >= todayKey &&
        (a.estado === "programada" || a.estado === "confirmada" || a.estado === "solicitud_reprogramacion"),
    );
    return [...list]
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.time.localeCompare(b.time))
      .slice(0, 3);
  }, [view?.appointments, id, todayKey]);

  const past = useMemo(() => {
    const list = (view?.appointments ?? []).filter(
      (a) => a.patientId === id && a.dateKey < todayKey,
    );
    return [...list].sort((a, b) => b.dateKey.localeCompare(a.dateKey)).slice(0, 4);
  }, [view?.appointments, id, todayKey]);

  const visits = useMemo(() => {
    const list = (view?.visits ?? []).filter((v) => v.patientId === id);
    return [...list].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [view?.visits, id]);

  if (!patient || !view) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Ficha" showBack />
        <EmptyState icon={UserRound} title="Paciente no encontrada" />
      </View>
    );
  }

  const riskPalette = risk[patient.riskLevel];
  const anemiaAlert = patient.anemia !== "normal";

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle={`Semana ${patient.weeks} · ${patient.community}`}
        showBack
        right={
          <Avatar
            uri={avatarUri(patient.dni, patient.avatarVersion)}
            color={riskPalette.solid}
            background={riskPalette.light}
            size={40}
          />
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionsRow}>
          <AppButton
            title="Chat"
            onPress={() => router.push({ pathname: "/(obstetra)/chat/[id]", params: { id: patient.id } })}
            color={accent.primary}
            icon={MessageCircle}
            small
            style={styles.flex}
          />
          <AppButton
            title="Cita"
            onPress={() =>
              router.push({
                pathname: "/(obstetra)/programar",
                params: { mode: "cita", patientId: patient.id },
              })
            }
            color={accent.primary}
            variant="soft"
            icon={CalendarPlus}
            small
            style={styles.flex}
          />
          <AppButton
            title="Visita"
            onPress={() =>
              router.push({
                pathname: "/(obstetra)/programar",
                params: { mode: "visita", patientId: patient.id },
              })
            }
            color={accent.primary}
            variant="soft"
            icon={HousePlus}
            small
            style={styles.flex}
          />
        </View>

        <SectionHeader title="Riesgo" />
        <Card style={[styles.riskCard, { borderLeftColor: riskPalette.solid }]}>
          <RiskBadge level={patient.riskLevel} />
          {patient.riskFactors.length === 0 ? (
            <Text style={styles.riskNone}>Sin factores de riesgo identificados.</Text>
          ) : (
            patient.riskFactors.map((factor) => (
              <View key={factor} style={styles.factorRow}>
                <View style={[styles.factorDot, { backgroundColor: riskPalette.solid }]} />
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))
          )}
        </Card>

        <SectionHeader title="Salud" />
        <Card style={styles.dataCard}>
          <View style={styles.hbBlock}>
            <Text style={styles.hbLabel}>Hemoglobina</Text>
            <Text style={[styles.hbValue, anemiaAlert && { color: semantic.danger }]}>
              {patient.hbCorrected} g/dL
            </Text>
            <Text
              style={[
                styles.hbStatus,
                { color: anemiaAlert ? semantic.danger : semantic.success },
              ]}
            >
              {ANEMIA_LABEL[patient.anemia]}
            </Text>
          </View>
          <View style={styles.dataGrid}>
            <DataItem
              label="Presión"
              value={`${patient.bpSys}/${patient.bpDia}`}
              alert={patient.bpSys >= 140 || patient.bpDia >= 90}
            />
            <DataItem label="IMC" value={`${patient.imc}`} />
            <DataItem label="Edad" value={`${patient.age} años`} />
            <DataItem
              label="G · C · A"
              value={`${patient.gestas} · ${patient.cesareas} · ${patient.abortos}`}
            />
            <DataItem label="FUM" value={fechaCorta(patient.fumKey)} />
            <DataItem label="FPP" value={fechaCorta(patient.fppKey)} />
          </View>
          <PressableScale
            onPress={() => Linking.openURL(`tel:${patient.phone.replace(/\s/g, "")}`).catch(() => {})}
            accessibilityLabel={`Llamar a ${patient.firstName}`}
            style={styles.phoneRow}
          >
            <Phone size={15} color={accent.primary} />
            <Text style={[styles.phoneText, { color: accent.primary }]}>
              {patient.phone || "Sin teléfono"}
            </Text>
          </PressableScale>
          <Text style={styles.footNote}>
            Hb medida {patient.hbObserved} g/dL, ajustada por la altitud del centro (
            {view.center.altitudeMsnm} m).
          </Text>
        </Card>

        <SectionHeader title="Tratamiento" />
        <Card style={styles.treatCard}>
          <View style={styles.treatTop}>
            <ProgressRing
              progress={patient.adherence30 / 100}
              color={
                patient.adherence30 >= 75
                  ? semantic.success
                  : patient.adherence30 >= 50
                    ? semantic.warning
                    : semantic.danger
              }
              size={76}
              strokeWidth={7}
            >
              <Text style={styles.treatPct}>{patient.adherence30}%</Text>
            </ProgressRing>
            <View style={styles.flex}>
              <Text style={styles.treatTitle}>Tomas en los últimos 30 días</Text>
              <Text style={styles.treatMeta}>
                Hoy: {supplements.filter((s) => todayIntakes.includes(s.id)).length} de{" "}
                {supplements.length}
                {patient.streak > 1 ? ` · ${patient.streak} días seguidos` : ""}
              </Text>
            </View>
          </View>
          {supplements.map((s) => (
            <View key={s.id} style={styles.suppRow}>
              <View
                style={[
                  styles.suppDot,
                  {
                    backgroundColor: todayIntakes.includes(s.id)
                      ? semantic.success
                      : common.borderStrong,
                  },
                ]}
              />
              <Text style={styles.suppName}>{s.name}</Text>
            </View>
          ))}
          {supplements.length === 0 ? (
            <Text style={styles.treatMeta}>Sin suplementos asignados.</Text>
          ) : null}
        </Card>

        <SectionHeader title="Próximas citas" />
        {upcoming.length === 0 ? (
          <Card>
            <Text style={styles.treatMeta}>Sin citas próximas.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {upcoming.map((appt, index) => (
              <View key={appt.id} style={[styles.apptRow, index > 0 && styles.rowBorder]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.apptTitle} numberOfLines={1}>
                    {appt.motivo}
                  </Text>
                  <Text style={styles.apptMeta}>
                    {fechaLarga(appt.dateKey)} · {appt.time}
                  </Text>
                </View>
                <StatusWord estado={appt.estado} />
              </View>
            ))}
          </Card>
        )}

        {past.length > 0 ? (
          <>
            <SectionHeader title="Historial" />
            <Card style={styles.listCard}>
              {past.map((appt, index) => (
                <View key={appt.id} style={[styles.apptRow, index > 0 && styles.rowBorder]}>
                  <Text style={styles.historyDate}>{fechaCorta(appt.dateKey)}</Text>
                  <Text style={styles.historyMotivo} numberOfLines={1}>
                    {appt.motivo}
                  </Text>
                  <StatusWord estado={appt.estado} />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {visits.length > 0 ? (
          <>
            <SectionHeader title="Visitas a domicilio" />
            {visits.map((visit) => (
              <Card key={visit.id} style={styles.visitCard}>
                <View style={styles.visitTop}>
                  <View style={styles.visitTitleRow}>
                    <HousePlus
                      size={16}
                      color={visit.estado === "realizada" ? semantic.success : semantic.info}
                    />
                    <Text style={styles.apptTitle}>{fechaCompleta(visit.dateKey)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.visitState,
                      { color: visit.estado === "realizada" ? semantic.success : semantic.info },
                    ]}
                  >
                    {visit.estado === "realizada" ? "Realizada" : "Pendiente"}
                  </Text>
                </View>
                <Text style={styles.apptMeta}>{visit.motivo}</Text>
                {visit.resultado ? <Text style={styles.visitResult}>{visit.resultado}</Text> : null}
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm2,
  },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
  riskCard: { gap: spacing.sm, borderLeftWidth: 3 },
  riskNone: { ...type.body, color: common.textSecondary },
  factorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  factorDot: { width: 7, height: 7, borderRadius: radius.pill },
  factorText: { ...type.body, color: common.text, flex: 1 },
  dataCard: { gap: spacing.sm2 },
  hbBlock: { gap: 2 },
  hbLabel: {
    ...type.overline,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.6,
    color: common.textTertiary,
    textTransform: "uppercase" as const,
  },
  hbValue: { ...type.numericMd, color: semantic.success },
  hbStatus: { ...type.bodyMd, fontSize: 14 },
  dataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.sm2,
    borderTopWidth: 1,
    borderTopColor: common.border,
    paddingTop: spacing.sm2,
  },
  dataItem: {
    flexBasis: "33.33%",
    gap: 2,
    paddingRight: spacing.sm,
  },
  dataLabel: {
    ...type.overline,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.6,
    color: common.textTertiary,
    textTransform: "uppercase" as const,
  },
  dataValue: { ...type.bodyMd, fontSize: 15, color: common.text },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
  },
  phoneText: { ...type.bodyMd, fontSize: 15 },
  footNote: { ...type.caption, color: common.textTertiary },
  treatCard: { gap: spacing.sm },
  treatTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  treatPct: { ...type.numericSm, fontSize: 16, color: common.text },
  treatTitle: { ...type.bodyMd, fontSize: 16, color: common.text },
  treatMeta: { ...type.bodySm, color: common.textSecondary, marginTop: 2 },
  suppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 28,
  },
  suppDot: { width: 9, height: 9, borderRadius: radius.pill },
  suppName: { ...type.body, color: common.text, flex: 1 },
  listCard: { paddingVertical: spacing.xs },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 52,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  apptTitle: { ...type.bodyMd, fontSize: 16, color: common.text },
  apptMeta: { ...type.bodySm, color: common.textSecondary },
  historyDate: { ...type.label, fontSize: 13, color: common.textSecondary, width: 52, flexShrink: 0 },
  historyMotivo: { ...type.body, color: common.text, flex: 1, minWidth: 0 },
  visitCard: { gap: 6 },
  visitTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  visitTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, minWidth: 0 },
  visitState: { ...type.label, fontSize: 13, flexShrink: 0 },
  visitResult: {
    ...type.body,
    color: common.textSecondary,
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm2,
  },
});
