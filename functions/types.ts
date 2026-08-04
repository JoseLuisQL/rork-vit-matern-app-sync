/**
 * VITMATERNA — Tipos compartidos del servidor.
 * El servidor es la única fuente de verdad: guarda usuarios, pacientes,
 * citas, tomas, mensajes, alertas y visitas, y calcula todo lo clínico.
 */

export type Role = "gestante" | "obstetra" | "admin";

export type RiskLevel = "verde" | "amarillo" | "rojo";

export type AnemiaClass = "normal" | "leve" | "moderada" | "severa";

export type AppointmentStatus =
  | "programada"
  | "confirmada"
  | "asistida"
  | "no_asistida"
  | "solicitud_reprogramacion";

export interface StoredUser {
  dni: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  active: boolean;
  patientId?: string;
  phone?: string;
  createdAtISO: string;
  /** Versión de la foto de perfil (sube al cambiarla; sirve para el caché). */
  avatarVersion?: number;
}

/** Usuario visible por el cliente (sin contraseña). */
export type PublicUser = Omit<StoredUser, "password">;

export interface Patient {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  age: number;
  community: string;
  phone: string;
  /** Fecha de última menstruación como día local Perú (YYYY-MM-DD). */
  fumKey: string;
  gestas: number;
  cesareas: number;
  abortos: number;
  obitoFetal: boolean;
  rhSensibilizado: boolean;
  antecedentes: string[];
  hbObserved: number;
  bpSys: number;
  bpDia: number;
  imc: number;
  /** Adherencia base (%) para pacientes sin registro diario. */
  adherenceBase: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  /** Número de control MINSA (1–8) o null para citas adicionales. */
  control: number | null;
  week: number | null;
  /** Día local Perú YYYY-MM-DD. */
  dateKey: string;
  /** HH:MM */
  time: string;
  motivo: string;
  estado: AppointmentStatus;
  lugar: string;
}

export interface Supplement {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  schedule: string;
  /** Tomas por día (1–6). Los registros antiguos sin el campo valen 1. */
  timesPerDay?: number;
  /** Día (YYYY-MM-DD) desde el que se espera la toma; ausente = desde siempre. */
  startKey?: string;
}

/**
 * patientId → (YYYY-MM-DD → ids de suplementos tomados).
 * Un id repetido representa varias tomas del mismo medicamento ese día.
 */
export type IntakeMap = Record<string, Record<string, string[]>>;

export type MessageKind = "text" | "emergencia" | "alarma";

export interface Message {
  id: string;
  /** id de conversación = id de la paciente. */
  convId: string;
  sender: "gestante" | "obstetra";
  kind: MessageKind;
  text: string;
  atISO: string;
  readByGestante: boolean;
  readByObstetra: boolean;
}

export type AlertType =
  | "emergencia"
  | "alarma"
  | "inasistencia"
  | "adherencia"
  | "anemia"
  | "sin_control";

export interface Alert {
  id: string;
  type: AlertType;
  patientId: string;
  atISO: string;
  title: string;
  detail: string;
  status: "abierta" | "atendida";
  note?: string;
  attendedAtISO?: string;
  lat?: number | null;
  lng?: number | null;
}

export type VisitStatus = "programada" | "realizada";

export interface Visit {
  id: string;
  patientId: string;
  dateKey: string;
  time: string;
  motivo: string;
  estado: VisitStatus;
  resultado?: string;
  createdAtISO: string;
}

/** Ficha calculada por el servidor (cálculos clínicos del lado servidor). */
export interface PatientView extends Patient {
  weeks: number;
  daysExtra: number;
  trimester: 1 | 2 | 3;
  fppKey: string;
  hbCorrected: number;
  anemia: AnemiaClass;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: string[];
  adherence30: number;
  streak: number;
  nextAppointment: Appointment | null;
  /** Versión de la foto de perfil del usuario vinculado (por DNI). */
  avatarVersion?: number;
}

/**
 * Presencia de chat calculada por el servidor (efímera, solo en memoria):
 * en línea, última conexión y si está escribiendo en la conversación.
 */
