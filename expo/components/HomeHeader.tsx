/**
 * Cabecera de inicio cálida: fecha pequeña a mano, saludo grande manuscrito
 * y la foto de perfil (o icono amable) que lleva al perfil del usuario.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gfonts, gwarm, spacing } from "@/constants/theme";
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
          <Avatar uri={avatarUri} color={accentColor} background={accentBackground} size={50} />
        </PressableScale>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    backgroundColor: gwarm.bg,
  },
  titles: { flex: 1, minWidth: 0 },
  overline: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 30,
    lineHeight: 37,
    color: gwarm.ink,
  },
  subtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.inkSoft,
    marginTop: 1,
  },
});
