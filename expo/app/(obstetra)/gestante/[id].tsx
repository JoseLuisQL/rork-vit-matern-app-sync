/**
 * Ficha clínica de la gestante (vista obstetra, estilo "cuaderno"): acciones
 * rápidas en fichas ilustradas, riesgo con factores, salud con hemoglobina
 * corregida y botón para actualizar los datos del control, tratamiento,
 * citas y visitas. La corrección por altitud va como nota al pie.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarPlus,
  HousePlus,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, warmBlue } from "@/constants/theme";
import { ANEMIA_LABEL } from "@/constants/labels";
import { ILU } from "@/constants/illustrations";
import { avatarUri } from "@/lib/api";
import { countDoses, dayDoseTotals, timesLabel, timesPerDayOf } from "@/lib/doses";
import { fechaCompleta, fechaCorta, horaAmigable } from "@/lib/format";
import { medIllustration } from "@/lib/medIllustration";
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
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";

const accent = warmBlue;

/** Acción rápida en ficha blanca con icono en círculo suave. */
function ActionTile({
  icon: Icon,
  label,
  color,
  soft,
  onPress,
  testID,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
  soft: string;
  onPress: () => void;
  testID?: string;
}): React.ReactElement {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.tile} testID={testID}>
      <View style={[styles.tileCircle, { backgroundColor: soft }]}>
        <Icon size={19} color={color} strokeWidth={2.4} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

function DataItem({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, alert === true && { color: gwarm.rose }]}>{value}</Text>
    </View>
  );
}

