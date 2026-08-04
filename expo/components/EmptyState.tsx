/** Estado vacío del cuaderno: dibujo a crayola (o icono), título a mano y texto de apoyo. */
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { Illustration } from "@/components/gestante/Illustration";

interface EmptyStateProps {
  icon: LucideIcon;
  /** Dibujo a crayola (URL); tiene prioridad sobre el icono. */
  illu?: string;
  title: string;
  text?: string;
}

export function EmptyState({ icon: Icon, illu, title, text }: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {illu ? (
        <Illustration source={illu} width={110} height={110} />
      ) : (
        <View style={styles.iconWrap}>
          <Icon size={26} color={gwarm.inkFaint} strokeWidth={2.2} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 22,
    lineHeight: 28,
    color: gwarm.ink,
    textAlign: "center",
  },
  text: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    lineHeight: 22,
    color: gwarm.inkSoft,
    textAlign: "center",
    maxWidth: 280,
  },
});
