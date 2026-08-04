/**
 * Cabecera clínica minimalista: superficie blanca, borde inferior fino,
 * título jerárquico y acciones. Incluye el indicador de conexión.
 */
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { common, radius, spacing, type } from "@/constants/theme";
import { OfflineBanner } from "@/components/OfflineBanner";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  right,
  children,
}: ScreenHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.row}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <ArrowLeft size={20} color={common.text} />
            </Pressable>
          ) : null}
          <View style={styles.titles}>
            <Text style={showBack ? styles.titleSm : styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
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
    backgroundColor: common.surface,
    borderBottomWidth: 1,
    borderBottomColor: common.border,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm2,
    backgroundColor: common.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: common.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...type.h1,
    color: common.text,
  },
  titleSm: {
    ...type.h3,
    color: common.text,
  },
  subtitle: {
    ...type.bodySm,
    color: common.textSecondary,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
});
