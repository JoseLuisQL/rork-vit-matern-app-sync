/**
 * Visor Interactivo y Centro de Reportes SaaS de VitMaterna.
 * Previsualización en vivo dentro de la aplicación respetando el diseño
 * cálido y profesional del frontend (warmPlum, gwarm, tipografía y bordes suaves).
 */
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Printer,
  ShieldAlert,
  Users,
  X,
} from "lucide-react-native";
import React, { useState, useMemo, useCallback } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { gfonts, gwarm, warmPlum, warmTeal } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import {
  buildReportHtml,
  exportReportPdf,
  exportReportXlsx,
  periodLabel,
  printReport,
  REPORT_TYPE_LABELS,
  type ReportPeriod,
  type ReportType,
} from "@/lib/reportExport";
import { useApp } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";
import { useToast } from "@/components/Toast";

interface ReportPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  initialReportType?: ReportType;
  initialPeriod?: ReportPeriod;
}

export function ReportPreviewModal({
  visible,
  onClose,
  initialReportType = "ejecutivo",
  initialPeriod = "d30",
}: ReportPreviewModalProps): React.ReactElement | null {
  const { view } = useApp();
  const { show: showToast } = useToast();
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;

  const [reportType, setReportType] = useState<ReportType>(initialReportType);
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod);
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | "print" | null>(null);

  const rawReport = view?.reports?.[period] ?? null;

  const htmlContent = useMemo(() => {
    if (!view || !rawReport) return "";
    return buildReportHtml({
      report: rawReport,
      period,
      view,
      reportType,
    });
  }, [view, rawReport, period, reportType]);

  const handleExportPdf = useCallback(async () => {
    if (!view || !rawReport) return;
    setExporting("pdf");
    try {
      await exportReportPdf({
        report: rawReport,
        period,
        view,
        reportType,
      });
      showToast("Informe PDF descargado exitosamente", "success");
    } catch (e) {
      console.log("[VitMaterna] Error exportar PDF:", e);
      showToast("No se pudo generar el archivo PDF", "error");
    } finally {
      setExporting(null);
    }
  }, [view, rawReport, period, reportType, showToast]);

  const handleExportXlsx = useCallback(async () => {
    if (!view || !rawReport) return;
    setExporting("xlsx");
    try {
      await exportReportXlsx({
        report: rawReport,
        period,
        view,
        reportType,
      });
      showToast("Libro Excel (.xlsx) descargado exitosamente", "success");
    } catch (e) {
      console.log("[VitMaterna] Error exportar Excel:", e);
      showToast("No se pudo generar el archivo Excel", "error");
    } finally {
      setExporting(null);
    }
  }, [view, rawReport, period, reportType, showToast]);

  const handlePrint = useCallback(async () => {
    if (!view || !rawReport) return;
    setExporting("print");
    try {
      await printReport({
        report: rawReport,
        period,
        view,
        reportType,
      });
    } catch (e) {
      console.log("[VitMaterna] Error imprimir:", e);
      showToast("No se pudo abrir la vista de impresión", "error");
    } finally {
      setExporting(null);
    }
  }, [view, rawReport, period, reportType, showToast]);

  if (!visible || !view || !rawReport) return null;

  const tabs: { key: ReportType; label: string; icon: any }[] = [
    { key: "ejecutivo", label: "Ejecutivo MINSA", icon: BarChart3 },
    { key: "padron", label: "Padrón Nominal", icon: Users },
    { key: "territorial", label: "Territorial", icon: MapPin },
    { key: "alertas", label: "Alertas y SOS", icon: ShieldAlert },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
          {/* Barra Superior SaaS */}
          <View style={styles.topToolbar}>
            <View style={styles.titleInfo}>
              <View style={styles.iconWrap}>
                <FileText size={19} color={warmPlum.main} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Centro de Informes y Reportes</Text>
                <Text style={styles.modalSubtitle}>
                  {REPORT_TYPE_LABELS[reportType].title} · C.S. Talavera
                </Text>
              </View>
            </View>

            {/* Acciones de exportación rápidas */}
            <View style={styles.topActions}>
              <AppButton
                title="Descargar PDF"
                icon={Download}
                color={warmPlum.main}
                onPress={() => void handleExportPdf()}
                loading={exporting === "pdf"}
                disabled={exporting !== null}
                small
                testID="btn-modal-pdf"
              />
              <AppButton
                title="Descargar Excel"
                icon={FileSpreadsheet}
                color={gwarm.teal}
                variant="soft"
                onPress={() => void handleExportXlsx()}
                loading={exporting === "xlsx"}
                disabled={exporting !== null}
                small
                testID="btn-modal-excel"
              />
              {Platform.OS === "web" && (
                <PressableScale
                  onPress={() => void handlePrint()}
                  accessibilityLabel="Imprimir"
                  style={styles.printBtn}
                >
                  <Printer size={17} color={gwarm.inkSoft} />
                </PressableScale>
              )}
              <Pressable
                onPress={onClose}
                accessibilityLabel="Cerrar modal"
                style={styles.closeBtn}
              >
                <X size={18} color={gwarm.inkFaint} />
              </Pressable>
            </View>
          </View>

          {/* Barra de Filtros y Módulos de Reporte */}
          <View style={styles.filtersBar}>
            {/* Pestañas de tipo de reporte */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {tabs.map((tab) => {
                const active = reportType === tab.key;
                const TabIcon = tab.icon;
                return (
                  <PressableScale
                    key={tab.key}
                    onPress={() => setReportType(tab.key)}
                    accessibilityLabel={tab.label}
                    style={[styles.tabChip, active && styles.tabChipActive]}
                  >
                    <TabIcon
                      size={14}
                      color={active ? "#FFFFFF" : gwarm.inkSoft}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        active && styles.tabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>

            {/* Selector de Periodo */}
            <View style={styles.periodSelector}>
              <PressableScale
                onPress={() => setPeriod("d30")}
                style={[
                  styles.periodBtn,
                  period === "d30" && styles.periodBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    period === "d30" && styles.periodTextActive,
                  ]}
                >
                  Últimos 30 días
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => setPeriod("total")}
                style={[
                  styles.periodBtn,
                  period === "total" && styles.periodBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    period === "total" && styles.periodTextActive,
                  ]}
                >
                  Histórico
                </Text>
              </PressableScale>
            </View>
          </View>

          {/* Área de Visualización del Documento A4 */}
          <View style={styles.previewCanvas}>
            {Platform.OS === "web" ? (
              <iframe
                title="Vista previa del reporte"
                srcDoc={htmlContent}
                style={{
                  width: "100%",
                  maxWidth: "920px",
                  height: "100%",
                  border: `1.5px solid ${gwarm.border}`,
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(91, 42, 94, 0.08)",
                  margin: "0 auto",
                  display: "block",
                }}
              />
            ) : (
              <ScrollView
                style={styles.mobilePreviewScroll}
                contentContainerStyle={styles.mobilePreviewContent}
              >
                <View style={styles.mobileSheet}>
                  <Text style={styles.mobileSheetTitle}>
                    {REPORT_TYPE_LABELS[reportType].title}
                  </Text>
                  <Text style={styles.mobileSheetSub}>
                    {REPORT_TYPE_LABELS[reportType].subtitle}
                  </Text>
                  <View style={styles.mobileMetaRow}>
                    <Text style={styles.mobileMetaText}>
                      Periodo: {periodLabel(period)}
                    </Text>
                    <Text style={styles.mobileMetaText}>
                      Centro: {view.center.name}
                    </Text>
                  </View>
                  <View style={styles.mobileActions}>
                    <AppButton
                      title="Descargar PDF"
                      icon={Download}
                      color={warmPlum.main}
                      onPress={() => void handleExportPdf()}
                      loading={exporting === "pdf"}
                    />
                    <AppButton
                      title="Descargar Excel"
                      icon={FileSpreadsheet}
                      color={gwarm.teal}
                      variant="soft"
                      onPress={() => void handleExportXlsx()}
                      loading={exporting === "xlsx"}
                    />
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(45, 36, 30, 0.68)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6px)",
      },
    }),
  },
  modalCard: {
    width: "100%",
    height: "94%",
    backgroundColor: gwarm.bg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    ...Platform.select({
      web: {
        boxShadow: "0 25px 50px -12px rgba(45, 36, 30, 0.35)",
      },
      default: {
        elevation: 16,
      },
    }),
  },
  modalCardWide: {
    maxWidth: 1120,
  },
  topToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
  titleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: warmPlum.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 23,
    color: gwarm.ink,
  },
  modalSubtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  printBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  filtersBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    backgroundColor: gwarm.bg,
    gap: 12,
  },
  tabsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    minHeight: 44,
    justifyContent: "center",
  },
  tabChipActive: {
    backgroundColor: warmPlum.main,
    borderColor: warmPlum.main,
  },
  tabText: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    color: gwarm.inkSoft,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: gwarm.surface,
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    minHeight: 44,
    justifyContent: "center",
  },
  periodBtnActive: {
    backgroundColor: warmTeal.soft,
  },
  periodText: {
    fontFamily: gfonts.hand,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
  periodTextActive: {
    color: warmTeal.deep,
    fontWeight: "700",
  },
  previewCanvas: {
    flex: 1,
    backgroundColor: gwarm.bg,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mobilePreviewScroll: {
    flex: 1,
    width: "100%",
  },
  mobilePreviewContent: {
    padding: 12,
  },
  mobileSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: gwarm.border,
    gap: 12,
  },
  mobileSheetTitle: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    color: gwarm.ink,
  },
  mobileSheetSub: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    color: gwarm.inkSoft,
  },
  mobileMetaRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: gwarm.border,
    gap: 4,
  },
  mobileMetaText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
  mobileActions: {
    gap: 10,
    marginTop: 8,
  },
});
