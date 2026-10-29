/**
 * Panel rápido de creación, edición y asignación de contenidos educativos (Issue #53).
 * Cambia dinámicamente según el formato elegido (Imagen, Texto, PDF o Video),
 * incluye campo opcional de Indicaciones médicas y permite guardar + enviar la
 * asignación directamente a la gestante seleccionada con alerta de éxito.
 */
import { Image } from "expo-image";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Send,
  Trash2,
  Upload,
  UserCheck,
  Video,
  X,
  type LucideIcon,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { gShadow, gfonts, gwarm, semantic, warmBlue, warmPlum, withAlpha } from "@/constants/theme";
import { showNotice } from "@/lib/confirm";
import { pickArticleImage, pickPdfDocument } from "@/lib/photo";
import { useApp } from "@/providers/AppProvider";
import type { Article, ArticleMediaType } from "@/types";
import { AppButton } from "@/components/AppButton";
import { useToast } from "@/components/Toast";

const MEDIA_FORMATS: {
  key: ArticleMediaType;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "imagen", label: "Imagen", icon: ImageIcon },
  { key: "lectura", label: "Texto", icon: FileText },
  { key: "pdf", label: "PDF", icon: FileUp },
  { key: "video", label: "Video", icon: Video },
];

export interface ArticleEditorModalProps {
  visible: boolean;
  article?: Article | null;
  /** ID de la gestante preseleccionada (cuando se abre desde la ficha de una paciente). */
  patientId?: string;
  /** Nombre de la gestante preseleccionada. */
  patientName?: string;
  onClose: () => void;
}

