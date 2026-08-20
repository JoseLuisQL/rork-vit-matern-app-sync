/**
 * Modal de creación y edición completa de contenidos educativos (solo Admin).
 * Permite gestionar textos, categorías, párrafos dinámicos, subida de imágenes
 * y enlaces de interés recomendados para las gestantes.
 */
import { Image } from "expo-image";
import {
  BookOpen,
  Camera,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { gShadow, gfonts, gwarm, semantic, spacing, warmPlum, withAlpha } from "@/constants/theme";
import { CATEGORY_ILU, GICON } from "@/constants/illustrations";
import { pickAvatarDataUrl } from "@/lib/photo";
import { useApp } from "@/providers/AppProvider";
import type { Article, ArticleLink } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Illustration } from "@/components/gestante/Illustration";
import { useToast } from "@/components/Toast";

const PRESET_CATEGORIES = [
  "Nutrición",
  "Urgencias",
  "Tratamiento",
  "Preparación",
  "Posparto",
  "Salud mental",
  "Cuidado general",
];

interface ArticleEditorModalProps {
  visible: boolean;
  article?: Article | null;
  onClose: () => void;
}

export function ArticleEditorModal({
  visible,
  article,
  onClose,
}: ArticleEditorModalProps): React.ReactElement | null {
  const { adminSaveArticle, online } = useApp();
  const { show: showToast } = useToast();

  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("Nutrición");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("3");
  const [summary, setSummary] = useState<string>("");
  const [bodyParagraphs, setBodyParagraphs] = useState<string[]>([""]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [links, setLinks] = useState<ArticleLink[]>([]);
  const [active, setActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (article) {
        setTitle(article.title);
        if (PRESET_CATEGORIES.includes(article.category)) {
          setCategory(article.category);
          setCustomCategory("");
        } else {
          setCategory("Otra");
          setCustomCategory(article.category);
        }
        setMinutes(String(article.minutes || 3));
        setSummary(article.summary || "");
        setBodyParagraphs(
          article.body && article.body.length > 0 ? [...article.body] : [""]
        );
        setImageUrl(article.imageUrl ?? null);
        setLinks(article.links && article.links.length > 0 ? [...article.links] : []);
        setActive(article.active !== false);
      } else {
        setTitle("");
        setCategory("Nutrición");
        setCustomCategory("");
        setMinutes("3");
        setSummary("");
        setBodyParagraphs([""]);
        setImageUrl(null);
        setLinks([]);
        setActive(true);
      }
      setError(null);
    }
  }, [visible, article]);

  // Manejo de imagen
  const handlePickImage = useCallback(async () => {
    try {
      const dataUrl = await pickAvatarDataUrl();
      if (dataUrl) {
        setImageUrl(dataUrl);
      }
    } catch (e) {
      showToast("No se pudo seleccionar la imagen", "error");
    }
  }, [showToast]);

  // Párrafos
  const handleAddParagraph = useCallback(() => {
    setBodyParagraphs((prev) => [...prev, ""]);
  }, []);

  const handleUpdateParagraph = useCallback((index: number, text: string) => {
    setBodyParagraphs((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  }, []);

  const handleRemoveParagraph = useCallback((index: number) => {
    setBodyParagraphs((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Enlaces
  const handleAddLink = useCallback(() => {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }, []);

  const handleUpdateLink = useCallback(
    (index: number, field: "label" | "url", value: string) => {
      setLinks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const handleRemoveLink = useCallback((index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Guardar
  const handleSave = useCallback(async () => {
    if (!online) {
      setError("Necesitas conexión a internet para guardar este contenido.");
      return;
    }

    const cleanTitle = title.trim();
    const finalCategory = (category === "Otra" ? customCategory : category).trim();
    const cleanSummary = summary.trim();
    const cleanMinutes = Math.max(1, Math.min(60, parseInt(minutes, 10) || 3));
    const cleanParagraphs = bodyParagraphs
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const cleanLinks = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label.length > 0 && l.url.length > 0);

    if (!cleanTitle) {
      setError("Por favor ingresa un título para la lectura.");
      return;
    }
    if (!finalCategory) {
      setError("Por favor especifica una categoría.");
      return;
    }
    if (!cleanSummary) {
      setError("Por favor ingresa un breve resumen.");
      return;
    }
    if (cleanParagraphs.length === 0) {
      setError("Agrega al menos un párrafo de contenido.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await adminSaveArticle({
        id: article?.id,
        title: cleanTitle,
        category: finalCategory,
        summary: cleanSummary,
        minutes: cleanMinutes,
        body: cleanParagraphs,
        imageUrl,
        links: cleanLinks,
        active,
      });

      showToast(
        article ? "Contenido educativo actualizado" : "Nuevo contenido educativo creado",
        "success"
      );
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al guardar el contenido educativo."
      );
    } finally {
      setLoading(false);
    }
  }, [
    online,
    title,
    category,
    customCategory,
    summary,
    minutes,
    bodyParagraphs,
    links,
    imageUrl,
    active,
    article,
    adminSaveArticle,
    showToast,
    onClose,
  ]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconWrap}>
                <BookOpen size={20} color={warmPlum.main} />
              </View>
              <View>
                <Text style={styles.title}>
                  {article ? "Editar contenido educativo" : "Nuevo contenido educativo"}
                </Text>
                <Text style={styles.subtitle}>
                  Biblioteca de lectura prenatal para gestantes y obstetras
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <X size={20} color={gwarm.inkSoft} />
            </Pressable>
          </View>

          {/* Body Form */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Título */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Título del contenido *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Alimentación rica en hierro y vitamina C"
                placeholderTextColor={gwarm.inkFaint}
                style={styles.input}
                testID="input-articulo-titulo"
              />
            </View>

            {/* Categoría */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Categoría temática *</Text>
              <View style={styles.categoriesRow}>
                {PRESET_CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catChip,
                        selected && styles.catChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          selected && styles.catChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setCategory("Otra")}
                  style={[
                    styles.catChip,
                    category === "Otra" && styles.catChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      category === "Otra" && styles.catChipTextSelected,
                    ]}
                  >
                    Otra…
                  </Text>
                </Pressable>
              </View>

              {category === "Otra" ? (
                <TextInput
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Escribe la categoría personalizada"
                  placeholderTextColor={gwarm.inkFaint}
                  style={[styles.input, { marginTop: 8 }]}
                />
              ) : null}
            </View>

            {/* Tiempo de lectura y estado */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldBlock, { flex: 1 }]}>
                <Text style={styles.label}>Tiempo estimado (minutos)</Text>
                <TextInput
                  value={minutes}
                  onChangeText={(t) => setMinutes(t.replace(/[^0-9]/g, ""))}
                  placeholder="3"
                  placeholderTextColor={gwarm.inkFaint}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={styles.input}
                />
              </View>

              <View style={[styles.fieldBlock, { flex: 1.5 }]}>
                <Text style={styles.label}>Estado de publicación</Text>
                <View style={styles.switchBox}>
                  <Text style={styles.switchLabel}>
                    {active ? "Activo (disponible)" : "Deshabilitado"}
                  </Text>
                  <Switch
                    value={active}
                    onValueChange={setActive}
                    trackColor={{ true: gwarm.teal, false: gwarm.borderStrong }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Resumen breve */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Resumen breve (para la tarjeta) *</Text>
              <TextInput
                value={summary}
                onChangeText={setSummary}
                placeholder="Explicación concisa del tema en 1 o 2 oraciones..."
                placeholderTextColor={gwarm.inkFaint}
                multiline
                numberOfLines={2}
                style={[styles.input, styles.textareaShort]}
              />
            </View>

            {/* Imagen ilustrativa */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Imagen del artículo (opcional)</Text>
              <View style={styles.imageUploadSection}>
                {imageUrl ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: imageUrl }} style={styles.imagePreview} contentFit="cover" />
                    <View style={styles.imageActions}>
                      <Pressable
                        onPress={() => void handlePickImage()}
                        style={styles.imageBtn}
                      >
                        <Camera size={14} color={gwarm.ink} />
                        <Text style={styles.imageBtnText}>Cambiar foto</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setImageUrl(null)}
                        style={[styles.imageBtn, { backgroundColor: semantic.dangerLight }]}
                      >
                        <Trash2 size={14} color={semantic.danger} />
                        <Text style={[styles.imageBtnText, { color: semantic.danger }]}>
                          Quitar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noImageWrap}>
                    <View style={styles.iluPreviewWrap}>
                      <Illustration
                        source={CATEGORY_ILU[category] ?? GICON.libro}
                        width={60}
                        height={60}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.noImageText}>
                        Ilustración temática automática ({category}). Opcionalmente puedes subir una fotografía o dibujo personalizado.
                      </Text>
                      <Pressable
                        onPress={() => void handlePickImage()}
                        style={styles.uploadBtn}
                      >
                        <Camera size={16} color={warmPlum.main} />
                        <Text style={styles.uploadBtnText}>Subir foto personalizada</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Párrafos de lectura */}
            <View style={styles.fieldBlock}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.label}>Párrafos de lectura *</Text>
                <Pressable onPress={handleAddParagraph} style={styles.addBtn} hitSlop={6}>
                  <Plus size={16} color={warmPlum.main} />
                  <Text style={styles.addBtnText}>Añadir párrafo</Text>
                </Pressable>
              </View>

              {bodyParagraphs.map((para, idx) => (
                <View key={`para-${idx}`} style={styles.paragraphRow}>
                  <View style={styles.paragraphIndexBadge}>
                    <Text style={styles.paragraphIndexText}>{idx + 1}</Text>
                  </View>
                  <TextInput
                    value={para}
                    onChangeText={(t) => handleUpdateParagraph(idx, t)}
                    placeholder={`Escribe el párrafo ${idx + 1}...`}
                    placeholderTextColor={gwarm.inkFaint}
                    multiline
                    style={[styles.input, styles.textareaParagraph]}
                  />
                  {bodyParagraphs.length > 1 ? (
                    <Pressable
                      onPress={() => handleRemoveParagraph(idx)}
                      style={styles.removeParagraphBtn}
                      hitSlop={6}
                    >
                      <Trash2 size={16} color={gwarm.inkFaint} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Enlaces de interés / recomendados */}
            <View style={styles.fieldBlock}>
              <View style={styles.sectionTitleRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <LinkIcon size={16} color={gwarm.teal} />
                  <Text style={styles.label}>Enlaces y videos recomendados</Text>
                </View>
                <Pressable onPress={handleAddLink} style={styles.addBtn} hitSlop={6}>
                  <Plus size={16} color={gwarm.teal} />
                  <Text style={[styles.addBtnText, { color: gwarm.teal }]}>
                    Añadir enlace
                  </Text>
                </Pressable>
              </View>

              {links.length === 0 ? (
                <Text style={styles.emptyLinksText}>
                  No hay enlaces externos agregados. Puedes añadir guías MINSA, videos de YouTube o documentos de interés.
                </Text>
              ) : (
                links.map((link, idx) => (
                  <View key={`link-${idx}`} style={styles.linkCard}>
                    <View style={styles.linkInputs}>
                      <TextInput
                        value={link.label}
                        onChangeText={(t) => handleUpdateLink(idx, "label", t)}
                        placeholder="Nombre o descripción (Ej. Guía nutricional)"
                        placeholderTextColor={gwarm.inkFaint}
                        style={[styles.input, styles.linkInput]}
                      />
                      <TextInput
                        value={link.url}
                        onChangeText={(t) => handleUpdateLink(idx, "url", t)}
                        placeholder="URL (Ej. https://www.gob.pe/minsa)"
                        placeholderTextColor={gwarm.inkFaint}
                        autoCapitalize="none"
                        keyboardType="url"
                        style={[styles.input, styles.linkInput]}
                      />
                    </View>
                    <Pressable
                      onPress={() => handleRemoveLink(idx)}
                      style={styles.removeLinkBtn}
                      hitSlop={6}
                    >
                      <Trash2 size={16} color={semantic.danger} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Acciones */}
            <View style={styles.actionsRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={onClose}
                  disabled={loading}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <AppButton
                  title={article ? "Guardar cambios" : "Crear contenido"}
                  color={warmPlum.main}
                  onPress={() => void handleSave()}
                  loading={loading}
                  testID="btn-guardar-articulo"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: 680,
    maxHeight: "92%",
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
    backgroundColor: withAlpha(warmPlum.main, 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 25,
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
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  fieldBlock: {
    gap: 6,
  },
  label: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    lineHeight: 19,
    color: gwarm.ink,
  },
  input: {
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: gfonts.handBody,
    fontSize: 15,
    color: gwarm.ink,
  },
  textareaShort: {
    height: 72,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  textareaParagraph: {
    height: 84,
    paddingTop: 10,
    flex: 1,
    textAlignVertical: "top",
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
  catChipSelected: {
    borderColor: warmPlum.main,
    backgroundColor: withAlpha(warmPlum.main, 0.12),
  },
  catChipText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  catChipTextSelected: {
    color: warmPlum.main,
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  switchBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  switchLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.ink,
  },
  imageUploadSection: {
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 16,
    padding: 14,
  },
  noImageWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iluPreviewWrap: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: withAlpha(warmPlum.main, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(warmPlum.main, 0.3),
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  uploadBtnText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    color: warmPlum.main,
  },
  imagePreviewWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surface,
  },
  imageActions: {
    flex: 1,
    gap: 8,
  },
  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  imageBtnText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.ink,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    color: warmPlum.main,
  },
  paragraphRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  paragraphIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  paragraphIndexText: {
    fontFamily: gfonts.hand,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
  removeParagraphBtn: {
    padding: 8,
    marginTop: 6,
  },
  emptyLinksText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 18,
    color: gwarm.inkFaint,
    fontStyle: "italic",
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  linkInputs: {
    flex: 1,
    gap: 6,
  },
  linkInput: {
    height: 40,
    fontSize: 14,
    backgroundColor: gwarm.surface,
  },
  removeLinkBtn: {
    padding: 8,
  },
  errorBox: {
    backgroundColor: semantic.dangerLight,
    borderWidth: 1,
    borderColor: withAlpha(semantic.danger, 0.3),
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: semantic.danger,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
});
