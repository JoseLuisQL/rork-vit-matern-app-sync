/**
 * Gestión de usuarios (administración): búsqueda, filtro por rol,
 * activar/desactivar cuentas y creación de nuevos usuarios.
 */
import { useRouter } from "expo-router";
import { Search, UserPlus, Users } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import {
  adminTheme,
  cardBorder,
  common,
  radius,
  roleAccent,
  spacing,
  type,
} from "@/constants/theme";
import { ROLE_LABEL } from "@/constants/labels";
import { ApiError, avatarUri } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { useApp } from "@/providers/AppProvider";
import type { Role, User } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = adminTheme;
const FILTERS: ("todos" | Role)[] = ["todos", "gestante", "obstetra", "admin"];

export default function UsuariosScreen(): React.ReactElement {
  const router = useRouter();
  const { view, user: me, adminSetActive, online } = useApp();
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<"todos" | Role>("todos");
  const [busyDni, setBusyDni] = useState<string | null>(null);

  const users = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (view?.users ?? [])
      .filter((u) => {
        if (filter !== "todos" && u.role !== filter) return false;
        if (q.length === 0) return true;
        return `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.dni.includes(q);
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [view?.users, query, filter]);

  const toggleActive = useCallback(
    async (target: User, value: boolean) => {
      if (!online) {
        Alert.alert("Sin conexión", "Necesitas conexión para cambiar el estado de una cuenta.");
        return;
      }
      const ok = await confirmAction({
        title: value ? "Activar cuenta" : "Desactivar cuenta",
        message: value
          ? `${target.firstName} podrá volver a iniciar sesión.`
          : `${target.firstName} no podrá iniciar sesión y su sesión actual se cerrará.`,
        confirmText: value ? "Activar" : "Desactivar",
        destructive: !value,
      });
      if (!ok) return;
      setBusyDni(target.dni);
      try {
        await adminSetActive(target.dni, value);
      } catch (e) {
        Alert.alert(
          "No se pudo cambiar",
          e instanceof ApiError && e.status === 0
            ? "Sin conexión con el servidor."
            : e instanceof Error
              ? e.message
              : "Error desconocido",
        );
      } finally {
        setBusyDni(null);
      }
    },
    [adminSetActive, online],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Usuarios"
        subtitle={`${view?.users?.length ?? 0} cuentas`}
        right={
          <AppButton
            title="Nuevo"
            onPress={() => router.push("/(admin)/nuevo-usuario")}
            color={accent.primary}
            icon={UserPlus}
            small
          />
        }
      >
        <View style={styles.searchBox}>
          <Search size={17} color={common.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre o DNI"
            placeholderTextColor={common.textTertiary}
            style={styles.searchInput}
            testID="buscar-usuario"
          />
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <PressableScale
                key={f}
                onPress={() => setFilter(f)}
                accessibilityLabel={`Filtro ${f}`}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: accent.primary, borderColor: accent.primary }
                    : { borderColor: common.border, backgroundColor: common.surface },
                ]}
              >
                <Text
                  style={[styles.filterText, { color: active ? common.white : common.textSecondary }]}
                >
                  {f === "todos" ? "Todos" : ROLE_LABEL[f]}
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
        {users.length === 0 ? (
          <EmptyState icon={Users} title="Sin resultados" text="Prueba con otro nombre o filtro." />
        ) : (
          <View style={styles.listCard}>
            {users.map((u, index) => {
              const roleColors = roleAccent(u.role);
              const isMe = u.dni === me?.dni;
              return (
                <View key={u.dni} style={[styles.row, index > 0 && styles.rowBorder]}>
                  <Avatar
                    uri={avatarUri(u.dni, u.avatarVersion)}
                    color={roleColors.primary}
                    background={roleColors.primaryLight}
                    size={42}
                  />
                  <View style={styles.info}>
                    <Text style={[styles.name, !u.active && styles.nameInactive]} numberOfLines={1}>
                      {u.firstName} {u.lastName}
                      {isMe ? " (tú)" : ""}
                    </Text>
                    <Text style={[styles.roleText, { color: roleColors.primary }]}>
                      {ROLE_LABEL[u.role]}
                    </Text>
                  </View>
                  <Switch
                    value={u.active}
                    disabled={isMe || busyDni === u.dni}
                    onValueChange={(v) => void toggleActive(u, v)}
                    trackColor={{ true: accent.primary, false: common.borderStrong }}
                    thumbColor={common.white}
                    testID={`switch-${u.dni}`}
                  />
                </View>
              );
            })}
          </View>
        )}
        <Text style={styles.footerNote}>Crear o desactivar cuentas necesita conexión.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm2,
    height: 44,
    marginTop: spacing.sm,
  },
  searchInput: { flex: 1, ...type.body, color: common.text },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: spacing.sm2,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: { ...type.buttonSm, fontSize: 12 },
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
  nameInactive: { color: common.textTertiary },
  roleText: { ...type.label, fontSize: 13 },
  footerNote: {
    ...type.caption,
    color: common.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm2,
  },
});
