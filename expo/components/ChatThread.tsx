/**
 * Hilo de chat cálido (obstetra ↔ gestante) con funciones en vivo estilo
 * WhatsApp: palomitas de enviado ✓ / recibido ✓✓ / visto ✓✓ en color,
 * burbuja "escribiendo…" animada, aviso de teclado al otro lado,
 * separadores de día y avisos de emergencia como notas ilustradas.
 * Los mensajes escritos sin señal se muestran con relojito y se envían
 * solos al reconectar.
 */
import { useFocusEffect } from "expo-router";
import { Check, CheckCheck, Clock3, Send } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ILU } from "@/constants/illustrations";
import { gfonts, gShadow, gwarm, spacing } from "@/constants/theme";
import {
  addDaysToKey,
  capitalize,
  dayKey,
  fechaLarga,
  horaDeISO,
  todayKeyLocal,
} from "@/lib/format";
import { messageLocation } from "@/lib/maps";
import { useApp, usePresence } from "@/providers/AppProvider";
import type { Message } from "@/types";
import { LocationChip, LocationMissing } from "@/components/LocationChip";
import { PressableScale } from "@/components/PressableScale";
import { TypingDots } from "@/components/TypingDots";
import { Illustration } from "@/components/gestante/Illustration";

/** Colores de hora y palomitas sobre la burbuja de acento. */
const onAccent = {
  time: "rgba(255,255,255,0.85)",
  tick: "rgba(255,255,255,0.7)",
  read: "#BDEBFF",
} as const;

/** Tras 3.5 s sin teclear se apaga el "escribiendo…" del otro lado. */
const TYPING_IDLE_MS = 3500;

interface ChatThreadProps {
  convId: string;
  accent: string;
  /** Padding inferior extra cuando no hay tab bar debajo. */
  bottomInset?: boolean;
  /** Nombre corto del interlocutor para la nota de inicio. */
  peerName?: string;
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
  peerName,
}: ChatThreadProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { view, user, dispatch, setChatPresence } = useApp();
  const [draft, setDraft] = useState<string>("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myRole = user?.role === "obstetra" ? "obstetra" : "gestante";
  const presence = usePresence(myRole === "gestante" ? "obstetra" : convId);
  const canSend = draft.trim().length > 0;

  // Con la pantalla abierta se avisa qué conversación se está viendo
  // (sincronización rápida + no llegan notificaciones de este chat).
  useFocusEffect(
    useCallback(() => {
      setChatPresence(convId, false);
      return () => {
        if (typingTimer.current) clearTimeout(typingTimer.current);
        setChatPresence(null, false);
      };
    }, [convId, setChatPresence]),
  );

  const messages = useMemo(() => {
    const list = (view?.messages ?? []).filter((m) => m.convId === convId);
    return [...list].sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());
  }, [view?.messages, convId]);

  /** Alertas visibles: dan la ubicación a avisos antiguos sin coordenadas. */
  const alerts = view?.alerts;

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

  /** Cada tecla avisa "escribiendo…"; se apaga sola al dejar de teclear. */
  const handleChangeText = useCallback(
    (text: string) => {
      setDraft(text);
      setChatPresence(convId, text.trim().length > 0);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setChatPresence(convId, false), TYPING_IDLE_MS);
    },
    [convId, setChatPresence],
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (text.length === 0) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setChatPresence(convId, false);
    dispatch({ type: "send_message", convId, text });
    setDraft("");
  }, [draft, convId, dispatch, setChatPresence]);

  /** Palomitas: reloj (en cola), ✓ enviado, ✓✓ recibido, ✓✓ celeste = visto. */
  const renderTicks = useCallback(
    (item: Message) => {
      if (item.pending === true) return <Clock3 size={13} color={onAccent.tick} />;
      const readByPeer = myRole === "gestante" ? item.readByObstetra : item.readByGestante;
      if (readByPeer) return <CheckCheck size={15} color={onAccent.read} />;
      const delivered =
        presence?.lastSeenISO != null && presence.lastSeenISO >= item.atISO;
      return delivered ? (
        <CheckCheck size={15} color={onAccent.tick} />
      ) : (
        <Check size={15} color={onAccent.tick} />
      );
    },
    [myRole, presence?.lastSeenISO],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const own = item.sender === myRole;
      const older = messages[index + 1];
      const showDay =
        older === undefined || dayKey(new Date(older.atISO)) !== dayKey(new Date(item.atISO));

      let body: React.ReactElement;

      if (item.kind === "emergencia" || item.kind === "alarma") {
        const esEmergencia = item.kind === "emergencia";
        const tinta = esEmergencia ? gwarm.rose : gwarm.amber;
        const loc = messageLocation(item, alerts);
        const esPropio = own;
        body = (
          <View style={[styles.note, esEmergencia ? styles.noteRoja : styles.noteAmbar]}>
            <View style={styles.noteHeader}>
              <Illustration
                source={esEmergencia ? ILU.sos : ILU.sintomas}
                width={46}
                height={46}
              />
              <Text style={[styles.noteTitle, { color: tinta }]} numberOfLines={2}>
                {esPropio
                  ? esEmergencia
                    ? "Pediste ayuda urgente"
                    : "Avisaste tus síntomas"
                  : esEmergencia
                    ? "Pidió ayuda urgente"
                    : "Avisó sus síntomas"}
              </Text>
            </View>
            <Text style={styles.noteText}>{item.text}</Text>
            {loc ? (
              <LocationChip
                lat={loc.lat}
                lng={loc.lng}
                label={
                  peerName
                    ? `${esEmergencia ? "SOS" : "Aviso"} de ${peerName} · VitMaterna`
                    : "Ubicación del aviso · VitMaterna"
                }
                title="Ver ubicación GPS"
                color={tinta}
                testID={`gps-${item.id}`}
              />
            ) : esEmergencia ? (
              <LocationMissing />
            ) : null}
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
              {own ? renderTicks(item) : null}
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
    [myRole, accent, messages, renderTicks, alerts, peerName],
  );

  /** Burbuja "escribiendo…" en vivo (lista invertida: header = abajo). */
  const typingBubble =
    presence?.typing === true ? (
      <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
        <TypingDots color={accent} size={8} />
      </View>
    ) : null;

  /** Nota de inicio de conversación (lista invertida: footer = arriba). */
  const introCard = (
    <View style={styles.introCard}>
      <Illustration source={ILU.chatVivo} width={116} height={92} />
      <Text style={styles.introTitle}>
        {peerName ? `Chat directo con ${peerName}` : "Chat directo"}
      </Text>
      <Text style={styles.introText}>
        Tu mensaje llega a su teléfono con aviso. Aquí ves cuándo está en línea
        y cuándo lo leyó.
      </Text>
      <View style={styles.legendRow}>
        <Check size={14} color={gwarm.inkFaint} />
        <Text style={styles.legendText}>enviado</Text>
        <CheckCheck size={14} color={gwarm.inkFaint} />
        <Text style={styles.legendText}>recibido</Text>
        <CheckCheck size={14} color={accent} />
        <Text style={[styles.legendText, { color: accent }]}>visto</Text>
      </View>
    </View>
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
        ListHeaderComponent={typingBubble}
        ListFooterComponent={introCard}
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
          onChangeText={handleChangeText}
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
  introCard: {
    alignItems: "center",
    gap: 6,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 22,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm2,
  },
  introTitle: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 25,
    color: gwarm.ink,
    textAlign: "center",
  },
  introText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.inkSoft,
    textAlign: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  legendText: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
    marginRight: 6,
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
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: spacing.xs,
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
