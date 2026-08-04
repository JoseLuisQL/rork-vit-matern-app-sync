/** Lector de artículo educativo (disponible sin señal). */
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpenCheck, ChevronRight, Clock3 } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ARTICLES } from "@/constants/content";
import { common, gestanteTheme, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = gestanteTheme;

export default function ArticuloScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { markArticleRead, readArticles } = useApp();

  const article = useMemo(() => ARTICLES.find((a) => a.id === id) ?? null, [id]);

  const next = useMemo(() => {
    if (!article) return null;
    return (
      ARTICLES.find((a) => a.id !== article.id && !readArticles.includes(a.id)) ??
      ARTICLES.find((a) => a.id !== article.id) ??
      null
    );
  }, [article, readArticles]);

  useEffect(() => {
    if (!article) return;
    const timer = setTimeout(() => markArticleRead(article.id), 1200);
    return () => clearTimeout(timer);
  }, [article, markArticleRead]);

  if (!article) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Artículo" showBack />
        <EmptyState icon={BookOpenCheck} title="Artículo no encontrado" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={article.category} showBack />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{article.title}</Text>
        <View style={styles.metaRow}>
          <Clock3 size={13} color={common.textTertiary} />
          <Text style={styles.meta}>{article.minutes} min de lectura</Text>
        </View>

        <View style={styles.body}>
          {article.body.map((paragraph, index) => (
            <Text key={`p-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.readRow}>
          <BookOpenCheck size={15} color={accent.primary} />
          <Text style={[styles.readText, { color: accent.primary }]}>
            Guardado como leído en tu teléfono
          </Text>
        </View>

        {next ? (
          <Card
            onPress={() =>
              router.replace({ pathname: "/(gestante)/educacion/[id]", params: { id: next.id } })
            }
            style={styles.nextCard}
          >
            <View style={styles.flex}>
              <Text style={[styles.nextLabel, { color: accent.primary }]}>SIGUIENTE LECTURA</Text>
              <Text style={styles.nextTitle} numberOfLines={2}>
                {next.title}
              </Text>
            </View>
            <ChevronRight size={18} color={common.textTertiary} />
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: { ...type.h1, color: common.text },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
  },
  meta: { ...type.caption, color: common.textTertiary },
  body: {
    marginTop: spacing.md2,
    gap: spacing.md,
  },
  paragraph: { ...type.bodyLg, color: common.text },
  readRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.lg,
    backgroundColor: accent.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm2,
  },
  readText: { ...type.label },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    marginTop: spacing.md,
  },
  nextLabel: { ...type.overline },
  nextTitle: { ...type.h4, color: common.text, marginTop: 2 },
});
