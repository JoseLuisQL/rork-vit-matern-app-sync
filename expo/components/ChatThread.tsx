/**
 * Hilo de chat cálido (obstetra ↔ gestante) en tiempo casi real, con el
 * mismo estilo "cuaderno" de toda la app: burbujas redondas con letra a
 * mano, separadores de día y avisos de emergencia como notas suaves.
 * Los mensajes escritos sin señal se muestran con relojito y se envían
 * solos al reconectar.
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
import { gfonts, gShadow, gwarm, spacing } from "@/constants/theme";
import {
  addDaysToKey,
  capitalize,
  dayKey,
  fechaLarga,
  horaDeISO,
  todayKeyLocal,
} from "@/lib/format";
import { useApp } from "@/providers/AppProvider";
import type { Message } from "@/types";
import { PressableScale } from "@/components/PressableScale";

/** Colores de hora y palomitas sobre la burbuja de acento. */
const onAccent = {
  time: "rgba(255,255,255,0.85)",
  tick: "rgba(255,255,255,0.7)",
  read: "#BDEBFF",
} as const;

interface ChatThreadProps {
  convId: string;
  accent: string;
  /** Padding inferior extra cuando no hay tab bar debajo. */
  bottomInset?: boolean;
}

/** "Hoy" / "Ayer" / "Lunes 3 de agosto" para los separadores del hilo. */
function diaDelMensaje(iso: string): string {
  const key = dayKey(new Date(iso));
  const hoy = todayKeyLocal();
  if (key === hoy) return "Hoy";
  if (key === addDaysToKey(hoy, -1)) return "Ayer";
  return capitalize(fechaLarga(key));
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
  const canSend = draft.trim().length > 0;

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
    ({ item, index }: { item: Message; index: number }) => {
      const own = item.sender === myRole;
      const readByPeer = myRole === "gestante" ? item.readByObstetra : item.readByGestante;
      const older = messages[index + 1];
      const showDay =
        older === undefined || dayKey(new Date(older.atISO)) !== dayKey(new Date(item.atISO));

      let body: React.ReactElement;

      if (item.kind === "emergencia" || item.kind === "alarma") {
        const esEmergencia = item.kind === "emergencia";
        const tinta = esEmergencia ? gwarm.rose : gwarm.amber;
        body = (
          <View style={[styles.note, esEmergencia ? styles.noteRoja : styles.noteAmbar]}>
            <View style={styles.noteHeader}>
              <View style={styles.noteIconCircle}>
                {esEmergencia ? (
                  <Siren size={18} color={tinta} strokeWidth={2.4} />
                ) : (
                  <TriangleAlert size={18} color={tinta} strokeWidth={2.4} />
                )}
              </View>
              <Text style={[styles.noteTitle, { color: tinta }]} numberOfLines={1}>
                {esEmergencia ? "Pidió ayuda urgente" : "Avisó sus síntomas"}
              </Text>
            </View>
            <Text style={styles.noteText}>{item.text}</Text>
            <View style={styles.metaRow}>
              {item.pending === true ? (
                <>
                  <Clock3 size={13} color={gwarm.inkFaint} />
                  <Text style={styles.noteTime}>Se enviará al volver la señal</Text>
                </>
              ) : (
                <Text style={styles.noteTime}>{horaDeISO(item.atISO)}</Text>
              )}
            </View>
          </View>
        );
      } else {
        body = (
          <View
            style={[
              styles.bubble,
              own ? [styles.bubbleOwn, { backgroundColor: accent }] : styles.bubbleOther,
            ]}
          >
            <Text style={[styles.msgText, own && styles.msgTextOwn]}>{item.text}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.msgTime, own && styles.msgTimeOwn]}>
                {item.pending === true ? "esperando señal" : horaDeISO(item.atISO)}
              </Text>
              {own ? (
                item.pending === true ? (
                  <Clock3 size={13} color={onAccent.tick} />
                ) : readByPeer ? (
                  <CheckCheck size={15} color={onAccent.read} />
                ) : (
                  <Check size={15} color={onAccent.tick} />
                )
              ) : null}
            </View>
          </View>
        );
      }

      return (
        <View>
          {showDay ? (
            <View style={styles.dayRow}>
              <Text style={styles.dayChip}>{diaDelMensaje(item.atISO)}</Text>
            </View>
          ) : null}
          {body}
        </View>
      );
    },
    [myRole, accent, messages],
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
          placeholderTextColor={gwarm.inkFaint}
          style={styles.input}
          multiline
          maxLength={500}
          testID="chat-input"
        />
        <PressableScale
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel="Enviar mensaje"
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? accent : gwarm.borderStrong },
          ]}
          testID="chat-send"
        >
          <Send size={20} color="#FFFFFF" />
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
    gap: spacing.sm2,
  },
  dayRow: {
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.sm2,
  },
  dayChip: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 3,
    overflow: "hidden" as const,
  },
  bubble: {
    maxWidth: "84%",
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...gShadow,
  },
  bubbleOwn: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 8,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderBottomLeftRadius: 8,
  },
  msgText: {
    fontFamily: gfonts.handBody,
    fontSize: 16.5,
    lineHeight: 24,
    color: gwarm.ink,
  },
  msgTextOwn: { color: "#FFFFFF" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  msgTime: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkFaint,
  },
  msgTimeOwn: { color: onAccent.time },
  note: {
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: 6,
    ...gShadow,
  },
  noteRoja: {
    backgroundColor: gwarm.redSoft,
    borderColor: gwarm.redMid,
  },
  noteAmbar: {
    backgroundColor: gwarm.amberSoft,
    borderColor: gwarm.amberMid,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  noteIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  noteTitle: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 23,
    flex: 1,
  },
  noteText: {
    fontFamily: gfonts.handBody,
    fontSize: 16,
    lineHeight: 24,
    color: gwarm.ink,
  },
  noteTime: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    lineHeight: 16,
    color: gwarm.inkFaint,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.sm,
    backgroundColor: gwarm.bg,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
  },
  input: {
    flex: 1,
    fontFamily: gfonts.handBody,
    fontSize: 16.5,
    color: gwarm.ink,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    maxHeight: 120,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    ...gShadow,
  },
});