export interface PresenceView {
  online: boolean;
  lastSeenISO: string | null;
  typing: boolean;
}

export interface ReportBlock {
  gestantes: number;
  riesgo: Record<RiskLevel, number>;
  anemia: Record<AnemiaClass, number>;
  controlesOportunos: { asistidos: number; esperados: number; pct: number };
  adherenciaPromedio: number;
  coberturaSuplementacion: number;
  asistencia: { asistidas: number; noAsistidas: number; pct: number };
  alertas: { total: number; atendidas: number; abiertas: number; pct: number };
  citasHoy: number;
}

export interface Snapshot {
  serverTimeISO: string;
  todayKey: string;
  me: PublicUser;
  center: { name: string; altitudeMsnm: number; hbFactor: number };
  patients: PatientView[];
  appointments: Appointment[];
  supplements: Supplement[];
  intakes: IntakeMap;
  messages: Message[];
  alerts: Alert[];
  visits: Visit[];
  /**
   * Presencia por interlocutor: la gestante ve la clave "obstetra" y la
   * obstetra ve una clave por cada id de paciente (su conversación).
   */
  presence?: Record<string, PresenceView>;
  users?: PublicUser[];
  reports?: { d30: ReportBlock; total: ReportBlock };
}

/** Campos de un medicamento asignado por la obstetra. */
export interface SupplementFields {
  name: string;
  dose: string;
  schedule: string;
  timesPerDay: number;
}

/** Campos editables de la ficha clínica (solo obstetra/admin). */
export interface PatientUpdateFields {
  age?: number;
  community?: string;
  phone?: string;
  fumKey?: string;
  gestas?: number;
  cesareas?: number;
  abortos?: number;
  hbObserved?: number;
  bpSys?: number;
  bpDia?: number;
  imc?: number;
}

/** Acciones encolables (offline-first). Idempotentes por id. */
export type ClientAction =
  | { id: string; atISO: string; type: "confirm_appointment"; appointmentId: string }
  | { id: string; atISO: string; type: "request_reschedule"; appointmentId: string }
  | {
      id: string;
      atISO: string;
      type: "set_appointment_status";
      appointmentId: string;
      estado: "asistida" | "no_asistida";
    }
  | {
      id: string;
      atISO: string;
      type: "toggle_intake";
      patientId: string;
      supplementId: string;
      dayKey: string;
      taken: boolean;
    }
  | {
      id: string;
      atISO: string;
      type: "set_intake_count";
      patientId: string;
      supplementId: string;
      dayKey: string;
      count: number;
    }
  | {
      id: string;
      atISO: string;
      type: "add_supplement";
      patientId: string;
      fields: SupplementFields;
    }
  | {
      id: string;
      atISO: string;
      type: "update_supplement";
      supplementId: string;
      fields: SupplementFields;
    }
  | { id: string; atISO: string; type: "remove_supplement"; supplementId: string }
  | { id: string; atISO: string; type: "send_message"; convId: string; text: string }
  | { id: string; atISO: string; type: "mark_read"; convId: string }
  | {
      id: string;
      atISO: string;
      type: "report_alarm";
      signs: string[];
      note?: string;
      lat?: number | null;
      lng?: number | null;
    }
  | { id: string; atISO: string; type: "panic"; lat: number | null; lng: number | null }
  | { id: string; atISO: string; type: "attend_alert"; alertId: string; note: string }
  | { id: string; atISO: string; type: "complete_visit"; visitId: string; resultado: string }
  | {
      id: string;
      atISO: string;
      type: "update_patient";
      patientId: string;
      fields: PatientUpdateFields;
    };

export interface ActionResult {
  id: string;
  ok: boolean;
  error?: string;
}

export interface DBState {
  seedVersion: number;
  users: StoredUser[];
  patients: Patient[];
  appointments: Appointment[];
  supplements: Supplement[];
  intakes: IntakeMap;
  messages: Message[];
  alerts: Alert[];
  visits: Visit[];
  sessions: Record<string, { dni: string; atISO: string }>;
  appliedActionIds: string[];
}