/** Fichita de fecha (día grande + mes) para las listas de citas. */
function DatePill({ dateKey, color, soft }: { dateKey: string; color: string; soft: string }) {
  const [dayNum, mon] = fechaCorta(dateKey).split(" ");
  return (
    <View style={[styles.datePill, { backgroundColor: soft }]}>
      <Text style={[styles.datePillDay, { color }]}>{dayNum}</Text>
      <Text style={[styles.datePillMon, { color }]}>{mon}</Text>
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
  const doseTotals = dayDoseTotals(supplements, todayIntakes, todayKey);

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

  const goUpdate = () =>
    router.push({ pathname: "/(obstetra)/actualizar-datos", params: { id: patient.id } });

  const goMedicamento = (supplementId?: string) =>
    router.push({
      pathname: "/(obstetra)/medicamento",
      params: supplementId
        ? { patientId: patient.id, supplementId }
        : { patientId: patient.id },
    });

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
            size={42}
          />
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PopIn delay={0}>
          <View style={styles.actionsRow}>
            <ActionTile
              icon={MessageCircle}
              label="Chat"
              color={accent.main}
              soft={accent.soft}
              onPress={() =>
                router.push({ pathname: "/(obstetra)/chat/[id]", params: { id: patient.id } })
              }
              testID="accion-chat"
            />
            <ActionTile
              icon={CalendarPlus}
              label="Cita"
              color={gwarm.teal}
              soft={gwarm.tealSoft}
              onPress={() =>
                router.push({
                  pathname: "/(obstetra)/programar",
                  params: { mode: "cita", patientId: patient.id },
                })
              }
            />
            <ActionTile
              icon={HousePlus}
              label="Visita"
              color={gwarm.terracotta}
              soft={gwarm.terracottaSoft}
              onPress={() =>
                router.push({
                  pathname: "/(obstetra)/programar",
                  params: { mode: "visita", patientId: patient.id },
                })
              }
            />
          </View>
        </PopIn>

        <PopIn delay={60}>
          <SectionHeader title="Su riesgo" />
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
        </PopIn>

        <PopIn delay={120}>
          <SectionHeader
            title="Su salud"
            action={{ label: "Actualizar", onPress: goUpdate, color: accent.main }}
          />
          <Card style={styles.dataCard}>
            <View style={styles.hbRow}>
              <View style={styles.hbBlock}>
                <Text style={styles.hbLabel}>Hemoglobina</Text>
                <Text style={[styles.hbValue, { color: anemiaAlert ? gwarm.rose : gwarm.teal }]}>
                  {patient.hbCorrected} g/dL
                </Text>
                <Text
                  style={[
                    styles.hbStatus,
                    { color: anemiaAlert ? gwarm.rose : gwarm.tealDeep },
                  ]}
                >
                  {ANEMIA_LABEL[patient.anemia]}
                </Text>
              </View>
              <Illustration source={ILU.estetoscopio} width={80} height={80} />
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
              <Phone size={16} color={accent.main} />
              <Text style={styles.phoneText}>{patient.phone || "Sin teléfono"}</Text>
            </PressableScale>
            <AppButton
              title="Actualizar datos del control"
              onPress={goUpdate}
              color={accent.main}
              variant="soft"
              icon={Pencil}
              testID="btn-actualizar-datos"
            />
            <Text style={styles.footNote}>
              Hb medida {patient.hbObserved} g/dL, ajustada por la altitud del centro (
              {view.center.altitudeMsnm} m).
            </Text>
          </Card>
        </PopIn>

        <PopIn delay={180}>
          <SectionHeader
            title="Sus pastillas"
            action={{ label: "Asignar", onPress: () => goMedicamento(), color: accent.main }}
          />
          <Card style={styles.treatCard}>
            <View style={styles.treatTop}>
              <ProgressRing
                progress={patient.adherence30 / 100}
                color={
                  patient.adherence30 >= 75
                    ? gwarm.teal
                    : patient.adherence30 >= 50
                      ? gwarm.amber
                      : gwarm.rose
                }
                size={78}
                strokeWidth={8}
              >
                <Text style={styles.treatPct}>{patient.adherence30}%</Text>
              </ProgressRing>
              <View style={styles.flex}>
                <Text style={styles.treatTitle}>Tomas en los últimos 30 días</Text>
                <Text style={styles.treatMeta}>
                  Hoy: {doseTotals.taken} de {doseTotals.total} tomas
                  {patient.streak > 1 ? ` · ${patient.streak} días seguidos` : ""}
                </Text>
              </View>
            </View>
            {supplements.map((s, index) => {
              const times = timesPerDayOf(s);
              const taken = Math.min(countDoses(todayIntakes, s.id), times);
              const done = taken >= times;
              return (
                <PressableScale
                  key={s.id}
                  onPress={() => goMedicamento(s.id)}
                  accessibilityLabel={`Cambiar ${s.name}`}
                  style={[styles.medRow, index > 0 && styles.rowBorder]}
                  testID={`med-${s.id}`}
                >
                  <View
                    style={[
                      styles.medIcon,
                      { backgroundColor: done ? gwarm.tealSoft : gwarm.surfaceSoft },
                    ]}
                  >
                    <Illustration source={medIllustration(s.name)} width={30} height={30} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.medName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.apptMeta} numberOfLines={1}>
                      {s.dose} · {timesLabel(times)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.medBadge,
                      { backgroundColor: done ? gwarm.tealSoft : gwarm.surfaceSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.medBadgeText,
                        { color: done ? gwarm.tealDeep : gwarm.inkSoft },
                      ]}
                    >
                      Hoy {taken}/{times}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
            {supplements.length === 0 ? (
              <Text style={styles.treatMeta}>
                Aún no le asignas medicamentos. Hazlo con el botón de abajo.
              </Text>
            ) : null}
            <AppButton
              title="Asignar medicamento"
              onPress={() => goMedicamento()}
              color={accent.main}
              variant="soft"
              icon={Plus}
              small
              testID="btn-asignar-medicamento"
            />
          </Card>
        </PopIn>

        <PopIn delay={240}>
          <SectionHeader title="Próximas citas" />
          {upcoming.length === 0 ? (
            <Card style={styles.emptyApptCard}>
              <Text style={styles.treatMeta}>Sin citas próximas.</Text>
              <AppButton
                title="Programar cita"
                onPress={() =>
                  router.push({
                    pathname: "/(obstetra)/programar",
                    params: { mode: "cita", patientId: patient.id },
                  })
                }
                color={accent.main}
                variant="outline"
                icon={CalendarPlus}
                small
              />
            </Card>
          ) : (
            <Card style={styles.listCard}>
              {upcoming.map((appt, index) => (
                <View key={appt.id} style={[styles.apptRow, index > 0 && styles.rowBorder]}>
                  <DatePill dateKey={appt.dateKey} color={accent.deep} soft={accent.soft} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.apptTitle} numberOfLines={1}>
                      {appt.motivo}
                    </Text>
                    <Text style={styles.apptMeta} numberOfLines={1}>
                      A las {horaAmigable(appt.time)}
                    </Text>
                  </View>
                  <StatusWord estado={appt.estado} />
                </View>
              ))}
            </Card>
          )}
        </PopIn>

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
                      color={visit.estado === "realizada" ? gwarm.teal : accent.main}
                    />
                    <Text style={styles.apptTitle}>{fechaCompleta(visit.dateKey)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.visitState,
                      { color: visit.estado === "realizada" ? gwarm.teal : accent.main },
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
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  actionsRow: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingVertical: 12,
    ...gShadow,
  },
  tileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    lineHeight: 20,
    color: gwarm.ink,
  },
  riskCard: { gap: 8, borderLeftWidth: 4 },
  riskNone: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    lineHeight: 22,
    color: gwarm.inkSoft,
  },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  factorDot: { width: 7, height: 7, borderRadius: 999 },
  factorText: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    lineHeight: 22,
    color: gwarm.ink,
    flex: 1,
  },
  dataCard: { gap: 12 },
  hbRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  hbBlock: { gap: 1, flex: 1, minWidth: 0 },
  hbLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
  hbValue: {
    fontFamily: gfonts.hand,
    fontSize: 30,
    lineHeight: 37,
  },
  hbStatus: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
  },
  dataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    paddingTop: 12,
  },
  dataItem: {
    flexBasis: "33.33%",
    gap: 1,
    paddingRight: 8,
  },
  dataLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkFaint,
  },
  dataValue: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
  },
  phoneText: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    lineHeight: 21,
    color: accent.main,
  },
  footNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkFaint,
  },
  treatCard: { gap: 8 },
  treatTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
  },
  treatPct: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.ink,
  },
  treatTitle: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 22,
    color: gwarm.ink,
  },
  treatMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    minHeight: 54,
  },
  medIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  medName: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  medBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  medBadgeText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    lineHeight: 17,
  },
  emptyApptCard: { gap: 10, alignItems: "flex-start" },
  listCard: { paddingVertical: 6 },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  rowInfo: { flex: 1, minWidth: 0, gap: 1 },
  datePill: {
    width: 46,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 6,
    flexShrink: 0,
  },
  datePillDay: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 22,
  },
  datePillMon: {
    fontFamily: gfonts.handBody,
    fontSize: 11.5,
    lineHeight: 15,
  },
  apptTitle: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  apptMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  historyDate: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 18,
    color: gwarm.inkSoft,
    width: 54,
    flexShrink: 0,
  },
  historyMotivo: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.ink,
    flex: 1,
    minWidth: 0,
  },
  visitCard: { gap: 6 },
  visitTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  visitTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, minWidth: 0 },
  visitState: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    flexShrink: 0,
  },
  visitResult: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.inkSoft,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 14,
    padding: 12,
  },
});
