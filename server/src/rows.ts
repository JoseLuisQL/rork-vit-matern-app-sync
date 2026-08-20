/**
 * VITMATERNA — Mapeo entre filas de PostgreSQL (snake_case) y los objetos
 * del dominio (camelCase, idénticos a los que consume la app móvil).
 * `loadAppData` carga el estado completo para los cálculos clínicos y el
 * snapshot; a escala de un centro de salud esto es liviano y transaccional.
 */
import type { Queryable } from "./db";
import type {
  Alert,
  AlertType,
  AppData,
  AppEnvironment,
  Appointment,
  AppointmentStatus,
  Article,
  ArticleAssignment,
  ArticleLink,
  IntakeMap,
  Message,
  MessageKind,
  Patient,
  Role,
  Supplement,
  SystemConfig,
  UserRecord,
  Visit,
  VisitStatus,
  WhatsAppConfig,
} from "./types";

export interface ConfigRow {
  seed_version: number;
  maintenance: boolean;
  maintenance_message: string;
  environment: AppEnvironment;
  updated_at: string;
}

export interface UserRow {
  dni: string;
  password_hash: string;
  role: Role;
  first_name: string;
  last_name: string;
  active: boolean;
  patient_id: string | null;
  phone: string | null;
  avatar_version: number | null;
  auto_controls?: boolean | null;
  created_at: string;
}

export interface PatientRow {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  age: number;
  community: string;
  phone: string;
  fum_key: string;
  gestas: number;
  cesareas: number;
  abortos: number;
  obito_fetal: boolean;
  rh_sensibilizado: boolean;
  antecedentes: string[];
  hb_observed: number;
  bp_sys: number;
  bp_dia: number;
  imc: number;
  adherence_base: number;
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  control: number | null;
  week: number | null;
  date_key: string;
  time: string;
  motivo: string;
  estado: AppointmentStatus;
  lugar: string;
}

export interface SupplementRow {
  id: string;
  patient_id: string;
  name: string;
  dose: string;
  schedule: string;
  times_per_day: number;
  start_key: string | null;
}

export interface IntakeRow {
  patient_id: string;
  day_key: string;
  supplement_id: string;
  count: number;
}

export interface MessageRow {
  id: string;
  conv_id: string;
  sender: "gestante" | "obstetra";
  kind: MessageKind;
  text: string;
  at_iso: string;
  read_by_gestante: boolean;
  read_by_obstetra: boolean;
  lat: number | null;
  lng: number | null;
}

export interface AlertRow {
  id: string;
  type: AlertType;
  patient_id: string;
  at_iso: string;
  title: string;
  detail: string;
  status: "abierta" | "atendida";
  note: string | null;
  attended_at_iso: string | null;
  lat: number | null;
  lng: number | null;
}

export interface VisitRow {
  id: string;
  patient_id: string;
  date_key: string;
  time: string;
  motivo: string;
  estado: VisitStatus;
  resultado: string | null;
  created_at_iso: string;
}

export interface SessionRow {
  token: string;
  dni: string;
  at_iso: string;
}

export function mapUser(r: UserRow): UserRecord {
  return {
    dni: r.dni,
    passwordHash: r.password_hash,
    role: r.role,
    firstName: r.first_name,
    lastName: r.last_name,
    active: r.active,
    patientId: r.patient_id,
    phone: r.phone,
    createdAtISO: r.created_at,
    avatarVersion: r.avatar_version,
    autoControls: r.auto_controls !== false,
  };
}

export function mapPatient(r: PatientRow): Patient {
  return {
    id: r.id,
    dni: r.dni,
    firstName: r.first_name,
    lastName: r.last_name,
    age: r.age,
    community: r.community,
    phone: r.phone,
    fumKey: r.fum_key,
    gestas: r.gestas,
    cesareas: r.cesareas,
    abortos: r.abortos,
    obitoFetal: r.obito_fetal,
    rhSensibilizado: r.rh_sensibilizado,
    antecedentes: r.antecedentes,
    hbObserved: r.hb_observed,
    bpSys: r.bp_sys,
    bpDia: r.bp_dia,
    imc: r.imc,
    adherenceBase: r.adherence_base,
  };
}

export function mapAppointment(r: AppointmentRow): Appointment {
  return {
    id: r.id,
    patientId: r.patient_id,
    control: r.control,
    week: r.week,
    dateKey: r.date_key,
    time: r.time,
    motivo: r.motivo,
    estado: r.estado,
    lugar: r.lugar,
  };
}

