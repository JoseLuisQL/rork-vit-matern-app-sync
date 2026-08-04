/**
 * Hilo de chat clínico (gestante ↔ obstetra) en tiempo casi real.
 * Los mensajes escritos sin señal se muestran con reloj "pendiente" y se
 * envían solos al reconectar. Emergencias y signos de alarma destacados.
 */
import { Check, CheckCheck, Clock3, Send, Siren, TriangleAlert } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatColors, common, radius, semantic, spacing, type } from "@/constants/theme";
import { horaDeISO } from "@/lib/format";
import { useApp } from "@/providers/AppProvider";
import type { Message } from "@/types";
import { PressableScale } from "@/components/PressableScale";

interface ChatThreadProps {
  convId: string;
  accent: string;
  /** Padding inferior extra cuando no hay tab bar debajo. */
  bottomInset?: boolean;
}

export function ChatThread({
  convId,
  accent,
  bottomInset = false,
}: ChatThreadProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { view, user, dispatch } = useApp();
  const [draft, setDraft] = useState<string>("");
  const myRole = user?.role === "obstetra" ? "obstetra" : "gestante";

  const messages = useMemo(() => {
    const list = (view?.messages ?? []).filter((m) => m.convId === convId);
    return [...list].sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());
  }, [view?.messages, convId]);

  const unreadIncoming = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.sender !== myRole && (myRole === "gestante" ? !m.readByGestante : !m.readByObstetra),
      ).length,
    [messages, myRole],
  );

  useEffect(() => {
    if (unreadIncoming > 0) {
      dispatch({ type: "mark_read", convId });
    }
  }, [unreadIncoming, convId, dispatch]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (text.length === 0) return;
    dispatch({ type: "send_message", convId, text });
    setDraft("");
  }, [draft, convId, dispatch]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const own = item.sender === myRole;
      const readByPeer = myRole === "gestante" ? item.readByObstetra : item.readByGestante;

      if (item.kind === "emergencia" || item.kind === "alarma") {
        const Icon = item.kind === "emergencia" ? Siren : TriangleAlert;
        return (
          <View style={[styles.emergencyCard, own ? styles.rowEnd : styles.rowStart]}>
            <View style={styles.emergencyHeader}>
              <Icon size={15} color={semantic.danger} />
              <Text style={styles.emergencyTitle}>
                {item.kind === "emergencia" ? "Alerta de emergencia" : "Signos de alarma"}
              </Text>
            </View>
            <Text style={styles.emergencyText}>{item.text}</Text>
            <View style={styles.metaRow}>
              {item.pending === true ? (
                <>
                  <Clock3 size={12} color={common.textTertiary} />
                  <Text style={styles.emergencyTime}>Se enviará al reconectar</Text>
                </>
              ) : (
                <Text style={styles.emergencyTime}>{horaDeISO(item.atISO)}</Text>
              )}
            </View>
          </View>
        );
      }

      return (
        <View
          style={[
            styles.bubble,
            own ? [styles.bubbleOwn, { backgroundColor: accent }] : styles.bubbleOther,
          ]}
        >
          <Text style={[styles.msgText, { color: own ? common.white : common.text }]}>
            {item.text}
          </Text>
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.msgTime,
                { color: own ? chatColors.timeOnBubble : common.textTertiary },
              ]}
            >
              {item.pending === true ? "pendiente" : horaDeISO(item.atISO)}
            </Text>
            {own ? (
              item.pending === true ? (
                <Clock3 size={12} color={chatColors.tickOnBubble} />
              ) : readByPeer ? (
                <CheckCheck size={13} color={chatColors.readReceipt} />
              ) : (
                <Check size={13} color={chatColors.tickOnBubble} />
              )
            ) : null}
          </View>
        </View>
      );
    },
    [myRole, accent],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        testID="chat-thread"
      />
      <View
        style={[
          styles.inputBar,
          bottomInset && { paddingBottom: Math.max(insets.bottom, spacing.sm2) },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={common.textTertiary}
          style={styles.input}
          multiline
          maxLength={500}
          testID="chat-input"
        />
        <PressableScale
          onPress={handleSend}
          disabled={draft.trim().length === 0}
          accessibilityLabel="Enviar mensaje"
          style={[styles.sendButton, { backgroundColor: accent }]}
          testID="chat-send"
        >
          <Send size={18} color={common.white} />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.sm,
  },
  bubbleOwn: {
    alignSelf: "flex-end",
    borderBottomRightRadius: radius.xs,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: common.surface,
    borderWidth: 1,
    borderColor: common.border,
    borderBottomLeftRadius: radius.xs,
  },
  msgText: {
    ...type.body,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  msgTime: {
    ...type.caption,
    fontSize: 11,
  },
  emergencyCard: {
    maxWidth: "88%",
    backgroundColor: semantic.dangerLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.dangerMid,
    padding: spacing.sm2,
    gap: 4,
  },
  rowEnd: { alignSelf: "flex-end" },
  rowStart: { alignSelf: "flex-start" },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emergencyTitle: {
    ...type.label,
    color: semantic.danger,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
    fontSize: 11,
  },
  emergencyText: {
    ...type.body,
    color: common.text,
  },
  emergencyTime: {
    ...type.caption,
    fontSize: 11,
    color: common.textTertiary,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    backgroundColor: common.surface,
    borderTopWidth: 1,
    borderTopColor: common.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    ...type.body,
    color: common.text,
    backgroundColor: common.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm2,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    maxHeight: 110,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
