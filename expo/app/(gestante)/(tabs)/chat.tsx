/**
 * Mensajes de la gestante con su obstetra: chat en vivo con "En línea",
 * "Escribiendo…" y última conexión en la cabecera, palomitas de visto y
 * historial disponible sin señal.
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import { gwarm } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { useApp, useMyPatient, usePresence } from "@/providers/AppProvider";
import { GChatThread } from "@/components/gestante/GChatThread";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { PresenceStatus } from "@/components/PresenceStatus";

export default function ChatGestante(): React.ReactElement {
  const { view } = useApp();
  const patient = useMyPatient();
  const presence = usePresence("obstetra");

  return (
    <View style={styles.container}>
      <GHeader
        title="Mensajes"
        subtitleNode={
          <PresenceStatus
            presence={presence}
            accent={gwarm.teal}
            fallback={`Con tu obstetra de ${view?.center.name ?? "tu centro de salud"}`}
          />
        }
        right={<Illustration source={ILU.chatVivo} width={62} height={50} />}
      />
      {patient ? <GChatThread convId={patient.id} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
});