export function ArticleEditorModal({
  visible,
  article,
  patientId,
  patientName,
  onClose,
}: ArticleEditorModalProps): React.ReactElement | null {
  const { height: windowHeight } = useWindowDimensions();
  const { adminSaveArticle, online } = useApp();
  const { show: showToast } = useToast();

  const [title, setTitle] = useState<string>("");
  const [mediaType, setMediaType] = useState<ArticleMediaType>("imagen");

  // Campos dinámicos según el formato seleccionado
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");

  const [textContent, setTextContent] = useState<string>("");

  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [pdfExternalUrl, setPdfExternalUrl] = useState<string>("");

  const [videoUrl, setVideoUrl] = useState<string>("");

  // Indicaciones médicas opcionales
  const [indicaciones, setIndicaciones] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const accentColor = patientId ? warmBlue.main : warmPlum.main;

  useEffect(() => {
    if (!visible) return;
    if (article) {
      const mType: ArticleMediaType = article.mediaType ?? "lectura";
      setTitle(article.title || "");
      setMediaType(mType);
      setImageDataUrl(article.imageUrl ?? (mType === "imagen" ? article.mediaUrl ?? null : null));
      setImageFileName(article.imageUrl ? "Imagen actual" : "");
      setTextContent(
        article.body && article.body.length > 0 ? article.body.join("\n\n") : "",
      );
      if (mType === "pdf") {
        if (article.mediaUrl?.startsWith("data:")) {
          setPdfDataUrl(article.mediaUrl);
          setPdfFileName(article.links?.[0]?.label || "Documento PDF cargado.pdf");
          setPdfExternalUrl("");
        } else {
          setPdfDataUrl(null);
          setPdfFileName("");
          setPdfExternalUrl(article.mediaUrl ?? "");
        }
      } else {
        setPdfDataUrl(null);
        setPdfFileName("");
        setPdfExternalUrl("");
      }
      setVideoUrl(mType === "video" ? article.mediaUrl ?? "" : "");
      setIndicaciones(article.indicaciones ?? article.summary ?? "");
    } else {
      setTitle("");
      setMediaType("imagen");
      setImageDataUrl(null);
      setImageFileName("");
      setTextContent("");
      setPdfDataUrl(null);
      setPdfFileName("");
      setPdfExternalUrl("");
      setVideoUrl("");
      setIndicaciones("");
    }
    setError(null);
  }, [visible, article]);

  const handlePickImageFile = useCallback(async () => {
    try {
      const picked = await pickArticleImage();
      if (picked) {
        setImageDataUrl(picked.dataUrl);
        setImageFileName(picked.fileName);
        setError(null);
      }
    } catch {
      showToast("No se pudo cargar el archivo de imagen", "error");
    }
  }, [showToast]);

  const handlePickPdfFile = useCallback(async () => {
    try {
      const picked = await pickPdfDocument();
      if (picked) {
        setPdfDataUrl(picked.dataUrl);
        setPdfFileName(picked.fileName);
        setError(null);
      }
    } catch {
      showToast("No se pudo cargar el archivo PDF", "error");
    }
  }, [showToast]);

  const handleSave = useCallback(async () => {
    if (!online) {
      setError("Necesitas conexión a internet para guardar y enviar este contenido.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanIndicaciones = indicaciones.trim();

    if (!cleanTitle) {
      setError("Ingresa el título del contenido educativo.");
      return;
    }

    let finalImageUrl: string | null = null;
    let finalMediaUrl: string | null = null;
    let finalBody: string[] = [];
    let finalLinks = article?.links ?? [];

    if (mediaType === "imagen") {
      if (!imageDataUrl) {
        setError("Sube un archivo de imagen para continuar.");
        return;
      }
      finalImageUrl = imageDataUrl;
      finalMediaUrl = imageDataUrl;
      finalBody = cleanIndicaciones
        ? [cleanIndicaciones]
        : ["Revisa la imagen educativa adjunta por tu obstetra."];
    } else if (mediaType === "lectura") {
      const paragraphs = textContent
        .split(/\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (paragraphs.length === 0) {
        setError("Redacta el mensaje o lectura educativa.");
        return;
      }
      finalBody = paragraphs;
    } else if (mediaType === "pdf") {
      const chosenPdf = pdfDataUrl || pdfExternalUrl.trim();
      if (!chosenPdf) {
        setError("Sube un archivo PDF para continuar.");
        return;
      }
      finalMediaUrl = chosenPdf;
      finalBody = cleanIndicaciones
        ? [cleanIndicaciones]
        : ["Abre el documento PDF adjunto para revisar la guía educativa."];
      if (pdfFileName) {
        finalLinks = [{ label: pdfFileName, url: chosenPdf, kind: "pdf" }];
      }
    } else if (mediaType === "video") {
      const cleanVideo = videoUrl.trim();
      if (!cleanVideo) {
        setError("Pega la URL del video educativo.");
        return;
      }
      finalMediaUrl = cleanVideo;
      finalBody = cleanIndicaciones
        ? [cleanIndicaciones]
        : ["Revisa el video educativo recomendado por tu obstetra."];
    }

    const defaultSummary =
      cleanIndicaciones ||
      (mediaType === "lectura"
        ? finalBody[0]?.slice(0, 160) || cleanTitle
        : mediaType === "imagen"
          ? "Imagen educativa asignada por tu obstetra."
          : mediaType === "pdf"
            ? pdfFileName
              ? `Documento PDF: ${pdfFileName}`
              : "Documento PDF educativo asignado por tu obstetra."
            : "Video educativo recomendado por tu obstetra.");

    setError(null);
    setLoading(true);

    try {
      await adminSaveArticle({
        id: article?.id,
        title: cleanTitle,
        category: article?.category || "Cuidado general",
        summary: defaultSummary,
        body: finalBody,
        indicaciones: cleanIndicaciones || null,
        minutes: article?.minutes || 3,
        imageUrl: finalImageUrl,
        mediaType,
        mediaUrl: finalMediaUrl,
        links: finalLinks,
        active: article ? article.active !== false : true,
        ...(patientId ? { patientId } : {}),
      });

      onClose();

      if (patientId && patientName) {
        showToast(`Contenido asignado y enviado a ${patientName}`, "success");
        showNotice(
          "¡Asignación enviada con éxito!",
          `El contenido "${cleanTitle}" fue guardado y enviado a ${patientName}.`,
        );
      } else {
        showToast(
          article
            ? "Contenido educativo actualizado con éxito"
            : "Contenido educativo guardado con éxito",
          "success",
        );
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al guardar el contenido educativo.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    online,
    title,
    indicaciones,
    mediaType,
    imageDataUrl,
    textContent,
    pdfDataUrl,
    pdfExternalUrl,
    pdfFileName,
    videoUrl,
    article,
    patientId,
    patientName,
    adminSaveArticle,
    onClose,
    showToast,
  ]);

  if (!visible) return null;

  const modalMaxHeight = Math.min(Math.max(Math.round(windowHeight * 0.88), 380), 720);

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
        <View style={[styles.card, { maxHeight: modalMaxHeight }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View
                style={[
                  styles.headerIconWrap,
                  { backgroundColor: withAlpha(accentColor, 0.12) },
                ]}
              >
                <BookOpen size={20} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {article
                    ? "Editar contenido educativo"
                    : patientName
                      ? "Asignar contenido educativo"
                      : "Nuevo contenido educativo"}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {patientName
                    ? `Gestante seleccionada: ${patientName}`
                    : "Panel rápido según el formato elegido"}
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

          {/* Cuerpo desplazable */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {/* Banner de gestante preseleccionada (cuando se abre desde Ficha Gestante) */}
            {patientName ? (
              <View style={styles.patientBanner}>
                <UserCheck size={16} color={warmBlue.main} />
                <Text style={styles.patientBannerText} numberOfLines={1}>
                  Asignación directa para: <Text style={styles.patientBannerBold}>{patientName}</Text>
                </Text>
              </View>
            ) : null}

            {/* 1. Título */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  if (error) setError(null);
                }}
                placeholder="Ej. Alimentación rica en hierro y vitamina C"
                placeholderTextColor={gwarm.inkFaint}
                style={styles.input}
                testID="input-articulo-titulo"
              />
            </View>

            {/* 2. Selector de formato (Imagen, Texto, PDF o Video) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Formato *</Text>
              <View style={styles.formatGrid}>
                {MEDIA_FORMATS.map((fmt) => {
                  const selected = mediaType === fmt.key;
                  const Icon = fmt.icon;
                  return (
                    <Pressable
                      key={fmt.key}
                      onPress={() => {
                        setMediaType(fmt.key);
                        setError(null);
                      }}
                      style={[
                        styles.formatOption,
                        selected && {
                          borderColor: accentColor,
                          backgroundColor: withAlpha(accentColor, 0.1),
                        },
                      ]}
                      testID={`media-type-${fmt.key}`}
                    >
                      <Icon
                        size={18}
                        color={selected ? accentColor : gwarm.inkSoft}
                      />
                      <Text
                        style={[
                          styles.formatOptionText,
                          selected && { color: accentColor, fontWeight: "700" },
                        ]}
                      >
                        {fmt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 3. Sección dinámica condicional según el formato elegido */}
            {mediaType === "imagen" ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Archivo de imagen *</Text>
                {imageDataUrl ? (
                  <View style={styles.uploadedBox}>
                    <Image
                      source={{ uri: imageDataUrl }}
                      style={styles.imagePreview}
                      contentFit="contain"
                    />
                    <View style={styles.uploadedFooter}>
                      <View style={styles.uploadedMeta}>
                        <CheckCircle2 size={16} color={gwarm.teal} />
                        <Text style={styles.uploadedName} numberOfLines={1}>
                          {imageFileName || "Imagen seleccionada"}
                        </Text>
                      </View>
                      <View style={styles.uploadedActions}>
                        <Pressable
                          onPress={() => void handlePickImageFile()}
                          style={styles.smallActionBtn}
                          testID="btn-subir-imagen"
                        >
                          <Upload size={14} color={gwarm.ink} />
                          <Text style={styles.smallActionText}>Cambiar</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setImageDataUrl(null);
                            setImageFileName("");
                          }}
                          style={[
                            styles.smallActionBtn,
                            { backgroundColor: semantic.dangerLight },
                          ]}
                        >
                          <Trash2 size={14} color={semantic.danger} />
                          <Text style={[styles.smallActionText, { color: semantic.danger }]}>
                            Quitar
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => void handlePickImageFile()}
                    style={styles.dropzoneBtn}
                    testID="btn-subir-imagen"
                  >
                    <View
                      style={[
                        styles.dropzoneIconCircle,
                        { backgroundColor: withAlpha(accentColor, 0.12) },
                      ]}
                    >
                      <ImageIcon size={22} color={accentColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropzoneTitle, { color: accentColor }]}>
                        Subir archivo de imagen
                      </Text>
                      <Text style={styles.dropzoneSub}>
                        Selecciona una infografía, foto o afiche desde tu dispositivo (JPG, PNG)
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            ) : null}

            {mediaType === "lectura" ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Mensaje o lectura *</Text>
                <TextInput
                  value={textContent}
                  onChangeText={(t) => {
                    setTextContent(t);
                    if (error) setError(null);
                  }}
                  placeholder="Redacta aquí el mensaje o lectura educativa para la gestante..."
                  placeholderTextColor={gwarm.inkFaint}
                  multiline
                  numberOfLines={5}
                  style={[styles.input, styles.textareaReading]}
                  testID="input-articulo-texto"
                />
              </View>
            ) : null}

            {mediaType === "pdf" ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Archivo PDF *</Text>
                {pdfDataUrl ? (
                  <View style={styles.uploadedBox}>
                    <View style={styles.pdfPreviewRow}>
                      <View style={styles.pdfBadgeIcon}>
                        <FileText size={24} color={warmPlum.main} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.uploadedName} numberOfLines={1}>
                          {pdfFileName || "Documento PDF listo"}
                        </Text>
                        <Text style={styles.pdfReadySub}>
                          Archivo PDF adjuntado correctamente
                        </Text>
                      </View>
                      <CheckCircle2 size={18} color={gwarm.teal} />
                    </View>
                    <View style={styles.uploadedActions}>
                      <Pressable
                        onPress={() => void handlePickPdfFile()}
                        style={styles.smallActionBtn}
                        testID="btn-subir-pdf"
                      >
                        <Upload size={14} color={gwarm.ink} />
                        <Text style={styles.smallActionText}>Cambiar PDF</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setPdfDataUrl(null);
                          setPdfFileName("");
                        }}
                        style={[
                          styles.smallActionBtn,
                          { backgroundColor: semantic.dangerLight },
                        ]}
                      >
                        <Trash2 size={14} color={semantic.danger} />
                        <Text style={[styles.smallActionText, { color: semantic.danger }]}>
                          Quitar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    <Pressable
                      onPress={() => void handlePickPdfFile()}
                      style={styles.dropzoneBtn}
                      testID="btn-subir-pdf"
                    >
                      <View
                        style={[
                          styles.dropzoneIconCircle,
                          { backgroundColor: withAlpha(accentColor, 0.12) },
                        ]}
                      >
                        <FileUp size={22} color={accentColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropzoneTitle, { color: accentColor }]}>
                          Subir archivo PDF
                        </Text>
                        <Text style={styles.dropzoneSub}>
                          Toca para elegir un documento PDF desde tu dispositivo
                        </Text>
                      </View>
                    </Pressable>

                    <TextInput
                      value={pdfExternalUrl}
                      onChangeText={(t) => {
                        setPdfExternalUrl(t);
                        if (error) setError(null);
                      }}
                      placeholder="O pega el enlace directo al PDF (opcional)"
                      placeholderTextColor={gwarm.inkFaint}
                      autoCapitalize="none"
                      keyboardType="url"
                      style={styles.input}
                      testID="input-articulo-pdf-url"
                    />
                  </View>
                )}
              </View>
            ) : null}

            {mediaType === "video" ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>URL del video *</Text>
                <TextInput
                  value={videoUrl}
                  onChangeText={(t) => {
                    setVideoUrl(t);
                    if (error) setError(null);
                  }}
                  placeholder="Pega aquí la URL del video (ej. https://www.youtube.com/watch?v=...)"
                  placeholderTextColor={gwarm.inkFaint}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={styles.input}
                  testID="input-articulo-media-url"
                />
              </View>
            ) : null}

            {/* 4. Indicaciones opcionales (recomendaciones médicas) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Indicaciones (opcional)</Text>
              <TextInput
                value={indicaciones}
                onChangeText={setIndicaciones}
                placeholder="Recomendaciones médicas para la gestante (ej. revisar junto con su pareja antes del próximo control)..."
                placeholderTextColor={gwarm.inkFaint}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textareaIndicaciones]}
                testID="input-articulo-indicaciones"
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* 5. Botón de acción: Guardar y enviar asignación */}
            <View style={styles.actionsRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={onClose}
                  disabled={loading}
                />
              </View>
              <View style={{ flex: 1.6 }}>
                <AppButton
                  title={
                    article
                      ? "Guardar cambios"
                      : patientId
                        ? "Guardar y enviar"
                        : "Guardar contenido"
                  }
                  icon={patientId ? Send : undefined}
                  color={accentColor}
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
    padding: 14,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 560,
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
    fontSize: 13,
    lineHeight: 16,
    color: gwarm.inkSoft,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    minWidth: 42,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flexGrow: 0,
    minHeight: 0,
    ...Platform.select({
      web: {
        overflowY: "auto" as any,
        WebkitOverflowScrolling: "touch" as any,
      },
    }),
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  patientBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: withAlpha(warmBlue.main, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(warmBlue.main, 0.28),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  patientBannerText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.ink,
    flex: 1,
  },
  patientBannerBold: {
    fontFamily: gfonts.hand,
    color: warmBlue.main,
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
  textareaReading: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  textareaIndicaciones: {
    height: 82,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: "top",
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formatOption: {
    flex: 1,
    minWidth: 105,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
    minHeight: 46,
  },
  formatOptionText: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    color: gwarm.inkSoft,
  },
  dropzoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: gwarm.borderStrong,
    borderRadius: 16,
    padding: 14,
    minHeight: 68,
  },
  dropzoneIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dropzoneTitle: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    lineHeight: 20,
  },
  dropzoneSub: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 16,
    color: gwarm.inkSoft,
    marginTop: 2,
  },
  uploadedBox: {
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  imagePreview: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  uploadedFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  uploadedMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  uploadedName: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    color: gwarm.ink,
    flex: 1,
  },
  uploadedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 38,
  },
  smallActionText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.ink,
  },
  pdfPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pdfBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: warmPlum.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfReadySub: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    color: gwarm.tealDeep,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: semantic.dangerLight,
    borderWidth: 1,
    borderColor: withAlpha(semantic.danger, 0.3),
    borderRadius: 12,
    padding: 11,
  },
  errorText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 18,
    color: semantic.danger,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
});