export function mapSupplement(r: SupplementRow): Supplement {
  return {
    id: r.id,
    patientId: r.patient_id,
    name: r.name,
    dose: r.dose,
    schedule: r.schedule,
    timesPerDay: r.times_per_day,
    ...(r.start_key ? { startKey: r.start_key } : {}),
  };
}

export function mapMessage(r: MessageRow): Message {
  return {
    id: r.id,
    convId: r.conv_id,
    sender: r.sender,
    kind: r.kind,
    text: r.text,
    atISO: r.at_iso,
    readByGestante: r.read_by_gestante,
    readByObstetra: r.read_by_obstetra,
    lat: r.lat,
    lng: r.lng,
  };
}

export function mapAlert(r: AlertRow): Alert {
  return {
    id: r.id,
    type: r.type,
    patientId: r.patient_id,
    atISO: r.at_iso,
    title: r.title,
    detail: r.detail,
    status: r.status,
    ...(r.note !== null ? { note: r.note } : {}),
    ...(r.attended_at_iso !== null ? { attendedAtISO: r.attended_at_iso } : {}),
    lat: r.lat,
    lng: r.lng,
  };
}

export function mapVisit(r: VisitRow): Visit {
  return {
    id: r.id,
    patientId: r.patient_id,
    dateKey: r.date_key,
    time: r.time,
    motivo: r.motivo,
    estado: r.estado,
    ...(r.resultado !== null ? { resultado: r.resultado } : {}),
    createdAtISO: r.created_at_iso,
  };
}

export interface WhatsAppConfigRow {
  id: number;
  enabled: boolean;
  server_url: string;
  api_key: string;
  session_id: string;
  notify_appointments: boolean;
  notify_supplements: boolean;
  remind_appointments: boolean;
  remind_supplements: boolean;
  chat_offline_fallback: boolean;
  sos_offline_alerts: boolean;
  updated_at: string;
}

export function mapWhatsAppConfig(r: WhatsAppConfigRow): WhatsAppConfig {
  return {
    enabled: r.enabled,
    serverUrl: r.server_url,
    apiKey: r.api_key,
    sessionId: r.session_id,
    notifyAppointments: r.notify_appointments,
    notifySupplements: r.notify_supplements,
    remindAppointments: r.remind_appointments,
    remindSupplements: r.remind_supplements,
    chatOfflineFallback: r.chat_offline_fallback,
    sosOfflineAlerts: r.sos_offline_alerts,
    updatedAtISO: r.updated_at,
  };
}

/** Configuración de WhatsApp (fila única de whatsapp_config). */
export async function loadWhatsAppConfig(db: Queryable): Promise<WhatsAppConfig> {
  try {
    const res = await db.query<WhatsAppConfigRow>("SELECT * FROM whatsapp_config WHERE id = 1");
    const row = res.rows[0];
    if (!row) {
      return {
        enabled: false,
        serverUrl: "https://openwa.qware.me",
        apiKey: "",
        sessionId: "vitmaterna",
        notifyAppointments: true,
        notifySupplements: true,
        remindAppointments: true,
        remindSupplements: true,
        chatOfflineFallback: true,
        sosOfflineAlerts: true,
        updatedAtISO: new Date().toISOString(),
      };
    }
    return mapWhatsAppConfig(row);
  } catch {
    // Si la tabla aún no se ha migrado (durante bootstrap)
    return {
      enabled: false,
      serverUrl: "https://openwa.qware.me",
      apiKey: "",
      sessionId: "vitmaterna",
      notifyAppointments: true,
      notifySupplements: true,
      remindAppointments: true,
      remindSupplements: true,
      chatOfflineFallback: true,
      sosOfflineAlerts: true,
      updatedAtISO: new Date().toISOString(),
    };
  }
}

/** Configuración global (fila única de app_config). */
export async function loadConfig(
  db: Queryable,
): Promise<{ seedVersion: number; config: SystemConfig }> {
  const res = await db.query<ConfigRow>("SELECT * FROM app_config WHERE id = 1");
  const row = res.rows[0];
  if (!row) {
    throw new Error("app_config vacío: la base de datos no está inicializada");
  }
  return {
    seedVersion: row.seed_version,
    config: {
      maintenance: row.maintenance,
      maintenanceMessage: row.maintenance_message,
      environment: row.environment,
      updatedAtISO: row.updated_at,
    },
  };
}

