/**
 * Cabecera de inicio personalizada: fecha pequeña arriba, saludo grande y
 * la foto de perfil (o icono profesional) que lleva al perfil del usuario.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { common, spacing, type } from "@/constants/theme";
import { Avatar } from "@/components/Avatar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PressableScale } from "@/components/PressableScale";

interface HomeHeaderProps {
  overline: string;
  title: string;
  subtitle?: string;
  avatarUri?: string;
  accentColor: string;
  accentBackground: string;
  onAvatarPress: () => void;
}

export function HomeHeader({
  overline,
  title,
  subtitle,
  avatarUri,
  accentColor,
  accentBackground,
  onAvatarPress,
}: HomeHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm2 }]}>
        <View style={styles.titles}>
          <Text style={styles.overline} numberOfLines={1}>
            {overline}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <PressableScale onPress={onAvatarPress} accessibilityLabel="Mi perfil" testID="btn-perfil">
          <Avatar uri={avatarUri} color={accentColor} background={accentBackground} size={46} />
        </PressableScale>
      </View>
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: common.surface,
    borderBottomWidth: 1,
    borderBottomColor: common.border,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
  },
  titles: { flex: 1, minWidth: 0, gap: 2 },
  overline: {
    ...type.overline,
    color: common.textTertiary,
    textTransform: "uppercase" as const,
  },
  title: { ...type.h1, color: common.text },
  subtitle: { ...type.bodySm, color: common.textSecondary },
});
