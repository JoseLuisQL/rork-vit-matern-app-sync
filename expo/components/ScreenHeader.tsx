/**
 * Cabecera cálida del cuaderno: título a mano grande sobre el fondo crema
 * (sin barras blancas), botón de volver redondo, acciones a la derecha y
 * espacio para buscador o filtros debajo. Incluye el aviso de conexión.
 */
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { gfonts, gShadow, gwarm, spacing } from "@/constants/theme";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PressableScale } from "@/components/PressableScale";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Subtítulo como componente (p. ej. estado "En línea" del chat). */
  subtitleNode?: React.ReactNode;
  showBack?: boolean;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  subtitleNode,
  showBack = false,
  right,
  children,
}: ScreenHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm2 }]}>
        <View style={styles.row}>
          {showBack ? (
            <PressableScale
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color={gwarm.ink} strokeWidth={2.4} />
            </PressableScale>
          ) : null}
          <View style={styles.titles}>
            <Text style={[styles.title, showBack && styles.titleSm]} numberOfLines={1}>
              {title}
            </Text>
            {subtitleNode ??
              (subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null)}
          </View>
          {right ? <View style={styles.actions}>{right}</View> : null}
        </View>
        {children}
      </View>
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: gwarm.bg,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm2,
    backgroundColor: gwarm.bg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    minHeight: 46,
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
  titles: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 30,
    lineHeight: 37,
    color: gwarm.ink,
  },
  titleSm: {
    fontSize: 25,
    lineHeight: 31,
  },
  subtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
});
