/**
 * Gestión de usuarios (administración, estilo "cuaderno"): búsqueda cálida,
 * filtro por rol, activar/desactivar cuentas y creación de nuevos usuarios.
 * Adaptado con arquitectura responsiva Web (rejilla de usuarios en escritorio).
 */
import { useRouter } from "expo-router";
import { Search, UserPlus, Users } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { gfonts, gShadow, gwarm, warmAccent, warmPlum } from "@/constants/theme";
import { ROLE_LABEL } from "@/constants/labels";
import { GICON } from "@/constants/illustrations";
import { useResponsive } from "@/hooks/useResponsive";
import { ApiError, avatarUri } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { useApp } from "@/providers/AppProvider";
import type { Role, User } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { WebContainer } from "@/components/web/WebContainer";

const accent = warmPlum;
const FILTERS: ("todos" | Role)[] = ["todos", "gestante", "obstetra", "admin"];

export default function UsuariosScreen(): React.ReactElement {
  const router = useRouter();
  const { view, user: me, adminSetActive, online } = useApp();
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<"todos" | Role>("todos");
  const [busyDni, setBusyDni] = useState<string | null>(null);
  const { isDesktop, isTablet } = useResponsive();

  const isWide = isDesktop || isTablet;

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
      <WebContainer size="dashboard">
        <ScreenHeader
          title="Usuarios"
          subtitle={`${view?.users?.length ?? 0} cuentas`}
          right={
            <AppButton
              title="Nuevo usuario"
              onPress={() => router.push("/(admin)/nuevo-usuario")}
              color={accent.main}
              icon={UserPlus}
              small
            />
          }
        >
          <View style={styles.searchBox}>
            <Search size={17} color={gwarm.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre o DNI"
              placeholderTextColor={gwarm.inkFaint}
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
                      ? { backgroundColor: accent.main, borderColor: accent.main }
                      : { borderColor: gwarm.border, backgroundColor: gwarm.surface },
                  ]}
                >
                  <Text
                    style={[styles.filterText, { color: active ? "#FFFFFF" : gwarm.inkSoft }]}
                  >
                    {f === "todos" ? "Todos" : ROLE_LABEL[f]}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </ScreenHeader>
      </WebContainer>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WebContainer size="dashboard">
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              illu={GICON.usuarios}
              title="Sin resultados"
              text="Prueba con otro nombre o filtro."
            />
          ) : isWide ? (
            <View style={styles.desktopGrid}>
              {users.map((u) => {
                const roleColors = warmAccent(u.role);
                const isMe = u.dni === me?.dni;
                return (
                  <View
                    key={u.dni}
                    style={[
                      styles.desktopUserCard,
                      !u.active && styles.desktopUserCardInactive,
                    ]}
                  >
                    <Avatar
                      uri={avatarUri(u.dni, u.avatarVersion)}
                      color={roleColors.main}
                      background={roleColors.soft}
                      size={50}
                    />
                    <View style={styles.info}>
                      <Text
                        style={[styles.name, !u.active && styles.nameInactive]}
                        numberOfLines={1}
                      >
                        {u.firstName} {u.lastName}
                        {isMe ? " (tú)" : ""}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={[styles.roleBadge, { color: roleColors.main, backgroundColor: roleColors.soft }]}>
                          {ROLE_LABEL[u.role]}
                        </Text>
                        <Text style={styles.dniText}>DNI {u.dni}</Text>
                        {u.phone ? <Text style={styles.dniText}>· Tel: {u.phone}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.switchWrap}>
                      <Text style={[styles.switchLabel, { color: u.active ? gwarm.tealDeep : gwarm.inkFaint }]}>
                        {u.active ? "Activo" : "Inactivo"}
                      </Text>
                      <Switch
                        value={u.active}
                        disabled={isMe || busyDni === u.dni}
                        onValueChange={(v) => void toggleActive(u, v)}
                        trackColor={{ true: accent.main, false: gwarm.borderStrong }}
                        thumbColor="#FFFFFF"
                        testID={`switch-${u.dni}`}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.listCard}>
              {users.map((u, index) => {
                const roleColors = warmAccent(u.role);
                const isMe = u.dni === me?.dni;
                return (
                  <View key={u.dni} style={[styles.row, index > 0 && styles.rowBorder]}>
                    <Avatar
                      uri={avatarUri(u.dni, u.avatarVersion)}
                      color={roleColors.main}
                      background={roleColors.soft}
                      size={44}
                    />
                    <View style={styles.info}>
                      <Text style={[styles.name, !u.active && styles.nameInactive]} numberOfLines={1}>
                        {u.firstName} {u.lastName}
                        {isMe ? " (tú)" : ""}
                      </Text>
                      <Text style={[styles.roleText, { color: roleColors.main }]}>
                        {ROLE_LABEL[u.role]}
                      </Text>
                    </View>
                    <Switch
                      value={u.active}
                      disabled={isMe || busyDni === u.dni}
                      onValueChange={(v) => void toggleActive(u, v)}
                      trackColor={{ true: accent.main, false: gwarm.borderStrong }}
                      thumbColor="#FFFFFF"
                      testID={`switch-${u.dni}`}
                    />
                  </View>
                );
              })}
            </View>
          )}
          <Text style={styles.footerNote}>Crear o desactivar cuentas necesita conexión.</Text>
        </WebContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
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
  filterRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 19,
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  desktopUserCard: {
    flexBasis: "48.5%",
    flexGrow: 1,
    minWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 16,
    ...gShadow,
  },
  desktopUserCardInactive: {
    opacity: 0.7,
    backgroundColor: gwarm.surfaceSoft,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  roleBadge: {
    fontFamily: gfonts.hand,
    fontSize: 12.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  dniText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.inkFaint,
  },
  switchWrap: {
    alignItems: "center",
    gap: 4,
  },
  switchLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 11.5,
  },
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
    minHeight: 66,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  info: { flex: 1, minWidth: 0, gap: 1 },
  name: {
    fontFamily: gfonts.handBody,
    fontSize: 16,
    lineHeight: 22,
    color: gwarm.ink,
  },
  nameInactive: { color: gwarm.inkFaint },
  roleText: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 18,
  },
  footerNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: 12,
  },
});
