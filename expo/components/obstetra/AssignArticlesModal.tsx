/**
 * Modal para que la obstetra asigne o desasigne contenidos educativos
 * a una gestante específica. Soporta asignación individual y masiva.
 */
import { Image } from "expo-image";
import {
  BookOpen,
  CheckCheck,
  Clock,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Square,
  Video,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { gShadow, gfonts, gwarm, warmBlue, warmPlum, withAlpha } from "@/constants/theme";
import { useApp, useArticleAssignments, useArticles } from "@/providers/AppProvider";
import type { ArticleMediaType } from "@/types";
import { AppButton } from "@/components/AppButton";
import { EmptyState } from "@/components/EmptyState";
import { Illustration } from "@/components/gestante/Illustration";
import { useToast } from "@/components/Toast";
import { ArticleEditorModal } from "@/components/admin/ArticleEditorModal";

const MEDIA_FILTERS: { key: "todos" | ArticleMediaType; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "lectura", label: "Lecturas" },
  { key: "video", label: "Videos" },
  { key: "pdf", label: "PDFs" },
  { key: "imagen", label: "Imágenes" },
];

const MEDIA_BADGE: Record<ArticleMediaType, { label: string; color: string; bg: string }> = {
  lectura: { label: "LECTURA", color: warmBlue.main, bg: withAlpha(warmBlue.main, 0.12) },
  video: { label: "VIDEO", color: gwarm.rose, bg: gwarm.redSoft },
  pdf: { label: "PDF", color: warmPlum.main, bg: warmPlum.soft },
  imagen: { label: "IMAGEN", color: gwarm.tealDeep, bg: gwarm.tealSoft },
};

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
  const { height: windowHeight } = useWindowDimensions();
  const articles = useArticles();
  const assignments = useArticleAssignments();
  const { assignArticle, assignAllArticles } = useApp();
  const { show: showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [selectedMedia, setSelectedMedia] = useState<"todos" | ArticleMediaType>("todos");
  const [editorVisible, setEditorVisible] = useState<boolean>(false);

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
    return activeArticles.filter((a) => {
      if (selectedCategory !== "Todas" && a.category !== selectedCategory) return false;
      const mType: ArticleMediaType = a.mediaType ?? "lectura";
      if (selectedMedia !== "todos" && mType !== selectedMedia) return false;
      return true;
    });
  }, [activeArticles, selectedCategory, selectedMedia]);

  const allAssigned =
    activeArticles.length > 0 &&
    activeArticles.every((a) => assignedArticleIds.has(a.id));

  const handleToggle = (articleId: string) => {
    const isCurrentlyAssigned = assignedArticleIds.has(articleId);
    assignArticle(patientId, articleId, !isCurrentlyAssigned);
    showToast(
      !isCurrentlyAssigned
        ? "Material educativo asignado a la gestante"
        : "Material educativo retirado de la gestante",
      "info"
    );
  };

  const handleToggleAll = () => {
    const newStatus = !allAssigned;
    assignAllArticles(patientId, newStatus);
    showToast(
      newStatus
        ? "Todos los materiales educativos asignados"
        : "Se retiraron todos los materiales educativos",
      "info"
    );
  };

  if (!visible) return null;

  const modalHeight = Math.min(Math.max(Math.round(windowHeight * 0.86), 360), 740);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.card, { height: modalHeight, maxHeight: modalHeight }]}>
          {/* Header fijo */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconWrap}>
                <BookOpen size={20} color={warmBlue.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Asignar Contenidos Educativos</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Paciente: {patientName} · {assignedArticleIds.size} de{" "}
                  {activeArticles.length} recursos asignados
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

          {/* Cuerpo desplazable: incluye barra de herramientas, filtros y lista de recursos */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick Actions & Filters */}
            <View style={styles.toolbar}>
              <View style={styles.toolbarTopRow}>
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
                    {allAssigned ? "Desasignar todos" : "Asignar todos"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setEditorVisible(true)}
                  style={styles.newMaterialBtn}
                  testID="btn-agregar-material-educativo"
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.newMaterialBtnText}>
                    Agregar material (Video, PDF, Imagen)
                  </Text>
                </Pressable>
              </View>

              {/* Filtro por Formato (Todos, Lecturas, Videos, PDFs, Imágenes) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={styles.catScroll}
              >
                {MEDIA_FILTERS.map((mf) => {
                  const active = selectedMedia === mf.key;
                  return (
                    <Pressable
                      key={mf.key}
                      onPress={() => setSelectedMedia(mf.key)}
                      style={[styles.catChip, active && styles.catChipActive]}
                      testID={`filtro-media-${mf.key}`}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          active && styles.catChipTextActive,
                        ]}
                      >
                        {mf.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Categorías temáticas */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
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

            {/* Lista de artículos */}
            <View style={styles.listSection}>
              {filteredArticles.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No hay recursos en este filtro"
                  text="Prueba con otra categoría o agrega un nuevo video, PDF o imagen."
                />
              ) : (
                filteredArticles.map((art) => {
                  const isAssigned = assignedArticleIds.has(art.id);
                  const mType: ArticleMediaType = art.mediaType ?? "lectura";
                  const mBadge = MEDIA_BADGE[mType] ?? MEDIA_BADGE.lectura;
                  const linkCount = art.links?.length ?? 0;
                  return (
                    <View
                      key={art.id}
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
                        ) : mType === "video" ? (
                          <Video size={24} color={gwarm.rose} />
                        ) : mType === "pdf" ? (
                          <FileText size={24} color={warmPlum.main} />
                        ) : mType === "imagen" ? (
                          <ImageIcon size={24} color={gwarm.tealDeep} />
                        ) : (
                          <Illustration
                            source={CATEGORY_ILU[art.category] ?? GICON.libro}
                            width={38}
                            height={38}
                          />
                        )}
                      </View>

                      <Pressable
                        onPress={() => handleToggle(art.id)}
                        style={styles.articleInfo}
                      >
                        <View style={styles.metaRow}>
                          <View style={[styles.catBadge, { backgroundColor: mBadge.bg }]}>
                            <Text style={[styles.catBadgeText, { color: mBadge.color }]}>
                              {mBadge.label}
                            </Text>
                          </View>
                          <View style={styles.catBadge}>
                            <Text style={styles.catBadgeText}>{art.category}</Text>
                          </View>
                          <View style={styles.timeBadge}>
                            <Clock size={11} color={gwarm.inkFaint} />
                            <Text style={styles.timeBadgeText}>
                              {art.minutes || 3} min
                            </Text>
                          </View>
                          {linkCount > 0 ? (
                            <View style={styles.timeBadge}>
                              <LinkIcon size={11} color={gwarm.tealDeep} />
                              <Text style={[styles.timeBadgeText, { color: gwarm.tealDeep }]}>
                                {linkCount} {linkCount === 1 ? "recurso" : "recursos"}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.articleTitle} numberOfLines={2}>
                          {art.title}
                        </Text>
                        <Text style={styles.articleSummary} numberOfLines={2}>
                          {art.summary}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleToggle(art.id)}
                        style={styles.switchCol}
                      >
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
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Footer fijo siempre visible */}
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

      <ArticleEditorModal
        visible={editorVisible}
        article={null}
        onClose={() => setEditorVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 25, 23, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 640,
    flexDirection: "column",
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
    flexShrink: 0,
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
    fontSize: 18.5,
    lineHeight: 23,
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
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    gap: 8,
  },
  toolbarTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  newMaterialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: warmBlue.main,
    minHeight: 38,
  },
  newMaterialBtnText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    color: "#FFFFFF",
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignSelf: "flex-start",
    minHeight: 38,
  },
  selectAllBtnActive: {
    borderColor: withAlpha(warmBlue.main, 0.4),
    backgroundColor: withAlpha(warmBlue.main, 0.08),
  },
  selectAllText: {
    fontFamily: gfonts.hand,
    fontSize: 14,
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
    minHeight: 38,
    justifyContent: "center",
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
    minHeight: 0,
    ...Platform.select({
      web: {
        overflowY: "auto" as any,
        WebkitOverflowScrolling: "touch" as any,
      },
    }),
  },
  scrollContent: {
    paddingBottom: 16,
  },
  listSection: {
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
    flexShrink: 0,
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
    flexWrap: "wrap",
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
    flexShrink: 0,
  },
  switchStatusText: {
    fontFamily: gfonts.handBody,
    fontSize: 11,
    color: gwarm.inkFaint,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
    flexShrink: 0,
  },
});
