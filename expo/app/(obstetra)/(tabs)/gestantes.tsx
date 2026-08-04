/** Gestantes: buscador, filtro por riesgo y filas limpias con punto de semáforo. */
import { useRouter } from "expo-router";
import { ChevronRight, Search, Users } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { cardBorder, common, obstetraTheme, radius, risk, spacing, type } from "@/constants/theme";
import { RISK_WORD } from "@/constants/labels";
import { usePatients } from "@/providers/AppProvider";
import type { RiskLevel } from "@/types";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { RiskDot } from "@/components/Badges";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = obstetraTheme;
const FILTERS: ("todas" | RiskLevel)[] = ["todas", "rojo", "amarillo", "verde"];

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
      <ScreenHeader title="Gestantes" subtitle={`${patients.length} en seguimiento`}>
        <View style={styles.searchBox}>
          <Search size={17} color={common.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre, DNI o comunidad"
            placeholderTextColor={common.textTertiary}
            style={styles.searchInput}
            testID="buscar-gestante"
          />
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f;
            const color = f === "todas" ? accent.primary : risk[f].solid;
            return (
              <PressableScale
                key={f}
                onPress={() => setFilter(f)}
                accessibilityLabel={`Filtro ${f}`}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: common.border, backgroundColor: common.surface },
                ]}
              >
                {f !== "todas" && !active ? <RiskDot level={f} size={9} /> : null}
                <Text
                  style={[styles.filterText, { color: active ? common.white : common.textSecondary }]}
                >
                  {f === "todas" ? "Todas" : RISK_WORD[f]}
                </Text>
              </PressableScale>
            );
          })}
        </View>
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
                <RiskDot level={p.riskLevel} size={14} />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.firstName} {p.lastName}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    Semana {p.weeks} · {p.community}
                  </Text>
                </View>
                <ChevronRight size={18} color={common.textTertiary} />
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
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm2,
    height: 46,
    marginTop: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    color: common.text,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm2,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
  filterText: { ...type.buttonSm, fontSize: 13 },
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
    minHeight: 64,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  info: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...type.bodyMd, fontSize: 16, color: common.text },
  meta: { ...type.bodySm, color: common.textSecondary },
});