export async function getUserByDni(db: Queryable, dni: string): Promise<UserRecord | null> {
  const res = await db.query<UserRow>("SELECT * FROM users WHERE dni = $1", [dni]);
  const row = res.rows[0];
  return row ? mapUser(row) : null;
}

/** Resuelve la sesión del encabezado X-VM-Token (usuario activo o null). */
export async function getUserByToken(db: Queryable, token: string): Promise<UserRecord | null> {
  const res = await db.query<UserRow>(
    `SELECT u.dni, u.password_hash, u.role, u.first_name, u.last_name,
            u.active, u.patient_id, u.phone, u.avatar_version, u.auto_controls, u.created_at
       FROM sessions s
       JOIN users u ON u.dni = s.dni
      WHERE s.token = $1`,
    [token],
  );
  const row = res.rows[0];
  if (!row || !row.active) return null;
  return mapUser(row);
}

export interface ArticleRow {
  id: string;
  category: string;
  title: string;
  summary: string;
  body: string[];
  minutes: number;
  active: boolean;
  image_url: string | null;
  links: string | ArticleLink[];
  created_at_iso: string;
  updated_at_iso: string;
}

export interface ArticleAssignmentRow {
  patient_id: string;
  article_id: string;
  assigned_by_dni: string | null;
  assigned_at_iso: string;
}

export function mapArticle(r: ArticleRow): Article {
  let links: ArticleLink[] = [];
  if (typeof r.links === "string") {
    try {
      links = JSON.parse(r.links);
    } catch {
      links = [];
    }
  } else if (Array.isArray(r.links)) {
    links = r.links;
  }
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    summary: r.summary,
    body: Array.isArray(r.body) ? r.body : [],
    minutes: Number(r.minutes) || 3,
    active: r.active !== false,
    imageUrl: r.image_url ?? null,
    links,
    createdAtISO: r.created_at_iso,
    updatedAtISO: r.updated_at_iso,
  };
}

export function mapArticleAssignment(r: ArticleAssignmentRow): ArticleAssignment {
  return {
    patientId: r.patient_id,
    articleId: r.article_id,
    assignedByDni: r.assigned_by_dni ?? undefined,
    assignedAtISO: r.assigned_at_iso,
  };
}

/** Carga el estado completo (para cálculos, alertas automáticas y snapshot). */
export async function loadAppData(db: Queryable): Promise<AppData> {
  const cfg = await loadConfig(db);
  const whatsappConfig = await loadWhatsAppConfig(db);
  const users = await db.query<UserRow>("SELECT * FROM users ORDER BY seq");
  const patients = await db.query<PatientRow>("SELECT * FROM patients ORDER BY seq");
  const appointments = await db.query<AppointmentRow>("SELECT * FROM appointments ORDER BY seq");
  const supplements = await db.query<SupplementRow>("SELECT * FROM supplements ORDER BY seq");
  const intakes = await db.query<IntakeRow>("SELECT patient_id, day_key, supplement_id, count FROM intakes");
  const messages = await db.query<MessageRow>("SELECT * FROM messages ORDER BY seq");
  const alerts = await db.query<AlertRow>("SELECT * FROM alerts ORDER BY seq");
  const visits = await db.query<VisitRow>("SELECT * FROM visits ORDER BY seq");
  const articles = await db.query<ArticleRow>("SELECT * FROM articles ORDER BY seq");
  const articleAssignments = await db.query<ArticleAssignmentRow>("SELECT * FROM article_assignments");

  const intakeMap: IntakeMap = {};
  for (const r of intakes.rows) {
    const perPatient = intakeMap[r.patient_id] ?? (intakeMap[r.patient_id] = {});
    const day = perPatient[r.day_key] ?? (perPatient[r.day_key] = []);
    for (let i = 0; i < r.count; i++) day.push(r.supplement_id);
  }

  return {
    seedVersion: cfg.seedVersion,
    config: cfg.config,
    whatsappConfig,
    users: users.rows.map(mapUser),
    patients: patients.rows.map(mapPatient),
    appointments: appointments.rows.map(mapAppointment),
    supplements: supplements.rows.map(mapSupplement),
    intakes: intakeMap,
    messages: messages.rows.map(mapMessage),
    alerts: alerts.rows.map(mapAlert),
    visits: visits.rows.map(mapVisit),
    articles: articles.rows.map(mapArticle),
    articleAssignments: articleAssignments.rows.map(mapArticleAssignment),
  };
}
