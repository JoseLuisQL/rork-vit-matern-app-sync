/**
 * Consejos para el embarazo: cada lectura con su dibujito de color por tema
 * (comida, urgencias, pastillas…), disponibles siempre, incluso sin señal.
 */
import { useRouter } from "expo-router";
import {
  Apple,
  Baby,
  Backpack,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  Pill,
  Siren,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ARTICLES } from "@/constants/content";
import { fonts, gwarm, semantic, spacing } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { useApp } from "@/providers/AppProvider";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { SoftCard } from "@/components/gestante/SoftCard";

const CATEGORY_META: Record<string, { icon: LucideIcon; color: string; soft: string }> = {
  Nutrición: { icon: Apple, color: gwarm.terracotta, soft: gwarm.terracottaSoft },
  Urgencias: { icon: Siren, color: semantic.danger, soft: gwarm.redSoft },
  Tratamiento: { icon: Pill, color: gwarm.teal, soft: gwarm.tealSoft },
  Preparación: { icon: Backpack, color: gwarm.amber, soft: gwarm.amberSoft },
  Posparto: { icon: Baby, color: gwarm.rose, soft: gwarm.roseSoft },
  "Salud mental": { icon: HeartHandshake, color: "#2C6EA8", soft: "#EAF2F9" },
};

export default function EducacionGestante(): React.ReactElement {
  const router = useRouter();
  const { readArticles } = useApp();

  return (
    <View style={styles.container}>
      <GHeader title="Consejos" back />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PopIn delay={0}>
          <View style={styles.heroRow}>
            <Illustration source={ILU.comida} width={86} height={86} />
            <View style={styles.flex}>
              <Text style={styles.heroTitle}>Aprende para ti y tu bebé</Text>
              <Text style={styles.heroText}>Se leen aunque no tengas señal.</Text>
            </View>
          </View>
        </PopIn>

        {ARTICLES.map((article, index) => {
          const read = readArticles.includes(article.id);
          const meta = CATEGORY_META[article.category] ?? {
            icon: BookOpen,
            color: gwarm.teal,
            soft: gwarm.tealSoft,
          };
          const Icon = meta.icon;
          return (
            <PopIn key={article.id} delay={70 + index * 55}>
              <SoftCard
                onPress={() =>
                  router.push({
                    pathname: "/(gestante)/educacion/[id]",
                    params: { id: article.id },
                  })
                }
                style={styles.card}
                testID={`article-${article.id}`}
              >
                <View style={[styles.icon, { backgroundColor: meta.soft }]}>
                  <Icon size={24} color={meta.color} strokeWidth={2.2} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.title} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <View style={styles.metaRow}>
                    {read ? (
                      <>
                        <CheckCircle2 size={15} color={gwarm.teal} />
                        <Text style={[styles.meta, { color: gwarm.teal }]}>Ya lo leíste</Text>
                      </>
                    ) : (
                      <Text style={styles.meta}>{article.minutes} min de lectura</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={22} color={gwarm.inkFaint} />
              </SoftCard>
            </PopIn>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm2,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingBottom: spacing.xs,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
    color: gwarm.ink,
  },
  heroText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    padding: spacing.md,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 16.5,
    lineHeight: 22,
    color: gwarm.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: gwarm.inkFaint,
  },
});
