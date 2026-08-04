/**
 * Cabecera cálida de la sección gestante: título grande sobre el fondo crema
 * (sin barras blancas), botón de volver redondo y aviso de conexión integrado.
 */
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gfonts, gShadow, gwarm, spacing } from "@/constants/theme";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PressableScale } from "@/components/PressableScale";

interface GHeaderProps {
  title: string;
  subtitle?: string;
  /** Subtítulo como componente (p. ej. estado "En línea" del chat). */
  subtitleNode?: React.ReactNode;
  back?: boolean;
  right?: React.ReactNode;
}

export function GHeader({
  title,
  subtitle,
  subtitleNode,
  back = false,
  right,
}: GHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View>
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm2 }]}>
        {back ? (
          <PressableScale
            onPress={() => router.back()}
            accessibilityLabel="Volver"
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={gwarm.ink} strokeWidth={2.4} />
          </PressableScale>
        ) : null}
        <View style={styles.titles}>
          <Text style={[styles.title, back && styles.titleSm]} numberOfLines={1}>
            {title}
          </Text>
          {subtitleNode ??
            (subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null)}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm2,
    backgroundColor: gwarm.bg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
    ...gShadow,
  },
  titles: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 30,
    lineHeight: 37,
    color: gwarm.ink,
  },
  titleSm: { fontSize: 26, lineHeight: 32 },
  subtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
    marginTop: 1,
  },
  right: { flexShrink: 0 },
});
