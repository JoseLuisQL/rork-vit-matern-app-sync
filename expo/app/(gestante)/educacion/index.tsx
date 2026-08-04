/** Consejos para el embarazo: lista simple de lecturas, disponible sin señal. */
import { useRouter } from "expo-router";
import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ARTICLES } from "@/constants/content";
import { common, gestanteTheme, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";

const accent = gestanteTheme;

export default function EducacionGestante(): React.ReactElement {
  const router = useRouter();
  const { readArticles } = useApp();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Consejos" subtitle="Puedes leerlos aunque no tengas señal" showBack />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {ARTICLES.map((article) => {
          const read = readArticles.includes(article.id);
          return (
            <Card
              key={article.id}
              onPress={() =>
                router.push({ pathname: "/(gestante)/educacion/[id]", params: { id: article.id } })
              }
              style={styles.card}
              testID={`article-${article.id}`}
            >
              <View style={[styles.icon, { backgroundColor: accent.primaryLight }]}>
                {read ? (
                  <CheckCircle2 size={22} color={accent.primary} />
                ) : (
                  <BookOpen size={22} color={accent.primary} />
                )}
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>{article.title}</Text>
                <Text style={styles.meta}>
                  {article.minutes} min de lectura{read ? " · Ya lo leíste" : ""}
                </Text>
              </View>
              <ChevronRight size={20} color={common.textTertiary} />
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: common.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    padding: spacing.md2,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.bodyXlMd, color: common.text },
  meta: { ...type.body, color: common.textSecondary, marginTop: 2 },
});
