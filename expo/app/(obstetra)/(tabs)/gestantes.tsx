/**
 * Gestantes: buscador, filtro segmentado por riesgo, filas limpias con foto
 * y el registro de nuevas gestantes desde el botón "Nueva".
 */
import { useRouter } from "expo-router";
import { ChevronRight, Search, UserRoundPlus, Users } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { cardBorder, common, obstetraTheme, radius, risk, spacing, type } from "@/constants/theme";
import { RISK_WORD } from "@/constants/labels";
import { avatarUri } from "@/lib/api";
import { usePatients } from "@/providers/AppProvider";
import type { RiskLevel } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Segmented } from "@/components/Segmented";

const accent = obstetraTheme;

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
            color={accent.primary}
            icon={UserRoundPlus}
            small
            testID="btn-nueva-gestante"
          />
        }
      >
        <View style={styles.searchBox}>
          <Search size={16} color={common.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre, DNI o comunidad"
            placeholderTextColor={common.textTertiary}
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
                  size={38}
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
                <ChevronRight size={16} color={common.textTertiary} />
              </PressableScale>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm2,
    height: 44,
    marginTop: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    color: common.text,
  },
  segmented: { marginTop: spacing.sm },
  listCard: {
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...cardBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingVertical: spacing.sm2,
    minHeight: 62,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  info: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...type.bodyMd, fontSize: 15, color: common.text },
  meta: { ...type.bodySm, color: common.textSecondary },
  riskWord: { ...type.label, fontSize: 12.5, flexShrink: 0 },
});
