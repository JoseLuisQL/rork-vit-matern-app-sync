/**
 * Consejos para el embarazo: cada lectura asignada por la obstetra con su dibujo
 * a crayola por tema o imagen ilustrada, disponibles siempre, incluso sin señal.
 * Adaptado con arquitectura responsiva Web (cuadrícula responsiva en escritorio).
 */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { gfonts, gwarm, spacing } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { useApp, useArticles } from "@/providers/AppProvider";
import { EmptyState } from "@/components/EmptyState";
import { GHeader } from "@/components/gestante/GHeader";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { SoftCard } from "@/components/gestante/SoftCard";
import { WebContainer } from "@/components/web/WebContainer";

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
  const { isDesktop } = useResponsive();
  const { readArticles } = useApp();
  const articles = useArticles();

  return (
    <View style={styles.container}>
      <WebContainer size="dashboard">
        <GHeader title="Consejos" back />
      </WebContainer>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="dashboard">
          <PopIn delay={0}>
            <View style={styles.heroRow}>
              <Illustration source={GICON.libro} width={84} height={84} />
              <View style={styles.flex}>
                <Text style={styles.heroTitle}>Aprende para ti y tu bebé</Text>
                <Text style={styles.heroText}>
                  Lecturas recomendadas por tu obstetra. Se leen incluso sin señal.
                </Text>
              </View>
            </View>
          </PopIn>

          {articles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              illu={GICON.libro}
              title="Aún no tienes lecturas asignadas"
              text="Tu obstetra te asignará lecturas y recomendaciones personalizadas según tus semanas de gestación."
            />
          ) : (
            <View style={isDesktop ? styles.desktopGrid : styles.mobileList}>
              {articles.map((article, index) => {
                const read = readArticles.includes(article.id);
                const illu = CATEGORY_ILU[article.category] ?? GICON.libro;
                const soft = CATEGORY_SOFT[article.category] ?? gwarm.tealSoft;
                return (
                  <View key={article.id} style={isDesktop ? styles.gridItem : undefined}>
                    <PopIn delay={70 + index * 40} style={styles.flex}>
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
                          {article.imageUrl ? (
                            <Image
                              source={{ uri: article.imageUrl }}
                              style={styles.cardImage}
                              contentFit="cover"
                            />
                          ) : (
                            <Illustration source={illu} width={44} height={44} />
                          )}
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
                              <Text style={styles.meta}>{article.minutes || 3} min de lectura</Text>
                            )}
                          </View>
                        </View>
                        <ChevronRight size={22} color={gwarm.inkFaint} />
                      </SoftCard>
                    </PopIn>
                  </View>
                );
              })}
            </View>
          )}
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
    paddingBottom: spacing.xl,
    gap: spacing.sm2,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingBottom: spacing.sm,
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
  mobileList: {
    gap: spacing.sm2,
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridItem: {
    flexBasis: "48.5%",
    flexGrow: 1,
    minWidth: 320,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    padding: spacing.md,
    height: "100%",
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
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
