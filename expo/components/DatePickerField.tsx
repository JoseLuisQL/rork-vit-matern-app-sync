/**
 * VITMATERNA — Selector de fecha y calendario profesional ("Cuaderno de Cuidado").
 * Diseñado cuidadosamente para web y móvil:
 * - Campo disparador táctil con icono de calendario y etiqueta de fecha formateada.
 * - Modal responsivo centrado / popover con fondo translúcido y esquinas suaves.
 * - Vista de cuadrícula de días (Lun-Dom) con indicador de "Hoy" y selección activa.
 * - Selector rápido de Mes y Año en 2 toques (sin tener que avanzar 10 meses uno a uno).
 * - Atajos rápidos (Hoy, Hace 1 mes, Hace 2 meses, Hace 3 meses, etc.).
 * - Vista previa clínica automática para FUM (semana gestacional calculada y FPP estimada).
 * - Compatible con web (clic, puntero, modal) y móvil (haptics, toque responsivo).
 */
import * as Haptics from "expo-haptics";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import { gfonts, gShadow, gwarm, warmBlue } from "@/constants/theme";
import {
  CALENDAR_DOW_HEADERS,
  CALENDAR_MONTHS_FULL,
  CALENDAR_MONTHS_SHORT,
  calculateFumPreview,
  generateMonthGrid,
  getCalendarPresets,
} from "@/lib/calendar";
import {
  addDaysToKey,
  dateFromKey,
  fechaCompleta,
  todayKeyLocal,
} from "@/lib/format";
import { weeksLocal } from "@/lib/optimistic";

