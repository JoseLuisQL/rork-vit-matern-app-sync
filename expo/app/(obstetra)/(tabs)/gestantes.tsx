/**
 * Gestantes ("cuaderno"): buscador cálido, filtro segmentado por riesgo,
 * filas limpias con foto y el registro de nuevas gestantes desde "Nueva".
 */
import { useRouter } from "expo-router";
import { ChevronRight, Search, UserRoundPlus, Users } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, warmBlue } from "@/constants/theme";
import { RISK_WORD } from "@/constants/labels";
import { GICON } from "@/constants/illustrations";
import { avatarUri } from "@/lib/api";
import { usePatients } from "@/providers/AppProvider";
import type { RiskLevel } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Segmented } from "@/components/Segmented";

const accent = warmBlue;

export default function GestantesScreen(): React.ReactElement {
  const router = useRouter();
  const patients = usePatients();
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<"todas" | RiskLevel>("todas");

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
      <ScreenHeader
        title="Gestantes"
        subtitle={`${patients.length} en seguimiento`}
        right={
          <AppButton
            title="Nueva"
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

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            illu={GICON.gestantes}
            title="Sin resultados"
            text="Prueba con otro nombre o quita el filtro."
          />
        ) : (
          <View style={styles.listCard}>
            {filtered.map((p, index) => (
              <PressableScale
                key={p.id}
                onPress={() =>
                  router.push({ pathname: "/(obstetra)/gestante/[id]", params: { id: p.id } })
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
