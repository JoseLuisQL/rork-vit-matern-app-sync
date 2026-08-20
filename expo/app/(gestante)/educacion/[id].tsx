/**
 * Lector de artículo educativo: letra grande y cómoda, disponible sin señal.
 * Adaptado con arquitectura responsiva Web (contenedor de lectura centrado).
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpenCheck, ChevronRight, Clock3 } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ARTICLES } from "@/constants/content";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { useApp } from "@/providers/AppProvider";
import { EmptyState } from "@/components/EmptyState";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { SoftCard } from "@/components/gestante/SoftCard";
import { WebContainer } from "@/components/web/WebContainer";

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
        <WebContainer size="reading">
          <GHeader title="Artículo" back />
          <EmptyState icon={BookOpenCheck} title="Artículo no encontrado" />
        </WebContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebContainer size="reading">
        <GHeader title={article.category} back />
      </WebContainer>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="reading">
          <View style={styles.heroWrap}>
            <Illustration
              source={CATEGORY_ILU[article.category] ?? GICON.libro}
              width={112}
              height={112}
            />
          </View>
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaRow}>
            <Clock3 size={14} color={gwarm.inkFaint} />
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
            <BookOpenCheck size={16} color={gwarm.teal} />
            <Text style={styles.readText}>Guardado como leído en tu teléfono</Text>
          </View>

          {next ? (
            <SoftCard
              onPress={() =>
                router.replace({ pathname: "/(gestante)/educacion/[id]", params: { id: next.id } })
              }
              style={styles.nextCard}
            >
              <View style={styles.flex}>
                <Text style={styles.nextLabel}>Siguiente lectura</Text>
                <Text style={styles.nextTitle} numberOfLines={2}>
                  {next.title}
                </Text>
              </View>
              <ChevronRight size={22} color={gwarm.inkFaint} />
            </SoftCard>
          ) : null}
        </WebContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroWrap: {
    alignItems: "center",
    marginBottom: spacing.sm2,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 28,
    lineHeight: 35,
    color: gwarm.ink,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: spacing.sm,
  },
  meta: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.inkFaint,
  },
  body: {
    marginTop: spacing.md2,
    gap: spacing.md,
  },
  paragraph: {
    fontFamily: gfonts.handBody,
    fontSize: 16.5,
    lineHeight: 28,
    color: gwarm.ink,
  },
  readRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: spacing.lg,
    backgroundColor: gwarm.tealSoft,
    borderRadius: 16,
    paddingVertical: spacing.sm2,
    paddingHorizontal: spacing.md,
  },
  readText: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    color: gwarm.teal,
  },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  nextLabel: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: gwarm.terracotta,
  },
  nextTitle: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 24,
    color: gwarm.ink,
    marginTop: 3,
  },
});
