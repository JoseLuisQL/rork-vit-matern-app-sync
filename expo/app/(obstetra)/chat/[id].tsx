/**
 * Hilo de chat de la obstetra con una paciente: en la cabecera se ve si la
 * gestante está en línea, escribiendo o su última conexión (como WhatsApp).
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { gwarm, warmBlue } from "@/constants/theme";
import { avatarUri } from "@/lib/api";
import { usePatient, usePresence } from "@/providers/AppProvider";
import { Avatar } from "@/components/Avatar";
import { ChatThread } from "@/components/ChatThread";
import { PresenceStatus } from "@/components/PresenceStatus";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function ChatThreadObstetra(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const patient = usePatient(id);
  const presence = usePresence(patient?.id);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={patient ? `${patient.firstName} ${patient.lastName.split(" ")[0]}` : "Chat"}
        subtitleNode={
          patient ? (
            <PresenceStatus
              presence={presence}
              accent={warmBlue.main}
              fallback={`Semana ${patient.weeks} · ${patient.community}`}
            />
          ) : undefined
        }
        showBack
        right={
          patient ? (
            <PressableScale
              onPress={() =>
                router.push({ pathname: "/(obstetra)/gestante/[id]", params: { id: patient.id } })
              }
              accessibilityLabel="Ver ficha"
            >
              <Avatar
                uri={avatarUri(patient.dni, patient.avatarVersion)}
                color={warmBlue.main}
                background={warmBlue.soft}
                size={40}
              />
            </PressableScale>
          ) : undefined
        }
      />
      {patient ? (
        <ChatThread
          convId={patient.id}
          accent={warmBlue.main}
          bottomInset
          peerName={patient.firstName}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
});
