/**
 * Consejos para el embarazo: cada lectura con su dibujo a crayola por tema
 * (comida, urgencias, pastillas…), disponibles siempre, incluso sin señal.
 */
import { useRouter } from "expo-router";
import { CheckCircle2, ChevronRight } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ARTICLES } from "@/constants/content";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { useApp } from "@/providers/AppProvider";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { SoftCard } from "@/components/gestante/SoftCard";

/** Fondo suave de la ficha ilustrada de cada tema. */
const CATEGORY_SOFT: Record<string, string> = {
  "Nutrición": gwarm.terracottaSoft,
  "Urgencias": gwarm.redSoft,
  "Tratamiento": gwarm.tealSoft,
  "Preparación": gwarm.amberSoft,
  "Posparto": gwarm.roseSoft,
  "Salud mental": "#EAF2F9",
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
            <Illustration source={GICON.libro} width={84} height={84} />
            <View style={styles.flex}>
              <Text style={styles.heroTitle}>Aprende para ti y tu bebé</Text>
              <Text style={styles.heroText}>Se leen aunque no tengas señal.</Text>
            </View>
          </View>
        </PopIn>

        {ARTICLES.map((article, index) => {
          const read = readArticles.includes(article.id);
          const illu = CATEGORY_ILU[article.category] ?? GICON.libro;
          const soft = CATEGORY_SOFT[article.category] ?? gwarm.tealSoft;
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
                <View style={[styles.icon, { backgroundColor: soft }]}>
                  <Illustration source={illu} width={44} height={44} />
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
    fontFamily: gfonts.hand,
    fontSize: 23,
    lineHeight: 29,
    color: gwarm.ink,
  },
  heroText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
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
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 18.5,
    lineHeight: 24,
    color: gwarm.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  meta: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.inkFaint,
  },
});
