/** Mensajes de la gestante con su obstetra (tiempo casi real, historial offline). */
import React from "react";
import { StyleSheet, View } from "react-native";
import { common, gestanteTheme } from "@/constants/theme";
import { useApp, useMyPatient } from "@/providers/AppProvider";
import { ChatThread } from "@/components/ChatThread";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function ChatGestante(): React.ReactElement {
  const { view } = useApp();
  const patient = useMyPatient();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Mensajes"
        subtitle={`Con tu obstetra de ${view?.center.name ?? "tu centro de salud"}`}
      />
      {patient ? (
        <ChatThread convId={patient.id} accent={gestanteTheme.primary} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
});
