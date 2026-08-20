/**
 * Gestantes ("cuaderno"): buscador cálido, filtro segmentado por riesgo,
 * filas limpias con foto y el registro de nuevas gestantes desde "Nueva".
 * Adaptado con arquitectura responsiva Web (rejilla adaptable en escritorio).
 */
import { useRouter } from "expo-router";
import { ChevronRight, Search, UserRoundPlus, Users } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, warmBlue } from "@/constants/theme";
import { ANEMIA_LABEL, RISK_WORD } from "@/constants/labels";
import { GICON } from "@/constants/illustrations";
import { useResponsive } from "@/hooks/useResponsive";
import { avatarUri } from "@/lib/api";
import { usePatients } from "@/providers/AppProvider";
import type { RiskLevel } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Segmented } from "@/components/Segmented";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmBlue;

export default function GestantesScreen(): React.ReactElement {
  const router = useRouter();
  const patients = usePatients();
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<"todas" | RiskLevel>("todas");
  const { isDesktop, isTablet } = useResponsive();

  const isWide = isDesktop || isTablet;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const score = { rojo: 0, amarillo: 1, verde: 2 } as const;
    return patients
      .filter((p) => {
        if (filter !== "todas" && p.riskLevel !== filter) return false;
        if (q.length === 0) return true;
        return (
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.dni.includes(q) ||
          p.community.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => score[a.riskLevel] - score[b.riskLevel] || b.weeks - a.weeks);
  }, [patients, query, filter]);

  return (
    <View style={styles.container}>
      <WebContainer size="dashboard">
        <ScreenHeader
          title="Gestantes"
          subtitle={`${patients.length} en seguimiento`}
          right={
            <AppButton
              title="Nueva gestante"
              onPress={() => router.push("/(obstetra)/nueva-gestante")}
              color={accent.main}
              icon={UserRoundPlus}
              small
              testID="btn-nueva-gestante"
            />
          }
        >
          <View style={styles.searchBox}>
            <Search size={17} color={gwarm.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre, DNI o comunidad"
              placeholderTextColor={gwarm.inkFaint}
              style={styles.searchInput}
              testID="buscar-gestante"
            />
          </View>
          <Segmented
            options={[
              { key: "todas", label: "Todas" },
              { key: "rojo", label: RISK_WORD.rojo, dot: risk.rojo.solid },
              { key: "amarillo", label: RISK_WORD.amarillo, dot: risk.amarillo.solid },
              { key: "verde", label: RISK_WORD.verde, dot: risk.verde.solid },
            ]}
            value={filter}
            onChange={(k) => setFilter(k as "todas" | RiskLevel)}
            style={styles.segmented}
          />
        </ScreenHeader>
      </WebContainer>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WebContainer size="dashboard">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              illu={GICON.gestantes}
              title="Sin resultados"
              text="Prueba con otro nombre o quita el filtro."
            />
          ) : isWide ? (
            <View style={styles.desktopGrid}>
              {filtered.map((p) => {
                const riskPalette = risk[p.riskLevel];
                return (
                  <PressableScale
                    key={p.id}
                    onPress={() =>
                      router.push({
                        pathname: "/(obstetra)/gestante/[id]",
                        params: { id: p.id },
                      })
                    }
                    accessibilityLabel={`Ficha de ${p.firstName} ${p.lastName}`}
                    style={[styles.desktopCard, { borderLeftColor: riskPalette.solid }]}
                    testID={`gestante-${p.id}`}
                  >
                    <View style={styles.desktopCardTop}>
                      <Avatar
                        uri={avatarUri(p.dni, p.avatarVersion)}
                        color={riskPalette.solid}
                        background={riskPalette.light}
                        size={48}
                      />
                      <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>
                          {p.firstName} {p.lastName}
                        </Text>
                        <Text style={styles.meta} numberOfLines={1}>
                          DNI {p.dni} · {p.community}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.riskBadgeDesktop,
                          { backgroundColor: riskPalette.light },
                        ]}
                      >
                        <View
                          style={[
                            styles.riskDotDesktop,
                            { backgroundColor: riskPalette.solid },
                          ]}
                        />
                        <Text
                          style={[
                            styles.riskTextDesktop,
                            { color: riskPalette.solid },
                          ]}
                        >
                          {RISK_WORD[p.riskLevel]}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.desktopCardStats}>
                      <View style={styles.desktopStatItem}>
                        <Text style={styles.statLabel}>Gestación</Text>
                        <Text style={styles.statValue}>Semana {p.weeks}</Text>
                      </View>
                      <View style={styles.desktopStatItem}>
                        <Text style={styles.statLabel}>Hemoglobina</Text>
                        <Text
                          style={[
                            styles.statValue,
                            p.anemia !== "normal" && { color: gwarm.rose },
                          ]}
                        >
                          {p.hbCorrected} g/dL
                        </Text>
                      </View>
                      <View style={styles.desktopStatItem}>
                        <Text style={styles.statLabel}>Adherencia</Text>
                        <Text style={styles.statValue}>{p.adherence30}%</Text>
                      </View>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          ) : (
            <View style={styles.listCard}>
              {filtered.map((p, index) => (
                <PressableScale
                  key={p.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(obstetra)/gestante/[id]",
                      params: { id: p.id },
                    })
                  }
                  accessibilityLabel={`Ficha de ${p.firstName} ${p.lastName}`}
                  style={[styles.row, index > 0 && styles.rowBorder]}
                  testID={`gestante-${p.id}`}
                >
                  <Avatar
                    uri={avatarUri(p.dni, p.avatarVersion)}
                    color={risk[p.riskLevel].solid}
                    background={risk[p.riskLevel].light}
                    size={40}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      Semana {p.weeks} · {p.community}
                    </Text>
                  </View>
                  <Text style={[styles.riskWord, { color: risk[p.riskLevel].solid }]}>
                    {RISK_WORD[p.riskLevel]}
                  </Text>
                  <ChevronRight size={16} color={gwarm.inkFaint} />
                </PressableScale>
              ))}
            </View>
          )}
        </WebContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 17,
    paddingHorizontal: 13,
    height: 46,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    color: gwarm.ink,
  },
  segmented: { marginTop: 8 },
  listCard: {
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingHorizontal: 15,
    ...gShadow,
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  desktopCard: {
    flexBasis: "48.5%",
    flexGrow: 1,
    minWidth: 320,
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderLeftWidth: 4,
    padding: 16,
    gap: 12,
    ...gShadow,
  },
  desktopCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  riskBadgeDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  riskDotDesktop: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskTextDesktop: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
  },
  desktopCardStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: gwarm.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  desktopStatItem: {
    gap: 2,
  },
  statLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 11.5,
    color: gwarm.inkFaint,
  },
  statValue: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    color: gwarm.ink,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    minHeight: 64,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  info: { flex: 1, minWidth: 0, gap: 1 },
  name: {
    fontFamily: gfonts.handBody,
    fontSize: 16,
    lineHeight: 22,
    color: gwarm.ink,
  },
  meta: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  riskWord: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    flexShrink: 0,
  },
});
