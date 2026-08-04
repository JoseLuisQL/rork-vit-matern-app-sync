/** Mensajes de la gestante con su obstetra (tiempo casi real, historial offline). */
import React from "react";
import { StyleSheet, View } from "react-native";
import { gwarm } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { ChatThread } from "@/components/ChatThread";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";

export default function ChatGestante(): React.ReactElement {
  const { view } = useApp();
  const patient = useMyPatient();

  return (
    <View style={styles.container}>
      <GHeader
        title="Mensajes"
        subtitle={`Con tu obstetra de ${view?.center.name ?? "tu centro de salud"}`}
        right={<Illustration source={ILU.chat} width={54} height={54} />}
      />
      {patient ? <ChatThread convId={patient.id} accent={gwarm.teal} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
});
