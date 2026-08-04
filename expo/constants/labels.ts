/** VITMATERNA — Etiquetas y constantes de presentación (el cálculo vive en el servidor). */
import type { AlertType, AnemiaClass, AppointmentStatus, RiskLevel, Role } from "@/types";

export const RISK_LABEL: Record<RiskLevel, string> = {
  verde: "Riesgo bajo",
  amarillo: "Riesgo medio",
  rojo: "Riesgo alto",
};

export const ANEMIA_LABEL: Record<AnemiaClass, string> = {
  normal: "Sin anemia",
  leve: "Anemia leve",
  moderada: "Anemia moderada",
  severa: "Anemia severa",
};

export const ROLE_LABEL: Record<Role, string> = {
  gestante: "Gestante",
  obstetra: "Obstetra",
  admin: "Administración",
};

/** Estados de cita en una sola palabra (claridad ante todo). */
export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  programada: "Pendiente",
  confirmada: "Confirmada",
  asistida: "Asistida",
  no_asistida: "Faltó",
  solicitud_reprogramacion: "Cambio pedido",
};

/** Nivel de riesgo en una palabra (para filtros y listas). */
export const RISK_WORD: Record<RiskLevel, string> = {
  verde: "Bajo",
  amarillo: "Medio",
  rojo: "Alto",
};

export const ALERT_LABEL: Record<AlertType, string> = {
  emergencia: "Emergencia",
  alarma: "Signos de alarma",
  inasistencia: "Inasistencia",
  adherencia: "Adherencia baja",
  anemia: "Anemia",
  sin_control: "Sin control",
};

/** Horarios de la agenda del centro de salud (08:00–16:30, cada 30 min). */
export const AGENDA_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 16; h++) {
    out.push(`${`${h}`.padStart(2, "0")}:00`);
    out.push(`${`${h}`.padStart(2, "0")}:30`);
  }
  return out;
})();

export const ALTITUDE_MSNM = 2926;
