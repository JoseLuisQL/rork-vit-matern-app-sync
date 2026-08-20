/**
 * VITMATERNA (servidor autoalojado) — Tipos compartidos.
 * El servidor es la única fuente de verdad: guarda usuarios, pacientes,
 * citas, tomas, mensajes, alertas y visitas en PostgreSQL 17, y calcula
 * todo lo clínico. Los tipos del snapshot son idénticos a los que consume
 * la app móvil (misma API que el backend en la nube).
 */

export type Role = "gestante" | "obstetra" | "admin";

/** Entorno de datos del sistema: demostración o producción (datos reales). */
export type AppEnvironment = "demo" | "produccion";

/** Configuración global del sistema (mantenimiento + entorno), en tiempo real. */
export interface SystemConfig {
  maintenance: boolean;
  maintenanceMessage: string;
  environment: AppEnvironment;
  updatedAtISO: string;
}

/** Configuración de integración con WhatsApp vía Open-WA (openwa.qware.me). */
export interface WhatsAppConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
  sessionId: string;
  notifyAppointments: boolean;
  notifySupplements: boolean;
  remindAppointments: boolean;
  remindSupplements: boolean;
  chatOfflineFallback: boolean;
  sosOfflineAlerts: boolean;
  updatedAtISO: string;
}

/** Acceso de demostración visible en el login (solo en entorno demo). */
export interface DemoAccount {
  dni: string;
  name: string;
  role: Role;
}

/** Configuración pública (sin sesión) que consume la pantalla de login. */
export interface PublicConfig {
  maintenance: boolean;
  maintenanceMessage: string;
  environment: AppEnvironment;
  demoAccounts: DemoAccount[];
}

export type RiskLevel = "verde" | "amarillo" | "rojo";

export type AnemiaClass = "normal" | "leve" | "moderada" | "severa";

export type AppointmentStatus =
  | "programada"
  | "confirmada"
  | "asistida"
  | "no_asistida"
  | "solicitud_reprogramacion";

/** Usuario tal como vive en la tabla `users` (contraseña ya con hash bcrypt). */
export interface UserRecord {
  dni: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  active: boolean;
  patientId: string | null;
  phone: string | null;
  createdAtISO: string;
  avatarVersion: number | null;
  /** Generar automáticamente los 8 controles según FUM al registrar gestante (por obstetra). */
  autoControls?: boolean;
}

/** Usuario visible por el cliente (sin contraseña; campos opcionales omitidos). */
export interface PublicUser {
  dni: string;
  role: Role;
  firstName: string;
  lastName: string;
  active: boolean;
  patientId?: string;
  phone?: string;
  createdAtISO: string;
  avatarVersion?: number;
  autoControls?: boolean;
}

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
  /** Tomas por día (1–6). */
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
  /** Ubicación GPS adjunta (solo avisos de emergencia/alarma). */
  lat?: number | null;
  lng?: number | null;
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

/** Desglose de indicadores por comunidad (para reportes). */
export interface CommunityReport {
  community: string;
  gestantes: number;
  /** Gestantes con anemia moderada o severa. */
  riesgoAlto: number;
  anemiaCount: number;
  adherenciaPromedio: number;
}

/** Asistencia a citas por bloque semanal (7 días), del más antiguo al actual. */
export interface WeeklyAttendance {
  startKey: string;
  asistidas: number;
  total: number;
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
  visitas: { programadas: number; realizadas: number; pct: number };
  trimestres: { t1: number; t2: number; t3: number };
  porComunidad: CommunityReport[];
  asistenciaSemanal: WeeklyAttendance[];
}

export interface ArticleLink {
  label: string;
  url: string;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  summary: string;
  body: string[];
  minutes: number;
  active: boolean;
  imageUrl?: string | null;
  links: ArticleLink[];
  createdAtISO: string;
  updatedAtISO: string;
}

export interface ArticleAssignment {
  patientId: string;
  articleId: string;
  assignedByDni?: string;
  assignedAtISO: string;
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
  articles?: Article[];
  articleAssignments?: ArticleAssignment[];
  /**
   * Presencia por interlocutor: la gestante ve la clave "obstetra" y la
   * obstetra ve una clave por cada id de paciente (su conversación).
   */
  presence?: Record<string, PresenceView>;
  /** Obstetra activo/a asignado/a al cuidado de la gestante. */
  obstetrician?: PublicUser;
  users?: PublicUser[];
  reports?: { d30: ReportBlock; total: ReportBlock };
  /** Configuración global (mantenimiento + entorno) visible por todos los roles. */
  config: SystemConfig;
  /** Configuración de integración con WhatsApp (solo visible para administración). */
  whatsappConfig?: WhatsAppConfig;
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
    }
  | {
      id: string;
      atISO: string;
      type: "assign_article";
      patientId: string;
      articleId: string;
      assigned: boolean;
    }
  | {
      id: string;
      atISO: string;
      type: "assign_all_articles";
      patientId: string;
      assigned: boolean;
    };

export interface ActionResult {
  id: string;
  ok: boolean;
  error?: string;
}

/** Estado completo cargado desde PostgreSQL para cálculos y snapshot. */
export interface AppData {
  seedVersion: number;
  config: SystemConfig;
  whatsappConfig: WhatsAppConfig;
  users: UserRecord[];
  patients: Patient[];
  appointments: Appointment[];
  supplements: Supplement[];
  intakes: IntakeMap;
  messages: Message[];
  alerts: Alert[];
  visits: Visit[];
  articles: Article[];
  articleAssignments: ArticleAssignment[];
}
