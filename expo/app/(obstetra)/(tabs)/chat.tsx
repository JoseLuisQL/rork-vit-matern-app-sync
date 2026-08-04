/** Conversaciones de la obstetra ("cuaderno"): no-leídos, último mensaje y emergencias destacadas. */
import { useRouter } from "expo-router";
import { ChevronRight, MessageCircle, Siren } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, warmBlue } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { avatarUri } from "@/lib/api";
import { tiempoRelativo } from "@/lib/format";
import { useApp, usePatients } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = warmBlue;

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
          <EmptyState icon={MessageCircle} illu={ILU.chat} title="Sin conversaciones" />
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
                  size={44}
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
                      <Siren size={13} color={gwarm.rose} />
                    ) : null}
                    <Text
                      style={[
                        styles.preview,
                        (last?.kind === "emergencia" || last?.kind === "alarma") && {
                          color: gwarm.rose,
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
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unread}</Text>
                  </View>
                ) : (
                  <ChevronRight size={16} color={gwarm.inkFaint} />
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
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontFamily: gfonts.handBody,
    fontSize: 16,
    lineHeight: 22,
    color: gwarm.ink,
    flex: 1,
  },
  time: {
    fontFamily: gfonts.handBody,
    fontSize: 11.5,
    lineHeight: 15,
    color: gwarm.inkFaint,
  },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  preview: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.inkSoft,
    flex: 1,
  },
  previewUnread: { color: gwarm.ink },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: accent.main,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontFamily: gfonts.hand,
    fontSize: 12,
    lineHeight: 15,
    color: "#FFFFFF",
  },
});
