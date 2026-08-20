/**
 * Conversaciones de la obstetra ("cuaderno") con presencia en vivo: punto
 * verde de "en línea" sobre la foto, "Escribiendo…" animado en la vista
 * previa, no-leídos visibles y emergencias destacadas en rosa.
 * Adaptado con arquitectura Split-View (Master-Detail) en escritorio Web.
 */
import { useRouter } from "expo-router";
import { ChevronRight, MessageCircle, Phone, Search, Siren, UserRound } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { gfonts, gShadow, gwarm, risk, semantic, warmBlue } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { useResponsive } from "@/hooks/useResponsive";
import { avatarUri } from "@/lib/api";
import { tiempoRelativo } from "@/lib/format";
import { useApp, usePatients, usePresence, useUnreadCount } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";
import { ChatThread } from "@/components/ChatThread";
import { EmptyState } from "@/components/EmptyState";
import { Illustration } from "@/components/gestante/Illustration";
import { PresenceStatus } from "@/components/PresenceStatus";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TypingDots } from "@/components/TypingDots";

export default function ChatListScreen(): React.ReactElement {
  const router = useRouter();
  const { view } = useApp();
  const patients = usePatients();
  const totalUnread = useUnreadCount();
  const { isDesktop } = useResponsive();

  const [query, setQuery] = useState<string>("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

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

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      ({ patient }) =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q) ||
        patient.dni.includes(q) ||
        patient.community.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  // Si no hay seleccionada en escritorio, seleccionamos la primera disponible
  const activePatientId = useMemo(() => {
    if (selectedPatientId && patients.some((p) => p.id === selectedPatientId)) {
      return selectedPatientId;
    }
    return filteredConversations[0]?.patient?.id ?? null;
  }, [selectedPatientId, patients, filteredConversations]);

  const activePatient = useMemo(
    () => patients.find((p) => p.id === activePatientId) ?? null,
    [patients, activePatientId],
  );

  const activePresence = usePresence(activePatient?.id);

  const onlineCount = useMemo(
    () => conversations.filter((c) => c.presence?.online === true).length,
    [conversations],
  );

  const handlePatientClick = (patientId: string) => {
    if (isDesktop) {
      setSelectedPatientId(patientId);
    } else {
      router.push({ pathname: "/(obstetra)/chat/[id]", params: { id: patientId } });
    }
  };

  const renderConversationList = () => (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {filteredConversations.length === 0 ? (
        <EmptyState icon={MessageCircle} illu={ILU.chatVivo} title="Sin conversaciones" />
      ) : (
        <View style={styles.listCard}>
          {filteredConversations.map(({ patient, last, unread, presence }, index) => {
            const urgent = last?.kind === "emergencia" || last?.kind === "alarma";
            const isSelected = isDesktop && patient.id === activePatientId;
            return (
              <PressableScale
                key={patient.id}
                onPress={() => handlePatientClick(patient.id)}
                accessibilityLabel={`Chat con ${patient.firstName}`}
                style={[
                  styles.row,
                  index > 0 && styles.rowBorder,
                  isSelected && styles.rowSelected,
                ]}
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
  );

  // Vista de Escritorio: Split View de 2 Paneles
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Panel Izquierdo: Lista de Chats */}
        <View style={styles.desktopLeftPane}>
          <ScreenHeader
            title="Mensajes"
            subtitle={
              totalUnread > 0
                ? `${totalUnread} sin leer`
                : `${conversations.length} pacientes`
            }
          >
            <View style={styles.searchBox}>
              <Search size={16} color={gwarm.inkFaint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar paciente..."
                placeholderTextColor={gwarm.inkFaint}
                style={styles.searchInput}
              />
            </View>
          </ScreenHeader>
          {renderConversationList()}
        </View>

        {/* Panel Derecho: Hilo de Conversación Seleccionado */}
        <View style={styles.desktopRightPane}>
          {activePatient ? (
            <View style={styles.flex}>
              {/* Cabecera del chat activo */}
              <View style={styles.chatHeader}>
                <PressableScale
                  onPress={() =>
                    router.push({
                      pathname: "/(obstetra)/gestante/[id]",
                      params: { id: activePatient.id },
                    })
                  }
                  style={styles.chatHeaderLeft}
                >
                  <Avatar
                    uri={avatarUri(activePatient.dni, activePatient.avatarVersion)}
                    color={risk[activePatient.riskLevel].solid}
                    background={risk[activePatient.riskLevel].light}
                    size={42}
                  />
                  <View style={styles.chatHeaderInfo}>
                    <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                      {activePatient.firstName} {activePatient.lastName}
                    </Text>
                    <PresenceStatus
                      presence={activePresence}
                      accent={warmBlue.main}
                      fallback={`Semana ${activePatient.weeks} · ${activePatient.community}`}
                    />
                  </View>
                </PressableScale>

                <View style={styles.chatHeaderActions}>
                  {activePatient.phone ? (
                    <PressableScale
                      onPress={() =>
                        Linking.openURL(`tel:${activePatient.phone.replace(/\s/g, "")}`).catch(
                          () => {},
                        )
                      }
                      accessibilityLabel="Llamar"
                      style={styles.headerActionIconBtn}
                    >
                      <Phone size={17} color={warmBlue.deep} />
                    </PressableScale>
                  ) : null}

                  <PressableScale
                    onPress={() =>
                      router.push({
                        pathname: "/(obstetra)/gestante/[id]",
                        params: { id: activePatient.id },
                      })
                    }
                    accessibilityLabel="Ver ficha"
                    style={styles.headerActionFichaBtn}
                  >
                    <UserRound size={16} color={warmBlue.main} />
                    <Text style={styles.headerActionBtnText}>Ver ficha</Text>
                  </PressableScale>
                </View>
              </View>

              {/* Hilo de mensajes */}
              <ChatThread
                convId={activePatient.id}
                accent={warmBlue.main}
                peerName={activePatient.firstName}
              />
            </View>
          ) : (
            <View style={styles.desktopEmptyChat}>
              <Illustration source={ILU.chatVivo} width={160} height={130} />
              <Text style={styles.desktopEmptyTitle}>Tus conversaciones</Text>
              <Text style={styles.desktopEmptySubtitle}>
                Selecciona una paciente a la izquierda para enviar mensajes y ver su estado en vivo.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Vista Móvil estándar
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
      {renderConversationList()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: gwarm.bg,
    height: "100%",
  },
  desktopLeftPane: {
    width: 380,
    borderRightWidth: 1,
    borderRightColor: gwarm.border,
    backgroundColor: gwarm.bg,
    flexDirection: "column",
  },
  desktopRightPane: {
    flex: 1,
    backgroundColor: gwarm.bg,
    flexDirection: "column",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    color: gwarm.ink,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: gwarm.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  chatHeaderInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  chatHeaderTitle: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 25,
    color: gwarm.ink,
  },
  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerActionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionFichaBtn: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: warmBlue.soft,
    borderWidth: 1,
    borderColor: warmBlue.mid,
  },
  headerActionBtnText: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    lineHeight: 18,
    color: warmBlue.deep,
  },
  desktopEmptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  desktopEmptyTitle: {
    fontFamily: gfonts.hand,
    fontSize: 24,
    color: gwarm.ink,
  },
  desktopEmptySubtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    color: gwarm.inkSoft,
    textAlign: "center",
    maxWidth: 360,
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
    paddingVertical: 12,
    minHeight: 70,
    borderRadius: 16,
  },
  rowSelected: {
    backgroundColor: warmBlue.soft,
    marginHorizontal: -8,
    paddingHorizontal: 8,
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