export interface DatePickerFieldProps {
  label: string;
  value: string; // "AAAA-MM-DD"
  onChangeDate: (dateKey: string) => void;
  placeholder?: string;
  error?: string | null;
  hint?: string;
  accent?: string;
  minDate?: string; // "AAAA-MM-DD"
  maxDate?: string; // "AAAA-MM-DD"
  isFum?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function DatePickerField({
  label,
  value,
  onChangeDate,
  placeholder = "Seleccionar fecha (AAAA-MM-DD)",
  error,
  hint,
  accent = warmBlue.main,
  minDate,
  maxDate,
  isFum = false,
  clearable = true,
  disabled = false,
  style,
  testID,
}: DatePickerFieldProps): React.ReactElement {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const today = useMemo(() => todayKeyLocal(), []);

  // Límites por defecto si es FUM: no puede ser fecha futura, y máximo 300 días atrás (~42 semanas)
  const effectiveMaxDate = maxDate ?? (isFum ? today : undefined);
  const effectiveMinDate = minDate ?? (isFum ? addDaysToKey(today, -300) : undefined);

  // Fecha de referencia para navegación en el calendario
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return dateFromKey(value);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [pickerMode, setPickerMode] = useState<"days" | "months">("days");

  // Valor temporal mientras el modal está abierto
  const [tempSelected, setTempSelected] = useState<string>(value || "");

  const openModal = useCallback(() => {
    if (disabled) return;
    const baseDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? dateFromKey(value) : new Date();
    setViewYear(baseDate.getFullYear());
    setViewMonth(baseDate.getMonth());
    setTempSelected(value || "");
    setPickerMode("days");
    setModalVisible(true);
  }, [disabled, value]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleSelectDay = useCallback(
    (key: string, isDisabled: boolean) => {
      if (isDisabled) return;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      setTempSelected(key);
      const parsed = dateFromKey(key);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (tempSelected) {
      onChangeDate(tempSelected);
    }
    closeModal();
  }, [tempSelected, onChangeDate, closeModal]);

  const handleClear = useCallback(() => {
    onChangeDate("");
    setTempSelected("");
    closeModal();
  }, [onChangeDate, closeModal]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const grid = useMemo(
    () =>
      generateMonthGrid(
        viewYear,
        viewMonth,
        tempSelected || null,
        today,
        effectiveMinDate,
        effectiveMaxDate,
      ),
    [viewYear, viewMonth, tempSelected, today, effectiveMinDate, effectiveMaxDate],
  );

  // Cálculos clínicos en vivo para FUM
  const fumPreview = useMemo(() => {
    if (!isFum) return null;
    return calculateFumPreview(tempSelected, today);
  }, [isFum, tempSelected, today]);

  // Atajos rápidos según el modo
  const presets = useMemo(() => {
    return getCalendarPresets(isFum, today, effectiveMinDate, effectiveMaxDate);
  }, [isFum, today, effectiveMinDate, effectiveMaxDate]);

  // Años disponibles para selector de año
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = effectiveMinDate ? dateFromKey(effectiveMinDate).getFullYear() : currentYear - 3;
    const maxYear = effectiveMaxDate ? dateFromKey(effectiveMaxDate).getFullYear() : currentYear + 2;
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [effectiveMinDate, effectiveMaxDate]);

  const hasValue = Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  const hasError = Boolean(error && error.length > 0);

  // Formato amigable en el campo disparador
  const displayFormatted = useMemo(() => {
    if (!hasValue) return null;
    return fechaCompleta(value);
  }, [hasValue, value]);

  // Gestational badge en el campo disparador si es FUM
  const triggerBadge = useMemo(() => {
    if (!isFum || !hasValue) return null;
    const w = weeksLocal(value, today);
    return `Semana ${w}`;
  }, [isFum, hasValue, value, today]);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={openModal}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${hasValue ? displayFormatted : placeholder}`}
        testID={testID}
        style={[
          styles.trigger,
          hasError && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
          <CalendarDays size={18} color={accent} />
        </View>

        <View style={styles.triggerContent}>
          {hasValue ? (
            <View style={styles.valueRow}>
              <Text style={styles.valueText} numberOfLines={1}>
                {displayFormatted}
              </Text>
              {triggerBadge ? (
                <View style={[styles.badge, { backgroundColor: `${accent}1A` }]}>
                  <Text style={[styles.badgeText, { color: accent }]}>{triggerBadge}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.placeholderText} numberOfLines={1}>
              {placeholder}
            </Text>
          )}
        </View>

        {clearable && hasValue && !disabled ? (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
            accessibilityLabel="Borrar fecha"
          >
            <X size={16} color={gwarm.inkFaint} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}

      {/* Modal de Calendario */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Header del Calendario */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleWrap}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setPickerMode((mode) => (mode === "days" ? "months" : "days"))
                      }
                      style={styles.monthSelectorBtn}
                    >
                      <Text style={styles.monthTitle}>
                        {CALENDAR_MONTHS_FULL[viewMonth]} {viewYear}
                      </Text>
                      <Text style={[styles.monthToggleIcon, { color: accent }]}>
                        {pickerMode === "days" ? " ▾" : " ▴"}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.modalSub}>
                      {isFum
                        ? "Selecciona el 1er día de la última regla"
                        : "Selecciona el día en el calendario"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={closeModal}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.closeBtn}
                  >
                    <X size={20} color={gwarm.inkSoft} />
                  </TouchableOpacity>
                </View>

                {/* Atajos Rápidos */}
                <View style={styles.presetsRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetsScroll}
                  >
                    {presets.map((preset) => {
                      const isPresetSelected = tempSelected === preset.key;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          activeOpacity={0.7}
                          onPress={() => {
                            setTempSelected(preset.key);
                            const parsed = dateFromKey(preset.key);
                            setViewYear(parsed.getFullYear());
                            setViewMonth(parsed.getMonth());
                            if (Platform.OS !== "web") {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                                () => {},
                              );
                            }
                          }}
                          style={[
                            styles.presetChip,
                            isPresetSelected && {
                              backgroundColor: accent,
                              borderColor: accent,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.presetChipText,
                              isPresetSelected && { color: "#FFFFFF" },
                            ]}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Vista 1: Selector de Meses y Años */}
                {pickerMode === "months" ? (
                  <View style={styles.monthPickerContainer}>
                    {/* Selector de Año */}
                    <View style={styles.yearNavRow}>
                      <Text style={styles.yearNavLabel}>Año</Text>
                      <View style={styles.yearButtonsWrap}>
                        {availableYears.map((yr) => {
                          const isCurYear = yr === viewYear;
                          return (
                            <TouchableOpacity
                              key={yr}
                              onPress={() => setViewYear(yr)}
                              style={[
                                styles.yearChip,
                                isCurYear && { backgroundColor: accent, borderColor: accent },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.yearChipText,
                                  isCurYear && { color: "#FFFFFF" },
                                ]}
                              >
                                {yr}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Grid de 12 Meses */}
                    <Text style={styles.yearNavLabel}>Mes</Text>
                    <View style={styles.monthsGrid}>
                      {CALENDAR_MONTHS_SHORT.map((mShort, idx) => {
                        const isCurMonth = idx === viewMonth;
                        return (
                          <TouchableOpacity
                            key={mShort}
                            activeOpacity={0.7}
                            onPress={() => {
                              setViewMonth(idx);
                              setPickerMode("days");
                            }}
                            style={[
                              styles.monthGridCell,
                              isCurMonth && { backgroundColor: accent, borderColor: accent },
                            ]}
                          >
                            <Text
                              style={[
                                styles.monthGridCellText,
                                isCurMonth && { color: "#FFFFFF" },
                              ]}
                            >
                              {mShort}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  /* Vista 2: Calendario Cuadrícula de Días */
                  <View style={styles.calendarBody}>
                    {/* Navegación Mes Anterior / Siguiente */}
                    <View style={styles.monthControlsRow}>
                      <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={prevMonth}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.navArrow}
                        accessibilityLabel="Mes anterior"
                      >
                        <ChevronLeft size={20} color={accent} />
                      </TouchableOpacity>

                      <Text style={styles.currentMonthHeader}>
                        {CALENDAR_MONTHS_FULL[viewMonth]} {viewYear}
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={nextMonth}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.navArrow}
                        accessibilityLabel="Mes siguiente"
                      >
                        <ChevronRight size={20} color={accent} />
                      </TouchableOpacity>
                    </View>

                    {/* Días de la semana */}
                    <View style={styles.dowRow}>
                      {CALENDAR_DOW_HEADERS.map((dow, i) => (
                        <Text
                          key={dow}
                          style={[
                            styles.dowText,
                            (i === 5 || i === 6) && styles.dowWeekend,
                          ]}
                        >
                          {dow}
                        </Text>
                      ))}
                    </View>

                    {/* Días del Mes */}
                    <View style={styles.daysGrid}>
                      {grid.map((cell) => {
                        const cellAccent = cell.isSelected ? accent : undefined;
                        return (
                          <TouchableOpacity
                            key={cell.dateKey}
                            activeOpacity={cell.isDisabled ? 1 : 0.7}
                            disabled={cell.isDisabled}
                            onPress={() => handleSelectDay(cell.dateKey, cell.isDisabled)}
                            style={[
                              styles.dayCell,
                              cell.isSelected && { backgroundColor: cellAccent },
                              cell.isToday &&
                                !cell.isSelected && {
                                  borderColor: accent,
                                  borderWidth: 1.5,
                                },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayCellText,
                                !cell.isCurrentMonth && styles.dayCellTextMuted,
                                cell.isSelected && styles.dayCellTextSelected,
                                cell.isDisabled && styles.dayCellTextDisabled,
                              ]}
                            >
                              {cell.dayNumber}
                            </Text>
                            {cell.isToday && !cell.isSelected ? (
                              <View style={[styles.todayDot, { backgroundColor: accent }]} />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Vista Previa Clínica en vivo (FUM) */}
                {fumPreview ? (
                  <View style={styles.previewBox}>
                    <View style={styles.previewTop}>
                      <Sparkles size={16} color={gwarm.tealDeep} />
                      <Text style={styles.previewTitle}>
                        Semana {fumPreview.weeks}
                        {fumPreview.extraDays > 0 ? ` +${fumPreview.extraDays}d` : ""} ·{" "}
                        {fumPreview.trimester}
                      </Text>
                    </View>
                    <Text style={styles.previewSub}>
                      FPP: {fechaCompleta(fumPreview.fpp)}
                    </Text>
                  </View>
                ) : tempSelected ? (
                  <View style={styles.selectedDateBadge}>
                    <CalendarIcon size={14} color={accent} />
                    <Text style={styles.selectedDateBadgeText}>
                      {fechaCompleta(tempSelected)}
                    </Text>
                  </View>
                ) : null}

                {/* Footer de Acciones */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={closeModal}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!tempSelected}
                    onPress={handleConfirm}
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: accent },
                      !tempSelected && styles.confirmBtnDisabled,
                    ]}
                  >
                    <Check size={17} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.confirmBtnText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  label: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
    cursor: Platform.OS === "web" ? "pointer" : undefined,
  },
  triggerError: {
    borderColor: gwarm.rose,
    backgroundColor: gwarm.surface,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerContent: {
    flex: 1,
    minWidth: 0,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  valueText: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    color: gwarm.ink,
    lineHeight: 21,
  },
  placeholderText: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    color: gwarm.inkFaint,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: gfonts.hand,
    fontSize: 13,
    lineHeight: 16,
  },
  clearBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  errorText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.rose,
  },
  hintText: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(22, 36, 43, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: gwarm.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 18,
    gap: 14,
    ...gShadow,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    paddingBottom: 12,
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  monthSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  monthTitle: {
    fontFamily: gfonts.hand,
    fontSize: 22,
    lineHeight: 27,
    color: gwarm.ink,
  },
  monthToggleIcon: {
    fontFamily: gfonts.hand,
    fontSize: 18,
  },
  modalSub: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
  },

  /* ATTAJOS / PRESETS */
  presetsRow: {
    marginHorizontal: -6,
  },
  presetsScroll: {
    paddingHorizontal: 6,
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
  },
  presetChipText: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    lineHeight: 18,
    color: gwarm.ink,
  },

  /* BODY CALENDARIO */
  calendarBody: {
    gap: 10,
  },
  monthControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
  },
  currentMonthHeader: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 22,
    color: gwarm.ink,
  },
  dowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
  },
  dowText: {
    flex: 1,
    textAlign: "center",
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    color: gwarm.inkSoft,
  },
  dowWeekend: {
    color: gwarm.inkFaint,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: "14.285%",
    aspectRatio: 1.05,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    position: "relative",
  },
  dayCellText: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 21,
    color: gwarm.ink,
  },
  dayCellTextMuted: {
    color: gwarm.inkFaint,
    opacity: 0.45,
  },
  dayCellTextSelected: {
    color: "#FFFFFF",
  },
  dayCellTextDisabled: {
    color: gwarm.inkFaint,
    opacity: 0.25,
  },
  todayDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  /* SELECTOR DE MESES Y AÑOS */
  monthPickerContainer: {
    gap: 12,
    paddingVertical: 6,
  },
  yearNavRow: {
    gap: 6,
  },
  yearNavLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
  yearButtonsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
  },
  yearChipText: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    color: gwarm.ink,
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthGridCell: {
    width: "22.5%",
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
  },
  monthGridCellText: {
    fontFamily: gfonts.hand,
    fontSize: 15,
    color: gwarm.ink,
  },

  /* CLINICAL PREVIEW */
  previewBox: {
    backgroundColor: gwarm.tealSoft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: gwarm.tealMid,
    padding: 11,
    gap: 3,
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewTitle: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 20,
    color: gwarm.tealDeep,
  },
  previewSub: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 18,
    color: gwarm.ink,
  },
  selectedDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: gwarm.surfaceSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  selectedDateBadgeText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.ink,
  },

  /* FOOTER */
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    paddingTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  cancelBtnText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    color: gwarm.inkSoft,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
