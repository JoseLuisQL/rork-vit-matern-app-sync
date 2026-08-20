/**
 * Gestión de Contenidos Educativos (Solo Admin).
 * Permite crear, editar, filtrar por categoría, cambiar estado activo/inactivo
 * y eliminar lecturas y enlaces de orientación prenatal.
 */
import { Image } from "expo-image";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { gShadow, gfonts, gwarm, semantic, warmPlum, withAlpha } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { useApp, useArticles } from "@/providers/AppProvider";
import type { Article } from "@/types";
import { AppButton } from "@/components/AppButton";
import { ArticleEditorModal } from "@/components/admin/ArticleEditorModal";
import { EmptyState } from "@/components/EmptyState";
import { Illustration } from "@/components/gestante/Illustration";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useToast } from "@/components/Toast";
import { WebContainer } from "@/components/web/WebContainer";

export default function AdminEducacionScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const articles = useArticles();
  const { adminToggleArticleActive, adminDeleteArticle, online } = useApp();
  const { show: showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Categorías presentes
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of articles) {
      if (a.category) set.add(a.category);
    }
    return ["Todas", ...Array.from(set)];
  }, [articles]);

  // Filtrado
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((a) => {
      const matchCategory =
        selectedCategory === "Todas" || a.category === selectedCategory;
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [articles, searchQuery, selectedCategory]);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setEditorVisible(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setEditorVisible(true);
  };

  const handleToggleActive = async (art: Article) => {
    if (!online) {
      showToast("Conéctate a internet para cambiar el estado", "error");
      return;
    }
    try {
      await adminToggleArticleActive(art.id, !art.active);
      showToast(
        !art.active ? "Artículo activado" : "Artículo deshabilitado",
        "success"
      );
    } catch (e) {
      showToast("No se pudo cambiar el estado", "error");
    }
  };

  const handleDelete = (art: Article) => {
    if (!online) {
      showToast("Conéctate a internet para eliminar contenidos", "error");
      return;
    }

    const doDelete = async () => {
      try {
        await adminDeleteArticle(art.id);
        showToast("Contenido educativo eliminado", "success");
      } catch (e) {
        showToast("Error al eliminar el artículo", "error");
      }
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          `¿Estás seguro de eliminar el artículo "${art.title}"? Esta acción no se puede deshacer.`
        )
      ) {
        void doDelete();
      }
    } else {
      Alert.alert(
        "Eliminar contenido",
        `¿Estás seguro de eliminar "${art.title}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: () => void doDelete() },
        ]
      );
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: isDesktop ? 0 : insets.top }]}>
      <WebContainer size="dashboard" style={styles.container}>
        {/* Cabecera */}
        <View style={styles.topBar}>
          <ScreenHeader
            title="Biblioteca Educativa"
            subtitle={`${articles.length} lecturas y guías prenatales registradas`}
            showBack={false}
          />
          <View style={styles.newBtnWrap}>
            <AppButton
              title="Nuevo contenido"
              icon={Plus}
              color={warmPlum.main}
              onPress={handleOpenCreate}
              testID="btn-nuevo-articulo"
            />
          </View>
        </View>

        {/* Barra de filtros y búsqueda */}
        <View style={styles.filterSection}>
          <View style={styles.searchBox}>
            <Search size={18} color={gwarm.inkFaint} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por título, contenido o categoría..."
              placeholderTextColor={gwarm.inkFaint}
              style={styles.searchInput}
            />
          </View>

          {/* Chips de Categorías */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
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

        {/* Lista de Artículos */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredArticles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No se encontraron contenidos"
              text="Intenta con otro término de búsqueda o crea un nuevo artículo."
            />
          ) : (
            <View style={isDesktop ? styles.desktopGrid : styles.mobileList}>
              {filteredArticles.map((art) => (
                <View
                  key={art.id}
                  style={[
                    styles.articleCard,
                    isDesktop && styles.gridItem,
                    art.active === false && styles.articleCardInactive,
                  ]}
                >
                  {/* Encabezado de la Tarjeta */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIluWrap}>
                      {art.imageUrl ? (
                        <Image
                          source={{ uri: art.imageUrl }}
                          style={styles.cardImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Illustration
                          source={CATEGORY_ILU[art.category] ?? GICON.libro}
                          width={48}
                          height={48}
                        />
                      )}
                    </View>

                    <View style={styles.cardInfo}>
                      <View style={styles.cardBadges}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {art.category}
                          </Text>
                        </View>
                        <View style={styles.timeBadge}>
                          <Clock size={12} color={gwarm.inkSoft} />
                          <Text style={styles.timeBadgeText}>
                            {art.minutes || 3} min
                          </Text>
                        </View>
                        {art.active === false ? (
                          <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveBadgeText}>
                              Deshabilitado
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.articleTitle} numberOfLines={2}>
                        {art.title}
                      </Text>
                    </View>
                  </View>

                  {/* Resumen */}
                  <Text style={styles.articleSummary} numberOfLines={3}>
                    {art.summary}
                  </Text>

                  {/* Enlaces asociados */}
                  {art.links && art.links.length > 0 ? (
                    <View style={styles.cardLinks}>
                      <Text style={styles.cardLinksTitle}>
                        {art.links.length} recurso(s) adicional(es) vinculado(s)
                      </Text>
                    </View>
                  ) : null}

                  {/* Footer con acciones */}
                  <View style={styles.cardFooter}>
                    <Pressable
                      onPress={() => void handleToggleActive(art)}
                      style={[
                        styles.actionBtn,
                        art.active === false ? styles.btnActivate : styles.btnDeactivate,
                      ]}
                    >
                      {art.active === false ? (
                        <>
                          <CheckCircle2 size={15} color={gwarm.teal} />
                          <Text style={[styles.actionBtnText, { color: gwarm.teal }]}>
                            Habilitar
                          </Text>
                        </>
                      ) : (
                        <>
                          <XCircle size={15} color={gwarm.inkSoft} />
                          <Text style={styles.actionBtnText}>Deshabilitar</Text>
                        </>
                      )}
                    </Pressable>

                    <View style={styles.rightActions}>
                      <Pressable
                        onPress={() => handleOpenEdit(art)}
                        style={[styles.actionBtn, styles.btnEdit]}
                        testID={`btn-editar-${art.id}`}
                      >
                        <Edit2 size={15} color={warmPlum.main} />
                        <Text style={[styles.actionBtnText, { color: warmPlum.main }]}>
                          Editar
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDelete(art)}
                        style={[styles.actionBtn, styles.btnDelete]}
                        testID={`btn-eliminar-${art.id}`}
                      >
                        <Trash2 size={15} color={semantic.danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </WebContainer>

      {/* Modal Editor */}
      <ArticleEditorModal
        visible={editorVisible}
        article={editingArticle}
        onClose={() => {
          setEditorVisible(false);
          setEditingArticle(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: gwarm.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  newBtnWrap: {
    minWidth: 150,
  },
  filterSection: {
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    ...gShadow,
  },
  searchInput: {
    flex: 1,
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    color: gwarm.ink,
  },
  categoriesScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
  },
  catChipActive: {
    backgroundColor: warmPlum.main,
    borderColor: warmPlum.main,
  },
  catChipText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    color: gwarm.inkSoft,
  },
  catChipTextActive: {
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mobileList: {
    gap: 14,
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
  articleCard: {
    backgroundColor: gwarm.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    padding: 16,
    gap: 12,
    ...gShadow,
  },
  articleCardInactive: {
    opacity: 0.65,
    backgroundColor: gwarm.surfaceSoft,
    borderColor: gwarm.borderStrong,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  cardIluWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: withAlpha(warmPlum.main, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: gfonts.hand,
    fontSize: 12,
    color: warmPlum.main,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: gwarm.surfaceSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    color: gwarm.inkSoft,
  },
  inactiveBadge: {
    backgroundColor: withAlpha(semantic.danger, 0.12),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    fontFamily: gfonts.hand,
    fontSize: 11.5,
    color: semantic.danger,
  },
  articleTitle: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.ink,
  },
  articleSummary: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.inkSoft,
  },
  cardLinks: {
    backgroundColor: gwarm.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cardLinksTitle: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    color: gwarm.teal,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    paddingTop: 12,
    marginTop: 4,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
  btnActivate: {
    borderColor: withAlpha(gwarm.teal, 0.3),
    backgroundColor: withAlpha(gwarm.teal, 0.08),
  },
  btnDeactivate: {
    borderColor: gwarm.border,
  },
  btnEdit: {
    borderColor: withAlpha(warmPlum.main, 0.3),
    backgroundColor: withAlpha(warmPlum.main, 0.08),
  },
  btnDelete: {
    borderColor: withAlpha(semantic.danger, 0.3),
    backgroundColor: withAlpha(semantic.danger, 0.08),
  },
  actionBtnText: {
    fontFamily: gfonts.hand,
    fontSize: 12.5,
    color: gwarm.inkSoft,
  },
});
