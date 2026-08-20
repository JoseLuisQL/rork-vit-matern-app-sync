/**
 * Lector de artículo educativo: letra grande y cómoda, soporte para fotos,
 * enlaces de interés recomendados por MINSA y disponible sin señal.
 * Adaptado con arquitectura responsiva Web (contenedor de lectura centrado).
 */
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpenCheck, ChevronRight, Clock3, ExternalLink } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { gfonts, gwarm, spacing, withAlpha } from "@/constants/theme";
import { useApp, useArticles } from "@/providers/AppProvider";
import { EmptyState } from "@/components/EmptyState";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { SoftCard } from "@/components/gestante/SoftCard";
import { WebContainer } from "@/components/web/WebContainer";

export default function ArticuloScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { markArticleRead, readArticles } = useApp();
  const articles = useArticles();

  const article = useMemo(() => articles.find((a) => a.id === id) ?? null, [articles, id]);

  const next = useMemo(() => {
    if (!article) return null;
    return (
      articles.find((a) => a.id !== article.id && !readArticles.includes(a.id)) ??
      articles.find((a) => a.id !== article.id) ??
      null
    );
  }, [article, articles, readArticles]);

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

  const handleOpenLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

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
            {article.imageUrl ? (
              <Image
                source={{ uri: article.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
              />
            ) : (
              <Illustration
                source={CATEGORY_ILU[article.category] ?? GICON.libro}
                width={112}
                height={112}
              />
            )}
          </View>
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaRow}>
            <Clock3 size={14} color={gwarm.inkFaint} />
            <Text style={styles.meta}>{article.minutes || 3} min de lectura</Text>
          </View>

          <View style={styles.body}>
            {article.body.map((paragraph, index) => (
              <Text key={`p-${index}`} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>

          {/* Enlaces externos o videos recomendados */}
          {article.links && article.links.length > 0 ? (
            <View style={styles.linksSection}>
              <Text style={styles.linksSectionTitle}>Enlaces y recursos recomendados</Text>
              {article.links.map((link, idx) => (
                <Pressable
                  key={`link-${idx}`}
                  onPress={() => handleOpenLink(link.url)}
                  style={styles.linkCard}
                >
                  <View style={styles.flex}>
                    <Text style={styles.linkLabel}>{link.label}</Text>
                    <Text style={styles.linkUrl} numberOfLines={1}>
                      {link.url}
                    </Text>
                  </View>
                  <ExternalLink size={18} color={gwarm.teal} />
                </Pressable>
              ))}
            </View>
          ) : null}

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
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.border,
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
  linksSection: {
    marginTop: spacing.lg,
    gap: 8,
  },
  linksSectionTitle: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    color: gwarm.ink,
    marginBottom: 4,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  linkLabel: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    color: gwarm.ink,
  },
  linkUrl: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    color: gwarm.teal,
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

