/**
 * Conversaciones de la obstetra ("cuaderno") con presencia en vivo: punto
 * verde de "en línea" sobre la foto, "Escribiendo…" animado en la vista
 * previa, no-leídos visibles y emergencias destacadas en rosa.
 */
import { useRouter } from "expo-router";
import { ChevronRight, MessageCircle, Siren } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, semantic, warmBlue } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { avatarUri } from "@/lib/api";
import { tiempoRelativo } from "@/lib/format";
import { useApp, usePatients, useUnreadCount } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Illustration } from "@/components/gestante/Illustration";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TypingDots } from "@/components/TypingDots";

export default function ChatListScreen(): React.ReactElement {
  const router = useRouter();
  const { view } = useApp();
  const patients = usePatients();
  const totalUnread = useUnreadCount();

  const conversations = useMemo(() => {
    const messages = view?.messages ?? [];
    const presence = view?.presence ?? {};
    return patients
      .map((p) => {
        const conv = messages.filter((m) => m.convId === p.id);
        const last = conv.length > 0 ? conv[conv.length - 1] : null;
        const unread = conv.filter((m) => m.sender === "gestante" && !m.readByObstetra).length;
        return { patient: p, last, unread, presence: presence[p.id] ?? null };
      })
      .sort((a, b) => {
        if (!!a.last !== !!b.last) return a.last ? -1 : 1;
        if (a.last && b.last) return b.last.atISO.localeCompare(a.last.atISO);
        return a.patient.firstName.localeCompare(b.patient.firstName);
      });
  }, [patients, view?.messages, view?.presence]);

  const onlineCount = useMemo(
    () => conversations.filter((c) => c.presence?.online === true).length,
    [conversations],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Chat"
        subtitle={
          totalUnread > 0
            ? `${totalUnread} ${totalUnread === 1 ? "mensaje sin leer" : "mensajes sin leer"}`
            : onlineCount > 0
              ? `${onlineCount} ${onlineCount === 1 ? "paciente en línea" : "pacientes en línea"}`
              : "Conversaciones con tus pacientes"
        }
        right={<Illustration source={ILU.chatVivo} width={58} height={46} />}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          <EmptyState icon={MessageCircle} illu={ILU.chatVivo} title="Sin conversaciones" />
        ) : (
          <View style={styles.listCard}>
            {conversations.map(({ patient, last, unread, presence }, index) => {
              const urgent = last?.kind === "emergencia" || last?.kind === "alarma";
              return (
                <PressableScale
                  key={patient.id}
                  onPress={() =>
                    router.push({ pathname: "/(obstetra)/chat/[id]", params: { id: patient.id } })
                  }
                  accessibilityLabel={`Chat con ${patient.firstName}`}
                  style={[styles.row, index > 0 && styles.rowBorder]}
                  testID={`conv-${patient.id}`}
                >
                  <View style={styles.avatarWrap}>
                    <Avatar
                      uri={avatarUri(patient.dni, patient.avatarVersion)}
                      color={risk[patient.riskLevel].solid}
                      background={risk[patient.riskLevel].light}
                      size={46}
                    />
                    {presence?.online === true ? <View style={styles.onlineDot} /> : null}
                  </View>
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[styles.name, unread > 0 && styles.nameUnread]}
                        numberOfLines={1}
                      >
                        {patient.firstName} {patient.lastName.split(" ")[0]}
                      </Text>
                      {last ? <Text style={styles.time}>{tiempoRelativo(last.atISO)}</Text> : null}
                    </View>
                    {presence?.typing === true ? (
                      <View style={styles.previewRow}>
                        <TypingDots color={warmBlue.main} size={5} />
                        <Text style={[styles.preview, styles.typingText]} numberOfLines={1}>
                          Escribiendo…
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.previewRow}>
                        {urgent ? <Siren size={13} color={gwarm.rose} /> : null}
                        <Text
                          style={[
                            styles.preview,
                            urgent && { color: gwarm.rose },
                            unread > 0 && styles.previewUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {last
                            ? `${last.sender === "obstetra" ? "Tú: " : ""}${last.text}`
                            : "Iniciar conversación"}
                        </Text>
                      </View>
                    )}
                  </View>
                  {unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread}</Text>
                    </View>
                  ) : (
                    <ChevronRight size={16} color={gwarm.inkFaint} />
                  )}
                </PressableScale>
              );
            })}
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
    paddingVertical: 12,
    minHeight: 70,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: gwarm.border },
  avatarWrap: { position: "relative" },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: semantic.success,
    borderWidth: 2.5,
    borderColor: gwarm.surface,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
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
  nameUnread: {
    fontFamily: gfonts.hand,
    fontSize: 17,
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
  typingText: { color: warmBlue.main },
  unreadBadge: {
    minWidth: 23,
    height: 23,
    borderRadius: 999,
    backgroundColor: gwarm.terracotta,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontFamily: gfonts.hand,
    fontSize: 12.5,
    lineHeight: 16,
    color: "#FFFFFF",
  },
});
