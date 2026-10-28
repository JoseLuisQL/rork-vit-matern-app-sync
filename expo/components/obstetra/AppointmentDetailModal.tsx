/**
 * Modal interactivo de Detalle de Cita Prenatal (Issue #51):
 * Muestra toda la información completa registrada de una cita (motivo exacto,
 * indicaciones/notas adicionales, tipo de atención presencial, fecha/hora,
 * número de control MINSA, obstetra responsable y estado), permite editar el
 * motivo o las notas adicionales, reprogramar fecha/hora, registrar asistencia
 * y eliminar/cancelar la cita programada con confirmación.
 */
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Pencil,
  Stethoscope,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
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
import { gfonts, gShadow, gwarm, warmBlue } from "@/constants/theme";
import { confirmAction } from "@/lib/confirm";
import { capitalize, fechaCompleta, fechaLarga, horaAmigable } from "@/lib/format";
import type { Appointment, PatientView } from "@/types";
import { AppButton } from "@/components/AppButton";
import { StatusWord } from "@/components/Badges";

const accent = warmBlue;

export interface AppointmentDetailModalProps {
  visible: boolean;
  appointment: Appointment | null;
  patient: PatientView | null;
  obstetraName?: string;
  onClose: () => void;
  onReschedule?: (appointment: Appointment) => void;
  onMarkStatus?: (appointment: Appointment, estado: "asistida" | "no_asistida") => void;
  onUpdateDetails?: (
    appointment: Appointment,
    fields: { motivo: string; notas?: string; lugar?: string },
  ) => void;
  onDelete: (appointment: Appointment) => void;
}

function statusDescription(estado: Appointment["estado"]): {
  label: string;
  detail: string;
  color: string;
  bg: string;
} {
  switch (estado) {
    case "confirmada":
      return {
        label: "Confirmada por la paciente",
        detail: "La gestante confirmó su asistencia desde el aplicativo.",
        color: gwarm.tealDeep,
        bg: gwarm.tealSoft,
      };
    case "solicitud_reprogramacion":
      return {
        label: "Pidió cambio de fecha",
        detail: "La gestante solicitó reprogramar esta cita para otro horario o fecha.",
        color: gwarm.amber,
        bg: gwarm.amberSoft,
      };
    case "asistida":
      return {
        label: "Cita atendida (Asistió)",
        detail: "La paciente acudió puntualmente a su atención prenatal.",
        color: gwarm.tealDeep,
        bg: gwarm.tealSoft,
      };
    case "no_asistida":
      return {
        label: "Inasistencia registrada (Faltó)",
        detail: "La paciente no asistió a la cita programada.",
        color: gwarm.rose,
        bg: gwarm.roseSoft,
      };
    case "programada":
    default:
      return {
        label: "Programada (Pendiente de atención)",
        detail: "Cita activa en la agenda del establecimiento de salud.",
        color: accent.deep,
        bg: accent.soft,
      };
  }
}

