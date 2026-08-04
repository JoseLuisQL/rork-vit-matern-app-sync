/**
 * VITMATERNA — Tipos del cliente (espejo del servidor en functions/types.ts).
 * El servidor calcula todo lo clínico; el cliente solo muestra y encola acciones.
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

export interface User {
  dni: string;
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

export interface Patient {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  age: number;
  community: string;
  phone: string;
  /** Fecha de última menstruación (día local YYYY-MM-DD). */
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
  adherenceBase: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  /** Número de control MINSA (1–8) o null para citas adicionales. */
  control: number | null;
  week: number | null;
  /** Día YYYY-MM-DD. */
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
}

export type IntakeMap = Record<string, Record<string, string[]>>;

export type MessageKind = "text" | "emergencia" | "alarma";

export interface Message {
  id: string;
  convId: string;
  sender: "gestante" | "obstetra";
  kind: MessageKind;
  text: string;
  atISO: string;
  readByGestante: boolean;
  readByObstetra: boolean;
  /** Solo cliente: aún no confirmado por el servidor. */
  pending?: boolean;
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
  /** Solo cliente: aún no confirmado por el servidor. */
  pending?: boolean;
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

/** Ficha con cálculos clínicos hechos por el servidor. */
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
  /** Versión de la foto de perfil del usuario vinculado. */
  avatarVersion?: number;
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
  me: User;
  center: { name: string; altitudeMsnm: number; hbFactor: number };
  patients: PatientView[];
  appointments: Appointment[];
  supplements: Supplement[];
  intakes: IntakeMap;
  messages: Message[];
  alerts: Alert[];
  visits: Visit[];
  users?: User[];
  reports?: { d30: ReportBlock; total: ReportBlock };
}

/** Acciones encolables offline (idempotentes por id en el servidor). */
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
  | { id: string; atISO: string; type: "complete_visit"; visitId: string; resultado: string };

/** Entrada de acción sin id/fecha (los pone el proveedor). */
export type ActionInput =
  ClientAction extends infer A ? (A extends ClientAction ? Omit<A, "id" | "atISO"> : never) : never;

export interface ActionResult {
  id: string;
  ok: boolean;
  error?: string;
}

export interface SyncResponse {
  results: ActionResult[];
  snapshot: Snapshot;
}

export interface LoginResponse {
  token: string;
  user: User;
  snapshot: Snapshot;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  minutes: number;
  summary: string;
  body: string[];
}

export interface AlarmSign {
  id: string;
  label: string;
  detail: string;
}
