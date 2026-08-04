/** Conversaciones de la obstetra: no-leídos, último mensaje y emergencias destacadas. */
import { useRouter } from "expo-router";
import { ChevronRight, MessageCircle, Siren } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { cardBorder, common, obstetraTheme, radius, risk, semantic, spacing, type } from "@/constants/theme";
import { avatarUri } from "@/lib/api";
import { tiempoRelativo } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = obstetraTheme;

export default function ChatListScreen(): React.ReactElement {
  const router = useRouter();
  const { view } = useApp();
  const patients = usePatients();

  const conversations = useMemo(() => {
    const messages = view?.messages ?? [];
    return patients
      .map((p) => {
        const conv = messages.filter((m) => m.convId === p.id);
        const last = conv.length > 0 ? conv[conv.length - 1] : null;
        const unread = conv.filter((m) => m.sender === "gestante" && !m.readByObstetra).length;
        return { patient: p, last, unread };
      })
      .sort((a, b) => {
        if (!!a.last !== !!b.last) return a.last ? -1 : 1;
        if (a.last && b.last) return b.last.atISO.localeCompare(a.last.atISO);
        return a.patient.firstName.localeCompare(b.patient.firstName);
      });
  }, [patients, view?.messages]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Chat" subtitle="Conversaciones con tus pacientes" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Sin conversaciones" />
        ) : (
          <View style={styles.listCard}>
            {conversations.map(({ patient, last, unread }, index) => (
              <PressableScale
                key={patient.id}
                onPress={() =>
                  router.push({ pathname: "/(obstetra)/chat/[id]", params: { id: patient.id } })
                }
                accessibilityLabel={`Chat con ${patient.firstName}`}
                style={[styles.row, index > 0 && styles.rowBorder]}
                testID={`conv-${patient.id}`}
              >
                <Avatar
                  uri={avatarUri(patient.dni, patient.avatarVersion)}
                  color={risk[patient.riskLevel].solid}
                  background={risk[patient.riskLevel].light}
                  size={46}
                />
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {patient.firstName} {patient.lastName.split(" ")[0]}
                    </Text>
                    {last ? <Text style={styles.time}>{tiempoRelativo(last.atISO)}</Text> : null}
                  </View>
                  <View style={styles.previewRow}>
                    {last?.kind === "emergencia" || last?.kind === "alarma" ? (
                      <Siren size={13} color={semantic.danger} />
                    ) : null}
                    <Text
                      style={[
                        styles.preview,
                        (last?.kind === "emergencia" || last?.kind === "alarma") && {
                          color: semantic.danger,
                        },
                        unread > 0 && styles.previewUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {last
                        ? `${last.sender === "obstetra" ? "Tú: " : ""}${last.text}`
                        : "Iniciar conversación"}
                    </Text>
                  </View>
                </View>
                {unread > 0 ? (
                  <View style={[styles.unreadBadge, { backgroundColor: accent.primary }]}>
                    <Text style={styles.unreadText}>{unread}</Text>
                  </View>
                ) : (
                  <ChevronRight size={16} color={common.textTertiary} />
                )}
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
  content: { padding: spacing.md, paddingBottom: spacing.xl },
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
    minHeight: 68,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: common.border },
  info: { flex: 1, gap: 2 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: { ...type.bodyMd, color: common.text, flex: 1 },
  time: { ...type.caption, color: common.textTertiary },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  preview: { ...type.bodySm, color: common.textSecondary, flex: 1 },
  previewUnread: { color: common.text, fontFamily: type.bodyMd.fontFamily },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { ...type.label, fontSize: 11, color: common.white },
});