export function AppointmentDetailModal({
  visible,
  appointment,
  patient,
  obstetraName,
  onClose,
  onReschedule,
  onMarkStatus,
  onUpdateDetails,
  onDelete,
}: AppointmentDetailModalProps): React.ReactElement | null {
  const { height: windowHeight } = useWindowDimensions();
  const modalMaxHeight = Math.max(400, Math.round(windowHeight * 0.88));

  const [editing, setEditing] = useState<boolean>(false);
  const [motivoDraft, setMotivoDraft] = useState<string>("");
  const [notasDraft, setNotasDraft] = useState<string>("");
  const [lugarDraft, setLugarDraft] = useState<string>("");

  useEffect(() => {
    if (appointment) {
      setMotivoDraft(appointment.motivo);
      setNotasDraft(appointment.notas ?? "");
      setLugarDraft(appointment.lugar || "C.S. Talavera");
      setEditing(false);
    }
  }, [appointment]);

  if (!appointment) return null;

  const statusInfo = statusDescription(appointment.estado);
  const isEditable =
    appointment.estado === "programada" ||
    appointment.estado === "confirmada" ||
    appointment.estado === "solicitud_reprogramacion";

  const handleSaveDetails = () => {
    if (!onUpdateDetails) return;
    const cleanMotivo = motivoDraft.trim() || appointment.motivo;
    onUpdateDetails(appointment, {
      motivo: cleanMotivo,
      notas: notasDraft.trim(),
      lugar: lugarDraft.trim() || appointment.lugar,
    });
    setEditing(false);
  };

  const handleConfirmDelete = async () => {
    const ok = await confirmAction({
      title: "Eliminar cita programada",
      message: `¿Estás segura de que deseas eliminar la cita "${appointment.motivo}" del ${fechaCompleta(appointment.dateKey)} a las ${horaAmigable(appointment.time)}? Esta acción liberará el horario en la agenda.`,
      confirmText: "Sí, eliminar cita",
      destructive: true,
    });
    if (!ok) return;
    onDelete(appointment);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { maxHeight: modalMaxHeight }]}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <CalendarDays size={22} color={accent.main} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>Detalle de la cita</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {patient
                  ? `${patient.firstName} ${patient.lastName} · DNI ${patient.dni}`
                  : "Cita prenatal registrada"}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={10}
              accessibilityLabel="Cerrar detalle de cita"
            >
              <X size={20} color={gwarm.inkSoft} />
            </Pressable>
          </View>

          <ScrollView
            style={[
              styles.scroll,
              Platform.OS === "web" &&
                ({ WebkitOverflowScrolling: "touch", overflowY: "auto" } as object),
            ]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Banner de estado */}
            <View style={[styles.statusBanner, { backgroundColor: statusInfo.bg }]}>
              <View style={styles.statusBannerTop}>
                <Text style={[styles.statusBannerTitle, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
                <StatusWord estado={appointment.estado} />
              </View>
              <Text style={styles.statusBannerDesc}>{statusInfo.detail}</Text>
            </View>

            {/* Bloque principal: Motivo completo e Indicaciones */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleLeft}>
                  <ClipboardList size={17} color={accent.main} />
                  <Text style={styles.sectionTitle}>Motivo e indicaciones de la cita</Text>
                </View>
                {onUpdateDetails ? (
                  <Pressable
                    onPress={() => setEditing((v) => !v)}
                    style={styles.editBadgeBtn}
                    testID="btn-editar-detalle-cita"
                  >
                    <Pencil size={13} color={accent.main} />
                    <Text style={styles.editBadgeText}>
                      {editing ? "Cancelar" : "Editar"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {editing ? (
                <View style={styles.editForm}>
                  <Text style={styles.fieldLabel}>Motivo exacto de la cita</Text>
                  <TextInput
                    value={motivoDraft}
                    onChangeText={setMotivoDraft}
                    placeholder="Ej. Control prenatal 2 de 8, Ecografía obstétrica…"
                    placeholderTextColor={gwarm.inkFaint}
                    style={styles.input}
                    maxLength={160}
                    testID="input-editar-motivo-cita"
                  />

                  <Text style={styles.fieldLabel}>
                    Indicaciones o notas adicionales para la paciente
                  </Text>
                  <TextInput
                    value={notasDraft}
                    onChangeText={setNotasDraft}
                    placeholder="Ej. Acudir en ayunas para tamizaje de hemoglobina, traer carné perinatal…"
                    placeholderTextColor={gwarm.inkFaint}
                    style={[styles.input, styles.textArea]}
                    multiline
                    maxLength={500}
                    testID="input-editar-notas-cita"
                  />

                  <Text style={styles.fieldLabel}>Lugar / Consultorio de atención</Text>
                  <TextInput
                    value={lugarDraft}
                    onChangeText={setLugarDraft}
                    placeholder="Ej. C.S. Talavera - Consultorio Obstétrico 1"
                    placeholderTextColor={gwarm.inkFaint}
                    style={styles.input}
                    maxLength={120}
                  />

                  <AppButton
                    title="Guardar cambios de la cita"
                    onPress={handleSaveDetails}
                    color={accent.main}
                    small
                    testID="btn-guardar-detalle-cita"
                  />
                </View>
              ) : (
                <>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxLabel}>Motivo registrado</Text>
                    <Text style={styles.motivoFullText} testID="detalle-cita-motivo">
                      {appointment.motivo}
                    </Text>
                  </View>

                  {appointment.control !== null ? (
                    <View style={styles.controlTagRow}>
                      <Stethoscope size={15} color={accent.deep} />
                      <Text style={styles.controlTagText}>
                        Control prenatal MINSA #{appointment.control} de 8
                        {appointment.week !== null ? ` · Semana estimada ${appointment.week}` : ""}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.notesBox}>
                    <View style={styles.notesHeader}>
                      <FileText size={15} color={gwarm.inkSoft} />
                      <Text style={styles.detailBoxLabel}>Indicaciones y notas adicionales</Text>
                    </View>
                    <Text style={styles.notesText} testID="detalle-cita-notas">
                      {appointment.notas && appointment.notas.trim().length > 0
                        ? appointment.notas
                        : "Acudir 15 minutos antes con su DNI y carné perinatal. Si presenta algún signo de alarma, acudir de inmediato por emergencia."}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Fecha, hora y modalidad de atención */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Programación y modalidad de atención</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <CalendarDays size={16} color={accent.main} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Fecha programada</Text>
                  <Text style={styles.infoValue}>
                    {capitalize(fechaLarga(appointment.dateKey))} ({fechaCompleta(appointment.dateKey)})
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Clock size={16} color={accent.main} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Horario de atención</Text>
                  <Text style={styles.infoValue}>
                    A las {horaAmigable(appointment.time)} ({appointment.time} hrs)
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <MapPin size={16} color={gwarm.tealDeep} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Tipo de atención y establecimiento</Text>
                  <Text style={styles.infoValue}>
                    Atención Presencial · {appointment.lugar || "C.S. Talavera"}
                  </Text>
                </View>
              </View>

              {obstetraName ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <UserRound size={16} color={accent.main} />
                  </View>
                  <View style={styles.infoTextCol}>
                    <Text style={styles.infoLabel}>Obstetra responsable</Text>
                    <Text style={styles.infoValue}>{obstetraName}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Acciones de estado / reprogramación */}
            <View style={styles.actionsSection}>
              {onMarkStatus ? (
                <View style={styles.attendanceRow}>
                  <AppButton
                    title="Marcar Asistió"
                    onPress={() => {
                      onMarkStatus(appointment, "asistida");
                      onClose();
                    }}
                    color={gwarm.teal}
                    variant={appointment.estado === "asistida" ? "solid" : "soft"}
                    icon={CheckCircle2}
                    small
                    style={styles.flex}
                    testID="modal-btn-asistio"
                  />
                  <AppButton
                    title="Marcar Faltó"
                    onPress={() => {
                      onMarkStatus(appointment, "no_asistida");
                      onClose();
                    }}
                    color={gwarm.rose}
                    variant={appointment.estado === "no_asistida" ? "solid" : "soft"}
                    icon={XCircle}
                    small
                    style={styles.flex}
                    testID="modal-btn-falto"
                  />
                </View>
              ) : null}

              {onReschedule && isEditable ? (
                <AppButton
                  title="Reprogramar fecha u hora"
                  onPress={() => {
                    onClose();
                    onReschedule(appointment);
                  }}
                  color={accent.main}
                  variant="outline"
                  icon={CalendarClock}
                  small
                  testID="modal-btn-reprogramar"
                />
              ) : null}

              <AppButton
                title="Eliminar / Cancelar cita"
                onPress={() => void handleConfirmDelete()}
                color={gwarm.rose}
                variant="outline"
                icon={Trash2}
                small
                testID="modal-btn-eliminar-cita"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton title="Cerrar" onPress={onClose} color={accent.main} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 26, 20, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    flexShrink: 1,
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    overflow: "hidden",
    ...gShadow,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    backgroundColor: gwarm.surface,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: accent.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    color: gwarm.ink,
  },
  subtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.inkSoft,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: gwarm.surfaceSoft,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statusBanner: {
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  statusBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusBannerTitle: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    flex: 1,
  },
  statusBannerDesc: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.inkSoft,
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: gwarm.surfaceSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 14,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    color: gwarm.ink,
  },
  editBadgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: accent.soft,
  },
  editBadgeText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    color: accent.main,
  },
  detailBox: {
    backgroundColor: gwarm.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 12,
    gap: 4,
  },
  detailBoxLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    color: gwarm.inkSoft,
  },
  motivoFullText: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 24,
    color: gwarm.ink,
  },
  controlTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: accent.soft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controlTagText: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    color: accent.deep,
  },
  notesBox: {
    backgroundColor: gwarm.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 12,
    gap: 6,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notesText: {
    fontFamily: gfonts.handBody,
    fontSize: 14.5,
    lineHeight: 20,
    color: gwarm.ink,
  },
  editForm: {
    gap: 10,
  },
  fieldLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.inkSoft,
  },
  input: {
    backgroundColor: gwarm.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: gwarm.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: gfonts.handBody,
    fontSize: 15,
    color: gwarm.ink,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoTextCol: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    color: gwarm.inkSoft,
  },
  infoValue: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  actionsSection: {
    gap: 10,
  },
  attendanceRow: {
    flexDirection: "row",
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    backgroundColor: gwarm.surface,
  },
});
