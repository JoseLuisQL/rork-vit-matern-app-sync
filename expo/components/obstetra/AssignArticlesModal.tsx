/**
 * Modal para que la obstetra asigne o desasigne contenidos educativos
 * a una gestante específica. Soporta asignación individual y masiva.
 */
import { Image } from "expo-image";
import {
  BookOpen,
  Check,
  CheckCheck,
  CheckSquare,
  Clock,
  ExternalLink,
  Square,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { gShadow, gfonts, gwarm, warmBlue, withAlpha } from "@/constants/theme";
import { useApp, useArticleAssignments, useArticles } from "@/providers/AppProvider";
import type { Article } from "@/types";
import { AppButton } from "@/components/AppButton";
import { EmptyState } from "@/components/EmptyState";
import { Illustration } from "@/components/gestante/Illustration";
import { useToast } from "@/components/Toast";

interface AssignArticlesModalProps {
  visible: boolean;
  patientId: string;
  patientName: string;
  onClose: () => void;
}

export function AssignArticlesModal({
  visible,
  patientId,
  patientName,
  onClose,
}: AssignArticlesModalProps): React.ReactElement | null {
  const articles = useArticles();
  const assignments = useArticleAssignments();
  const { assignArticle, assignAllArticles } = useApp();
  const { show: showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Artículos activos disponibles
  const activeArticles = useMemo(
    () => articles.filter((a) => a.active !== false),
    [articles]
  );

  // Set de IDs asignados a este paciente
  const assignedArticleIds = useMemo(() => {
    const set = new Set<string>();
    for (const asgn of assignments) {
      if (asgn.patientId === patientId) {
        set.add(asgn.articleId);
      }
    }
    return set;
  }, [assignments, patientId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of activeArticles) {
      if (a.category) set.add(a.category);
    }
    return ["Todas", ...Array.from(set)];
  }, [activeArticles]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "Todas") return activeArticles;
    return activeArticles.filter((a) => a.category === selectedCategory);
  }, [activeArticles, selectedCategory]);

  const allAssigned =
    activeArticles.length > 0 &&
    activeArticles.every((a) => assignedArticleIds.has(a.id));

  const handleToggle = (articleId: string) => {
    const isCurrentlyAssigned = assignedArticleIds.has(articleId);
    assignArticle(patientId, articleId, !isCurrentlyAssigned);
    showToast(
      !isCurrentlyAssigned
        ? "Lectura asignada a la gestante"
        : "Lectura retirada de la gestante",
      "info"
    );
  };

  const handleToggleAll = () => {
    const newStatus = !allAssigned;
    assignAllArticles(patientId, newStatus);
    showToast(
      newStatus
        ? "Todas las lecturas asignadas"
        : "Se retiraron todas las lecturas",
      "info"
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconWrap}>
                <BookOpen size={20} color={warmBlue.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Asignar Contenidos Educativos</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Paciente: {patientName} · {assignedArticleIds.size} de{" "}
                  {activeArticles.length} lecturas activas asignadas
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <X size={20} color={gwarm.inkSoft} />
            </Pressable>
          </View>

          {/* Quick Actions & Category Filter */}
          <View style={styles.toolbar}>
            <Pressable
              onPress={handleToggleAll}
              style={[
                styles.selectAllBtn,
                allAssigned && styles.selectAllBtnActive,
              ]}
              testID="btn-toggle-all-articles"
            >
              {allAssigned ? (
                <CheckCheck size={16} color={warmBlue.main} />
              ) : (
                <Square size={16} color={gwarm.inkSoft} />
              )}
              <Text
                style={[
                  styles.selectAllText,
                  allAssigned && styles.selectAllTextActive,
                ]}
              >
                {allAssigned ? "Desasignar todas" : "Asignar todas las lecturas"}
              </Text>
            </Pressable>

            {/* Categorías */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[styles.catChip, active && styles.catChipActive]}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        active && styles.catChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* List of articles */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredArticles.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No hay lecturas disponibles"
                text="El administrador aún no ha publicado lecturas en esta categoría."
              />
            ) : (
              filteredArticles.map((art) => {
                const isAssigned = assignedArticleIds.has(art.id);
                return (
                  <Pressable
                    key={art.id}
                    onPress={() => handleToggle(art.id)}
                    style={[
                      styles.articleItem,
                      isAssigned && styles.articleItemAssigned,
                    ]}
                    testID={`toggle-articulo-${art.id}`}
                  >
                    <View style={styles.iluWrap}>
                      {art.imageUrl ? (
                        <Image
                          source={{ uri: art.imageUrl }}
                          style={styles.thumbImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Illustration
                          source={CATEGORY_ILU[art.category] ?? GICON.libro}
                          width={38}
                          height={38}
                        />
                      )}
                    </View>

                    <View style={styles.articleInfo}>
                      <View style={styles.metaRow}>
                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{art.category}</Text>
                        </View>
                        <View style={styles.timeBadge}>
                          <Clock size={11} color={gwarm.inkFaint} />
                          <Text style={styles.timeBadgeText}>
                            {art.minutes || 3} min
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.articleTitle} numberOfLines={2}>
                        {art.title}
                      </Text>
                      <Text style={styles.articleSummary} numberOfLines={2}>
                        {art.summary}
                      </Text>
                    </View>

                    <View style={styles.switchCol}>
                      <Switch
                        value={isAssigned}
                        onValueChange={() => handleToggle(art.id)}
                        trackColor={{
                          true: warmBlue.main,
                          false: gwarm.borderStrong,
                        }}
                        thumbColor="#FFFFFF"
                      />
                      <Text
                        style={[
                          styles.switchStatusText,
                          isAssigned && { color: warmBlue.main, fontWeight: "600" },
                        ]}
                      >
                        {isAssigned ? "Asignado" : "No asignado"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <AppButton
              title="Listo"
              color={warmBlue.main}
              onPress={onClose}
              testID="btn-cerrar-asignacion"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 25, 23, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 640,
    maxHeight: "88%",
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    overflow: "hidden",
    ...gShadow,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: withAlpha(warmBlue.main, 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 24,
    color: gwarm.ink,
  },
  subtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 16,
    color: gwarm.inkSoft,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    gap: 10,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignSelf: "flex-start",
  },
  selectAllBtnActive: {
    borderColor: withAlpha(warmBlue.main, 0.4),
    backgroundColor: withAlpha(warmBlue.main, 0.08),
  },
  selectAllText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    color: gwarm.inkSoft,
  },
  selectAllTextActive: {
    color: warmBlue.main,
  },
  catScroll: {
    flexDirection: "row",
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  catChipActive: {
    backgroundColor: warmBlue.main,
    borderColor: warmBlue.main,
  },
  catChipText: {
    fontFamily: gfonts.hand,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
  catChipTextActive: {
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  articleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: gwarm.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: gwarm.border,
  },
  articleItemAssigned: {
    borderColor: withAlpha(warmBlue.main, 0.4),
    backgroundColor: withAlpha(warmBlue.main, 0.03),
  },
  iluWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: gwarm.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  articleInfo: {
    flex: 1,
    gap: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  catBadge: {
    backgroundColor: withAlpha(warmBlue.main, 0.1),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontFamily: gfonts.hand,
    fontSize: 11,
    color: warmBlue.main,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  timeBadgeText: {
    fontFamily: gfonts.handBody,
    fontSize: 11.5,
    color: gwarm.inkFaint,
  },
  articleTitle: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    color: gwarm.ink,
  },
  articleSummary: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 16,
    color: gwarm.inkSoft,
  },
  switchCol: {
    alignItems: "center",
    gap: 4,
    minWidth: 70,
  },
  switchStatusText: {
    fontFamily: gfonts.handBody,
    fontSize: 11,
    color: gwarm.inkFaint,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
});
