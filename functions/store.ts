/**
 * VITMATERNA — Durable Object central ("VitmaternaStore", instancia "main").
 * Única fuente de verdad: sesiones, pacientes, citas, tomas, mensajes,
 * alertas, visitas y usuarios. Aplica acciones offline de forma idempotente,
 * valida la agenda sin cruces y genera alertas tempranas automáticas.
 */
import { DurableObject } from "cloudflare:workers";
import {
  addDaysToKey,
  AGENDA_SLOTS,
  ALTITUDE_MSNM,
  anemiaClass,
  assessRisk,
  correctedHb,
  diffDaysKeys,
  fppKeyFromFum,
  gestationalDays,
  gestationalWeeks,
  HB_CORRECTION_FACTOR,
  MINSA_WEEKS,
  peruDayKey,
  trimester,
} from "./clinical";
import {
  buildProductionSeed,
  buildSeed,
  defaultConfig,
  DEFAULT_MAINTENANCE_MESSAGE,
  DEMO_DNIS,
  HEALTH_CENTER,
  SEED_VERSION,
} from "./seed";
import type {
  ActionResult,
  Alert,
  AnemiaClass,
  AppEnvironment,
  Appointment,
  ClientAction,
  CommunityReport,
  DBState,
  DemoAccount,
  Message,
  Patient,
  PatientView,
  PresenceView,
  PublicUser,
  ReportBlock,
  RiskLevel,
  Snapshot,
  StoredUser,
  Supplement,
  SupplementFields,
  Visit,
  WeeklyAttendance,
} from "./types";

const STATE_KEY = "state";
const ACTIVE_APPT_STATES = ["programada", "confirmada", "solicitud_reprogramacion"] as const;

/**
 * Presencia de chat (efímera, solo en memoria del objeto): si el objeto se
 * recicla, todos aparecen "sin conexión" unos segundos y se recupera solo
 * con la siguiente sincronización de cada teléfono.
 */
interface PresenceRecord {
  lastSeenISO: string;
  typingConvId: string | null;
  typingAtISO: string | null;
}

/** En línea si sincronizó hace menos de 15 s (el cliente lo hace cada 2–4 s). */
const ONLINE_WINDOW_MS = 15_000;
/** "Escribiendo…" válido por 8 s desde el último aviso del teclado. */
const TYPING_WINDOW_MS = 8_000;

/** Aviso de presencia que el cliente adjunta a cada sincronización. */
interface PresenceInput {
  convId?: string | null;
  typing?: boolean;
}

/** Las fotos de perfil se guardan en claves separadas (límite por valor del storage). */
const AVATAR_PREFIX = "avatar:";
/** ~110 KB en binario; el cliente envía JPEG 320px comprimido (~20 KB). */
const MAX_AVATAR_DATA_URL_LENGTH = 150_000;
const AVATAR_DATA_URL_RE = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function publicUser(u: StoredUser): PublicUser {
  const { password: _pw, ...rest } = u;
  return rest;
}

function isActiveState(estado: Appointment["estado"]): boolean {
  return (ACTIVE_APPT_STATES as readonly string[]).includes(estado);
}

/** Tomas por día de un medicamento (1–6; registros antiguos valen 1). */
function timesPerDayOf(s: Supplement): number {
  return Math.max(1, Math.min(6, Math.round(s.timesPerDay ?? 1)));
}

/** El medicamento solo se espera desde el día en que fue asignado. */
function isSupplementActiveOn(s: Supplement, dayKey: string): boolean {
  return !s.startKey || s.startKey <= dayKey;
}

/** Cuántas tomas de un medicamento hay registradas en un día. */
function countDoses(dayLogs: string[] | undefined, supplementId: string): number {
  if (!dayLogs) return 0;
  let n = 0;
  for (const id of dayLogs) if (id === supplementId) n += 1;
  return n;
}

/** Normaliza los campos de un medicamento; null si el nombre está vacío. */
function sanitizeSupplementFields(
  fields: SupplementFields | undefined,
): { name: string; dose: string; schedule: string; timesPerDay: number } | null {
  const name = (fields?.name ?? "").trim().slice(0, 60);
  if (name.length === 0) return null;
  return {
    name,
    dose: ((fields?.dose ?? "").trim() || "1 tableta").slice(0, 40),
    schedule: (fields?.schedule ?? "").trim().slice(0, 90),
    timesPerDay: Math.max(1, Math.min(6, Math.round(fields?.timesPerDay ?? 1))),
  };
}

export class VitmaternaStore extends DurableObject {
  private db: DBState | null = null;
  /** Última conexión y "escribiendo" por DNI (no se persiste a propósito). */
  private presence = new Map<string, PresenceRecord>();

  private async load(): Promise<DBState> {
    if (this.db) return this.db;
    const stored = await this.ctx.storage.get<DBState>(STATE_KEY);
    if (stored && stored.seedVersion === SEED_VERSION) {
      // Migración suave: estados guardados antes de existir la configuración.
      if (!stored.config) {
        stored.config = defaultConfig("demo");
        await this.ctx.storage.put(STATE_KEY, stored);
      }
      this.db = stored;
    } else {
      this.db = buildSeed();
      await this.ctx.storage.put(STATE_KEY, this.db);
      console.log("[VitmaternaStore] Seed inicial creado (v" + SEED_VERSION + ")");
    }
    return this.db;
  }

  private async save(): Promise<void> {
    if (this.db) {
      await this.ctx.storage.put(STATE_KEY, this.db);
    }
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      const db = await this.load();

      if (request.method === "GET" && path.startsWith("/api/avatar/")) {
        return await this.handleAvatarImage(path);
      }

      if (request.method !== "POST") {
        return json({ error: "Método no permitido" }, 405);
      }

      if (path === "/api/login") return await this.handleLogin(request, db);
      if (path === "/api/config") return this.handlePublicConfig(db);

      const user = this.resolveUser(request, db);
      if (!user) {
        return json({ error: "Sesión inválida o cuenta desactivada" }, 401);
      }
      this.touchPresence(user);

      // Mantenimiento activo: solo administración opera; la sincronización
      // sigue viva (sin aplicar cambios) para que el aviso llegue y se vaya
      // en tiempo real en todos los teléfonos.
      if (db.config.maintenance && user.role !== "admin" && path !== "/api/sync") {
        return json({ error: db.config.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE }, 503);
      }

      switch (path) {
        case "/api/sync":
          return await this.handleSync(request, db, user);
        case "/api/schedule":
          return await this.handleSchedule(request, db, user);
        case "/api/user/avatar":
          return await this.handleSetAvatar(request, db, user);
        case "/api/user/auto-controls":
          return await this.handleSetAutoControls(request, db, user);
        case "/api/admin/create-user":
          return await this.handleCreateUser(request, db, user);
        case "/api/admin/set-active":
          return await this.handleSetActive(request, db, user);
        case "/api/admin/config":
          return await this.handleAdminConfig(request, db, user);
        case "/api/admin/reset":
          return await this.handleReset(db, user);
        default:
          return json({ error: "Ruta no encontrada" }, 404);
      }
    } catch (e) {
      console.error("[VitmaternaStore] Error:", e instanceof Error ? e.stack : e);
      return json({ error: "Error interno del servidor" }, 500);
    }
  }

  // ---------- Auth ----------

  private resolveUser(request: Request, db: DBState): StoredUser | null {
    const token = request.headers.get("x-vm-token");
    if (!token) return null;
    const session = db.sessions[token];
    if (!session) return null;
    const user = db.users.find((u) => u.dni === session.dni);
    if (!user || !user.active) return null;
    return user;
  }

  private async handleLogin(request: Request, db: DBState): Promise<Response> {
    const body = (await request.json()) as { dni?: string; password?: string };
    const dni = (body.dni ?? "").trim();
    const password = body.password ?? "";
    const user = db.users.find((u) => u.dni === dni);
    if (!user || user.password !== password) {
      return json({ error: "DNI o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo." }, 401);
    }
    if (!user.active) {
      return json({ error: "Tu cuenta está desactivada. Comunícate con la administración del centro de salud." }, 403);
    }
    if (db.config.maintenance && user.role !== "admin") {
      return json({ error: db.config.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE }, 503);
    }
    const token = crypto.randomUUID();
    db.sessions[token] = { dni: user.dni, atISO: new Date().toISOString() };
    this.touchPresence(user);
    const tokens = Object.keys(db.sessions);
    if (tokens.length > 120) {
      tokens
        .sort((a, b) => (db.sessions[a].atISO < db.sessions[b].atISO ? -1 : 1))
        .slice(0, tokens.length - 120)
        .forEach((t) => delete db.sessions[t]);
    }
    this.regenerateAutoAlerts(db);
    await this.save();
    return json({ token, user: publicUser(user), snapshot: this.snapshotFor(user, db) });
  }

  // ---------- Sincronización (cola offline) ----------

  private async handleSync(request: Request, db: DBState, user: StoredUser): Promise<Response> {
    const body = (await request.json()) as {
      actions?: ClientAction[];
      presence?: PresenceInput;
    };
    this.touchPresence(user, body.presence ?? {});
    // Durante el mantenimiento no se aplican cambios de gestantes/obstetras;
    // sus acciones quedan en cola en el teléfono y entran solas al reabrir.
    const maintenanceHold = db.config.maintenance && user.role !== "admin";
    const actions = !maintenanceHold && Array.isArray(body.actions) ? body.actions : [];
    const results: ActionResult[] = [];
    let mutated = false;

    for (const action of actions) {
      if (!action || typeof action.id !== "string") continue;
      if (db.appliedActionIds.includes(action.id)) {
        results.push({ id: action.id, ok: true });
        continue;
      }
      const error = this.applyAction(db, user, action);
      db.appliedActionIds.push(action.id);
      if (db.appliedActionIds.length > 2500) {
        db.appliedActionIds = db.appliedActionIds.slice(-2000);
      }
      mutated = true;
      results.push(error ? { id: action.id, ok: false, error } : { id: action.id, ok: true });
    }

    this.regenerateAutoAlerts(db);
    if (mutated) await this.save();
    return json({ results, snapshot: this.snapshotFor(user, db) });
  }

  /** Aplica una acción. Devuelve mensaje de error o null si tuvo éxito. */
  private applyAction(db: DBState, user: StoredUser, action: ClientAction): string | null {
    const ownPatientId = user.patientId ?? null;

    switch (action.type) {
      case "confirm_appointment":
      case "request_reschedule": {
        const appt = db.appointments.find((a) => a.id === action.appointmentId);
        if (!appt) return "La cita ya no existe";
        if (user.role === "gestante" && appt.patientId !== ownPatientId) return "Cita de otra paciente";
        if (!isActiveState(appt.estado)) return "La cita ya fue atendida";
        appt.estado = action.type === "confirm_appointment" ? "confirmada" : "solicitud_reprogramacion";
        return null;
      }
      case "set_appointment_status": {
        if (user.role === "gestante") return "Acción no permitida";
        const appt = db.appointments.find((a) => a.id === action.appointmentId);
        if (!appt) return "La cita ya no existe";
        appt.estado = action.estado;
        return null;
      }
      case "toggle_intake": {
        const patientId = user.role === "gestante" ? ownPatientId : action.patientId;
        if (!patientId || (user.role === "gestante" && action.patientId !== patientId)) {
          return "Paciente no válida";
        }
        const supplement = db.supplements.find((s) => s.id === action.supplementId);
        if (!supplement || supplement.patientId !== patientId) return "Suplemento no válido";
        const perPatient = db.intakes[patientId] ?? (db.intakes[patientId] = {});
        const day = perPatient[action.dayKey] ?? (perPatient[action.dayKey] = []);
        const has = day.includes(action.supplementId);
        if (action.taken && !has) day.push(action.supplementId);
        if (!action.taken && has) {
          perPatient[action.dayKey] = day.filter((id) => id !== action.supplementId);
        }
        return null;
      }
      case "set_intake_count": {
        const patientId = user.role === "gestante" ? ownPatientId : action.patientId;
        if (!patientId || (user.role === "gestante" && action.patientId !== patientId)) {
          return "Paciente no válida";
        }
        const supplement = db.supplements.find((s) => s.id === action.supplementId);
        if (!supplement || supplement.patientId !== patientId) return "Medicamento no válido";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(action.dayKey)) return "Fecha no válida";
        const count = Math.max(0, Math.min(timesPerDayOf(supplement), Math.round(action.count)));
        const perPatient = db.intakes[patientId] ?? (db.intakes[patientId] = {});
        const others = (perPatient[action.dayKey] ?? []).filter(
          (id) => id !== action.supplementId,
        );
        perPatient[action.dayKey] = [
          ...others,
          ...(Array(count).fill(action.supplementId) as string[]),
        ];
        return null;
      }
      case "add_supplement": {
        if (user.role === "gestante") return "Solo el personal de salud puede asignar medicamentos";
        const patient = db.patients.find((p) => p.id === action.patientId);
        if (!patient) return "Paciente no encontrada";
        const fields = sanitizeSupplementFields(action.fields);
        if (!fields) return "Escribe el nombre del medicamento";
        const id = `s-${action.id}`;
        if (!db.supplements.some((s) => s.id === id)) {
          db.supplements.push({ id, patientId: patient.id, ...fields, startKey: peruDayKey() });
        }
        return null;
      }
      case "update_supplement": {
        if (user.role === "gestante") return "Solo el personal de salud puede cambiar medicamentos";
        const supplement = db.supplements.find((s) => s.id === action.supplementId);
        if (!supplement) return "El medicamento ya no existe";
        const fields = sanitizeSupplementFields(action.fields);
        if (!fields) return "Escribe el nombre del medicamento";
        supplement.name = fields.name;
        supplement.dose = fields.dose;
        supplement.schedule = fields.schedule;
        supplement.timesPerDay = fields.timesPerDay;
        return null;
      }
      case "remove_supplement": {
        if (user.role === "gestante") return "Solo el personal de salud puede quitar medicamentos";
        const supplement = db.supplements.find((s) => s.id === action.supplementId);
        if (!supplement) return "El medicamento ya no existe";
        db.supplements = db.supplements.filter((s) => s.id !== action.supplementId);
        const perPatient = db.intakes[supplement.patientId];
        if (perPatient) {
          Object.keys(perPatient).forEach((key) => {
            perPatient[key] = perPatient[key].filter((sid) => sid !== action.supplementId);
          });
        }
        return null;
      }
      case "send_message": {
        if (user.role === "admin") return "La administración no participa del chat clínico";
        const convId = user.role === "gestante" ? ownPatientId : action.convId;
        if (!convId || !db.patients.some((p) => p.id === convId)) return "Conversación no válida";
        if (user.role === "gestante" && action.convId !== convId) return "Conversación no válida";
        const text = action.text.trim();
        if (text.length === 0) return "Mensaje vacío";
        this.pushMessage(db, {
          id: `m-${action.id}`,
          convId,
          sender: user.role === "gestante" ? "gestante" : "obstetra",
          kind: "text",
          text,
          atISO: action.atISO,
          readByGestante: user.role === "gestante",
          readByObstetra: user.role === "obstetra",
        });
        return null;
      }
      case "mark_read": {
        if (user.role === "admin") return null;
        const reader = user.role;
        db.messages.forEach((m) => {
          if (m.convId !== action.convId) return;
          if (reader === "gestante") m.readByGestante = true;
          else m.readByObstetra = true;
        });
        return null;
      }
      case "report_alarm": {
        if (user.role !== "gestante" || !ownPatientId) return "Solo la gestante puede reportar";
        const signsText = action.signs.length > 0 ? action.signs.join(", ") : "Malestar general";
        const note = action.note?.trim();
        db.alerts.push({
          id: `al-alarma-${action.id}`,
          type: "alarma",
          patientId: ownPatientId,
          atISO: action.atISO,
          title: "Reporte de signos de alarma",
          detail: note ? `${signsText}. Nota: ${note}` : signsText,
          status: "abierta",
          lat: action.lat ?? null,
          lng: action.lng ?? null,
        });
        this.pushMessage(db, {
          id: `m-${action.id}`,
          convId: ownPatientId,
          sender: "gestante",
          kind: "alarma",
          text: `Reporte de signos de alarma: ${signsText.toLowerCase()}${note ? `. ${note}` : ""}`,
          atISO: action.atISO,
          readByGestante: true,
          readByObstetra: false,
          lat: action.lat ?? null,
          lng: action.lng ?? null,
        });
        return null;
      }
      case "panic": {
        if (user.role !== "gestante" || !ownPatientId) return "Solo la gestante puede activar el SOS";
        db.alerts.push({
          id: `al-sos-${action.id}`,
          type: "emergencia",
          patientId: ownPatientId,
          atISO: action.atISO,
          title: "Botón de emergencia",
          detail:
            action.lat != null && action.lng != null
              ? "Emergencia activada con ubicación GPS."
              : "Emergencia activada (sin ubicación disponible).",
          status: "abierta",
          lat: action.lat,
          lng: action.lng,
        });
        this.pushMessage(db, {
          id: `m-${action.id}`,
          convId: ownPatientId,
          sender: "gestante",
          kind: "emergencia",
          text: "Botón de emergencia activado. Necesito ayuda.",
          atISO: action.atISO,
          readByGestante: true,
          readByObstetra: false,
          lat: action.lat,
          lng: action.lng,
        });
        return null;
      }
      case "attend_alert": {
        if (user.role === "gestante") return "Acción no permitida";
        const alert = db.alerts.find((a) => a.id === action.alertId);
        if (!alert) return "La alerta ya no existe";
        alert.status = "atendida";
        alert.note = action.note.trim();
        alert.attendedAtISO = action.atISO;
        return null;
      }
      case "complete_visit": {
        if (user.role === "gestante") return "Acción no permitida";
        const visit = db.visits.find((v) => v.id === action.visitId);
        if (!visit) return "La visita ya no existe";
        visit.estado = "realizada";
        visit.resultado = action.resultado.trim();
        return null;
      }
      case "update_patient": {
        if (user.role === "gestante") return "Solo el personal de salud puede actualizar la ficha";
        const patient = db.patients.find((p) => p.id === action.patientId);
        if (!patient) return "Paciente no encontrada";
        const f = action.fields ?? {};
        if (f.fumKey !== undefined) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fumKey) || f.fumKey > peruDayKey()) {
            return "La fecha de última menstruación no es válida";
          }
          patient.fumKey = f.fumKey;
        }
        if (f.hbObserved !== undefined) {
          patient.hbObserved = Math.max(4, Math.min(20, Math.round(f.hbObserved * 10) / 10));
        }
        if (f.bpSys !== undefined) patient.bpSys = Math.max(70, Math.min(240, Math.round(f.bpSys)));
        if (f.bpDia !== undefined) patient.bpDia = Math.max(40, Math.min(140, Math.round(f.bpDia)));
        if (f.imc !== undefined) patient.imc = Math.max(12, Math.min(60, Math.round(f.imc * 10) / 10));
        if (f.age !== undefined) patient.age = Math.max(12, Math.min(60, Math.round(f.age)));
        if (f.gestas !== undefined) patient.gestas = Math.max(1, Math.min(20, Math.round(f.gestas)));
        if (f.cesareas !== undefined) patient.cesareas = Math.max(0, Math.min(10, Math.round(f.cesareas)));
        if (f.abortos !== undefined) patient.abortos = Math.max(0, Math.min(10, Math.round(f.abortos)));
        if (f.community !== undefined && f.community.trim().length > 0) {
          patient.community = f.community.trim().slice(0, 60);
        }
        if (f.phone !== undefined) patient.phone = f.phone.trim().slice(0, 20);
        return null;
      }
      default:
        return "Acción desconocida";
    }
  }

  // ---------- Presencia de chat (en línea / última vez / escribiendo) ----------

  /**
   * Marca al usuario como visto ahora. Si llega aviso de teclado, registra en
   * qué conversación escribe (la gestante solo puede escribir en la suya).
   */
  private touchPresence(user: StoredUser, typing?: PresenceInput): void {
    const nowISO = new Date().toISOString();
    const rec = this.presence.get(user.dni) ?? {
      lastSeenISO: nowISO,
      typingConvId: null,
      typingAtISO: null,
    };
    rec.lastSeenISO = nowISO;
    if (typing !== undefined) {
      const convId = typeof typing.convId === "string" ? typing.convId : null;
      const allowed =
        user.role === "gestante" ? convId !== null && convId === (user.patientId ?? null) : true;
      if (typing.typing === true && convId !== null && allowed) {
        rec.typingConvId = convId;
        rec.typingAtISO = nowISO;
      } else {
        rec.typingConvId = null;
        rec.typingAtISO = null;
      }
    }
    this.presence.set(user.dni, rec);
  }

  /** Estado combinado de uno o varios DNI respecto a una conversación. */
  private presenceViewOf(dnis: string[], convId: string, nowMs: number): PresenceView {
    let lastSeenISO: string | null = null;
    let online = false;
    let typing = false;
    for (const dni of dnis) {
      const rec = this.presence.get(dni);
      if (!rec) continue;
      if (lastSeenISO === null || rec.lastSeenISO > lastSeenISO) lastSeenISO = rec.lastSeenISO;
      if (nowMs - Date.parse(rec.lastSeenISO) <= ONLINE_WINDOW_MS) online = true;
      if (
        rec.typingConvId === convId &&
        rec.typingAtISO !== null &&
        nowMs - Date.parse(rec.typingAtISO) <= TYPING_WINDOW_MS
      ) {
        typing = true;
      }
    }
    return { online, lastSeenISO, typing };
  }

  /**
   * Presencia visible por rol: la gestante ve al equipo obstétrico bajo la
   * clave "obstetra"; la obstetra (y admin) ve a cada gestante por el id de
   * su ficha, que es también el id de la conversación.
   */
  private presenceFor(user: StoredUser, db: DBState): Record<string, PresenceView> {
    const nowMs = Date.now();
    const result: Record<string, PresenceView> = {};
    if (user.role === "gestante") {
      const obstetras = db.users.filter((u) => u.role === "obstetra" && u.active).map((u) => u.dni);
      result.obstetra = this.presenceViewOf(obstetras, user.patientId ?? "", nowMs);
    } else {
      db.patients.forEach((p) => {
        result[p.id] = this.presenceViewOf([p.dni], p.id, nowMs);
      });
    }
    return result;
  }

  private pushMessage(db: DBState, msg: Message): void {
    db.messages.push(msg);
    const convMessages = db.messages.filter((m) => m.convId === msg.convId);
    if (convMessages.length > 300) {
      const dropIds = new Set(convMessages.slice(0, convMessages.length - 300).map((m) => m.id));
      db.messages = db.messages.filter((m) => !dropIds.has(m.id));
    }
  }

  // ---------- Foto de perfil ----------

  /** Sirve la foto de perfil como imagen (pública, cacheable por versión). */
  private async handleAvatarImage(path: string): Promise<Response> {
    const dni = decodeURIComponent(path.slice("/api/avatar/".length)).trim();
    if (!/^\d{8}$/.test(dni)) return json({ error: "Solicitud no válida" }, 400);
    const dataUrl = await this.ctx.storage.get<string>(`${AVATAR_PREFIX}${dni}`);
    if (!dataUrl) return json({ error: "Sin foto de perfil" }, 404);
    const match = dataUrl.match(AVATAR_DATA_URL_RE);
    if (!match) return json({ error: "Foto no válida" }, 500);
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  /** Guarda o quita la foto de perfil del usuario con sesión activa. */
  private async handleSetAvatar(request: Request, db: DBState, user: StoredUser): Promise<Response> {
    const body = (await request.json()) as { dataUrl?: string | null };

    if (body.dataUrl === null) {
      await this.ctx.storage.delete(`${AVATAR_PREFIX}${user.dni}`);
      delete user.avatarVersion;
      await this.save();
      return json({ snapshot: this.snapshotFor(user, db) });
    }

    const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
    if (!AVATAR_DATA_URL_RE.test(dataUrl)) {
      return json({ error: "La imagen no tiene un formato válido (JPEG o PNG)" }, 400);
    }
    if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
      return json({ error: "La foto es demasiado pesada. Intenta con otra." }, 400);
    }
    await this.ctx.storage.put(`${AVATAR_PREFIX}${user.dni}`, dataUrl);
    user.avatarVersion = (user.avatarVersion ?? 0) + 1;
    await this.save();
    return json({ snapshot: this.snapshotFor(user, db) });
  }

  private async handleSetAutoControls(request: Request, db: DBState, user: StoredUser): Promise<Response> {
    if (user.role !== "obstetra" && user.role !== "admin") {
      return json({ error: "Acción no permitida" }, 403);
    }
    const body = (await request.json()) as { autoControls?: boolean };
    const autoControls = body.autoControls !== false;
    user.autoControls = autoControls;
    await this.save();
    return json({ snapshot: this.snapshotFor(user, db) });
  }

  // ---------- Agenda sin cruces (solo online) ----------

  private takenSlots(db: DBState, dateKey: string, ignoreAppointmentId?: string): Set<string> {
    const taken = new Set<string>();
    db.appointments.forEach((a) => {
      if (a.dateKey === dateKey && isActiveState(a.estado) && a.id !== ignoreAppointmentId) {
        taken.add(a.time);
      }
    });
    db.visits.forEach((v) => {
      if (v.dateKey === dateKey && v.estado === "programada") taken.add(v.time);
    });
    return taken;
  }

  private freeSlots(db: DBState, dateKey: string, ignoreAppointmentId?: string): string[] {
    const taken = this.takenSlots(db, dateKey, ignoreAppointmentId);
    return AGENDA_SLOTS.filter((s) => !taken.has(s));
  }

  private async handleSchedule(request: Request, db: DBState, user: StoredUser): Promise<Response> {
    if (user.role === "gestante") return json({ error: "Acción no permitida" }, 403);
    const body = (await request.json()) as {
      mode?: "cita" | "reprogramar" | "visita";
      patientId?: string;
      appointmentId?: string;
      dateKey?: string;
      time?: string;
      motivo?: string;
    };
    const todayKey = peruDayKey();
    const dateKey = body.dateKey ?? "";
    const time = body.time ?? "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return json({ error: "Fecha no válida" }, 400);
    if (dateKey < todayKey) return json({ error: "La fecha ya pasó. Elige un día desde hoy." }, 400);
    if (!AGENDA_SLOTS.includes(time)) return json({ error: "Horario fuera de la agenda (08:00–16:30)" }, 400);

    const conflictResponse = (ignoreId?: string) =>
      json(
        {
          error: "Ese horario ya está ocupado. Elige uno de los horarios libres.",
          freeSlots: this.freeSlots(db, dateKey, ignoreId),
        },
        409,
      );

    if (body.mode === "reprogramar") {
      const appt = db.appointments.find((a) => a.id === body.appointmentId);
      if (!appt) return json({ error: "La cita ya no existe" }, 404);
      if (this.takenSlots(db, dateKey, appt.id).has(time)) return conflictResponse(appt.id);
      appt.dateKey = dateKey;
      appt.time = time;
      appt.estado = "programada";
    } else if (body.mode === "cita") {
      const patient = db.patients.find((p) => p.id === body.patientId);
      if (!patient) return json({ error: "Paciente no encontrada" }, 404);
      if (this.takenSlots(db, dateKey).has(time)) return conflictResponse();
      db.appointments.push({
        id: `ap-${crypto.randomUUID().slice(0, 8)}`,
        patientId: patient.id,
        control: null,
        week: null,
        dateKey,
        time,
        motivo: (body.motivo ?? "Consulta adicional").trim() || "Consulta adicional",
        estado: "programada",
        lugar: HEALTH_CENTER,
      });
    } else if (body.mode === "visita") {
      const patient = db.patients.find((p) => p.id === body.patientId);
      if (!patient) return json({ error: "Paciente no encontrada" }, 404);
      if (this.takenSlots(db, dateKey).has(time)) return conflictResponse();
      db.visits.push({
        id: `v-${crypto.randomUUID().slice(0, 8)}`,
        patientId: patient.id,
        dateKey,
        time,
        motivo: (body.motivo ?? "Visita domiciliaria").trim() || "Visita domiciliaria",
        estado: "programada",
        createdAtISO: new Date().toISOString(),
      });
    } else {
      return json({ error: "Operación no válida" }, 400);
    }

    this.regenerateAutoAlerts(db);
    await this.save();
    return json({ snapshot: this.snapshotFor(user, db) });
  }

  // ---------- Configuración del sistema ----------

  /** Configuración pública para el login: mantenimiento, entorno y accesos demo. */
  private handlePublicConfig(db: DBState): Response {
    const demoAccounts: DemoAccount[] =
      db.config.environment === "demo"
        ? DEMO_DNIS.map((dni) => db.users.find((u) => u.dni === dni))
            .filter((u): u is StoredUser => u !== undefined && u.active)
            .map((u) => ({
              dni: u.dni,
              name: `${u.firstName} ${u.lastName.split(" ")[0]}`,
              role: u.role,
            }))
        : [];
    return json({
      maintenance: db.config.maintenance,
      maintenanceMessage: db.config.maintenanceMessage,
      environment: db.config.environment,
      demoAccounts,
    });
  }

  /**
   * Cambia mantenimiento, mensaje o entorno (solo admin). Pasar a producción
   * limpia los datos de demostración y conserva únicamente las cuentas de
   * administración; volver a demostración restaura el seed completo. El
   * cambio viaja en el snapshot y llega a todos los teléfonos en segundos.
   */
  private async handleAdminConfig(request: Request, db: DBState, user: StoredUser): Promise<Response> {
    if (user.role !== "admin") return json({ error: "Acción no permitida" }, 403);
    const body = (await request.json()) as {
      maintenance?: boolean;
      maintenanceMessage?: string;
      environment?: AppEnvironment;
    };
    const nowISO = new Date().toISOString();
    let current = db;

    if (
      (body.environment === "demo" || body.environment === "produccion") &&
      body.environment !== db.config.environment
    ) {
      if (body.environment === "produccion") {
        const admins = db.users.filter((u) => u.role === "admin" && u.active);
        const keep = admins.length > 0 ? admins : [user];
        const keptDnis = new Set(keep.map((u) => u.dni));
        const fresh = buildProductionSeed(keep);
        fresh.sessions = Object.fromEntries(
          Object.entries(db.sessions).filter(([, s]) => keptDnis.has(s.dni)),
        );
        fresh.config = { ...db.config, environment: "produccion" };
        const avatarKeys = await this.ctx.storage.list({ prefix: AVATAR_PREFIX });
        const stale = [...avatarKeys.keys()].filter(
          (k) => !keptDnis.has(k.slice(AVATAR_PREFIX.length)),
        );
        if (stale.length > 0) await this.ctx.storage.delete(stale);
        this.db = fresh;
        current = fresh;
        console.log("[VitmaternaStore] Entorno cambiado a PRODUCCIÓN");
      } else {
        const fresh = buildSeed();
        if (!fresh.users.some((u) => u.dni === user.dni)) {
          fresh.users.push({ ...user });
        }
        fresh.sessions = db.sessions;
        fresh.config = { ...db.config, environment: "demo" };
        this.db = fresh;
        current = fresh;
        console.log("[VitmaternaStore] Entorno cambiado a DEMOSTRACIÓN");
      }
    }

    if (body.maintenance !== undefined) {
      current.config.maintenance = body.maintenance === true;
    }
    if (typeof body.maintenanceMessage === "string") {
      const msg = body.maintenanceMessage.trim().slice(0, 240);
      current.config.maintenanceMessage = msg.length > 0 ? msg : DEFAULT_MAINTENANCE_MESSAGE;
    }
    current.config.updatedAtISO = nowISO;

    this.regenerateAutoAlerts(current);
    await this.save();
    const freshUser = current.users.find((u) => u.dni === user.dni) ?? user;
    return json({ snapshot: this.snapshotFor(freshUser, current) });
  }

  // ---------- Administración ----------

  /** Admin crea cualquier rol; la obstetra solo puede registrar gestantes. */
  private async handleCreateUser(request: Request, db: DBState, user: StoredUser): Promise<Response> {
    if (user.role !== "admin" && user.role !== "obstetra") {
      return json({ error: "Acción no permitida" }, 403);
    }
    const body = (await request.json()) as {
      dni?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role?: "gestante" | "obstetra" | "admin";
      phone?: string;
      patient?: {
        age?: number;
        community?: string;
        fumKey?: string;
        hbObserved?: number;
        bpSys?: number;
        bpDia?: number;
        imc?: number;
        gestas?: number;
        cesareas?: number;
        abortos?: number;
      };
    };

    const dni = (body.dni ?? "").trim();
    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const role = body.role;
    const password = body.password ?? "";

    if (user.role === "obstetra" && role !== "gestante") {
      return json({ error: "La obstetra solo puede registrar cuentas de gestantes" }, 403);
    }
    if (!/^\d{8}$/.test(dni)) return json({ error: "El DNI debe tener 8 dígitos" }, 400);
    if (db.users.some((u) => u.dni === dni) || db.patients.some((p) => p.dni === dni)) {
      return json({ error: "Ya existe un usuario o paciente con ese DNI" }, 400);
    }
    if (firstName.length === 0 || lastName.length === 0) return json({ error: "Nombres y apellidos son obligatorios" }, 400);
    if (password.length < 6) return json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    if (role !== "gestante" && role !== "obstetra" && role !== "admin") return json({ error: "Rol no válido" }, 400);

    let patientId: string | undefined;
    if (role === "gestante") {
      const p = body.patient;
      if (!p || !p.fumKey || !/^\d{4}-\d{2}-\d{2}$/.test(p.fumKey)) {
        return json({ error: "Para una gestante se necesita la fecha de última menstruación (FUM)" }, 400);
      }
      const todayKey = peruDayKey();
      if (p.fumKey > todayKey) return json({ error: "La FUM no puede ser una fecha futura" }, 400);
      patientId = `p-${crypto.randomUUID().slice(0, 8)}`;
      const patient: Patient = {
        id: patientId,
        dni,
        firstName,
        lastName,
        age: Math.max(12, Math.min(60, Math.round(p.age ?? 25))),
        community: (p.community ?? "Talavera").trim() || "Talavera",
        phone: (body.phone ?? "").trim(),
        fumKey: p.fumKey,
        gestas: Math.max(1, Math.round(p.gestas ?? 1)),
        cesareas: Math.max(0, Math.round(p.cesareas ?? 0)),
        abortos: Math.max(0, Math.round(p.abortos ?? 0)),
        obitoFetal: false,
        rhSensibilizado: false,
        antecedentes: [],
        hbObserved: Math.max(4, Math.min(20, p.hbObserved ?? 13)),
        bpSys: Math.max(70, Math.min(240, Math.round(p.bpSys ?? 110))),
        bpDia: Math.max(40, Math.min(140, Math.round(p.bpDia ?? 70))),
        imc: Math.max(12, Math.min(60, Math.round((p.imc ?? 24) * 10) / 10)),
        adherenceBase: 0,
      };
      db.patients.push(patient);

      // Cronograma MINSA generado por el servidor solo si autoControls está activo.
      const shouldAutoAssign = user.autoControls !== false;
      if (shouldAutoAssign) {
        MINSA_WEEKS.forEach((week, i) => {
          const dateKey = addDaysToKey(patient.fumKey, week * 7);
          if (dateKey < todayKey) return;
          const preferred = ["09:00", "10:30", "11:30", "15:00"][i % 4];
          const free = this.freeSlots(db, dateKey);
          const time = free.includes(preferred) ? preferred : free[0] ?? preferred;
          db.appointments.push({
            id: `${patientId}-c${i + 1}`,
            patientId: patientId as string,
            control: i + 1,
            week,
            dateKey,
            time,
            motivo: `Control prenatal ${i + 1} de 8`,
            estado: "programada",
            lugar: HEALTH_CENTER,
          });
        });
      }
    }

    db.users.push({
      dni,
      password,
      role,
      firstName,
      lastName,
      active: true,
      patientId,
      phone: (body.phone ?? "").trim() || undefined,
      createdAtISO: new Date().toISOString(),
    });

    this.regenerateAutoAlerts(db);
    await this.save();
    return json({ snapshot: this.snapshotFor(user, db) });
  }

  private async handleSetActive(request: Request, db: DBState, user: StoredUser): Promise<Response> {
    if (user.role !== "admin") return json({ error: "Acción no permitida" }, 403);
    const body = (await request.json()) as { dni?: string; active?: boolean };
    if (body.dni === user.dni) return json({ error: "No puedes desactivar tu propia cuenta" }, 400);
    const target = db.users.find((u) => u.dni === body.dni);
    if (!target) return json({ error: "Usuario no encontrado" }, 404);
    target.active = body.active === true;
    if (!target.active) {
      Object.keys(db.sessions).forEach((t) => {
        if (db.sessions[t].dni === target.dni) delete db.sessions[t];
      });
    }
    await this.save();
    return json({ snapshot: this.snapshotFor(user, db) });
  }

  private async handleReset(db: DBState, user: StoredUser): Promise<Response> {
    if (user.role !== "admin") return json({ error: "Acción no permitida" }, 403);
    const fresh = buildSeed();
    fresh.sessions = db.sessions;
    // Se conserva el mantenimiento y la cuenta admin actual si no es del seed.
    fresh.config = { ...db.config, environment: "demo", updatedAtISO: new Date().toISOString() };
    if (!fresh.users.some((u) => u.dni === user.dni)) {
      fresh.users.push({ ...user });
    }
    this.db = fresh;
    this.regenerateAutoAlerts(fresh);
    const avatarKeys = await this.ctx.storage.list({ prefix: AVATAR_PREFIX });
    if (avatarKeys.size > 0) {
      await this.ctx.storage.delete([...avatarKeys.keys()]);
    }
    await this.save();
    console.log("[VitmaternaStore] Datos de demostración restaurados");
    const freshUser = fresh.users.find((u) => u.dni === user.dni) ?? user;
    return json({ snapshot: this.snapshotFor(freshUser, fresh) });
  }

  // ---------- Alertas tempranas automáticas ----------

  private regenerateAutoAlerts(db: DBState): void {
    const todayKey = peruDayKey();
    const nowISO = new Date().toISOString();
    const derivedTypes = ["inasistencia", "adherencia", "anemia", "sin_control"];
    const previous = new Map(db.alerts.filter((a) => derivedTypes.includes(a.type)).map((a) => [a.id, a]));
    const kept = db.alerts.filter((a) => !derivedTypes.includes(a.type) || a.status === "atendida");
    const attendedIds = new Set(kept.map((a) => a.id));
    const fresh: Alert[] = [];

    const push = (alert: Omit<Alert, "atISO" | "status">) => {
      if (attendedIds.has(alert.id)) return;
      const prev = previous.get(alert.id);
      fresh.push({ ...alert, atISO: prev?.atISO ?? nowISO, status: "abierta" });
    };

    db.appointments.forEach((a) => {
      if (a.estado !== "no_asistida") return;
      const p = db.patients.find((x) => x.id === a.patientId);
      if (!p) return;
      push({
        id: `al-na-${a.id}`,
        type: "inasistencia",
        patientId: a.patientId,
        title: "Inasistencia a control",
        detail: a.control
          ? `No asistió al control ${a.control} de 8 (${a.dateKey}).`
          : `No asistió a su cita del ${a.dateKey}.`,
      });
    });

    db.patients.forEach((p) => {
      const view = this.computePatient(p, db, todayKey);

      if (view.adherence30 < 50) {
        push({
          id: `al-adh-${p.id}`,
          type: "adherencia",
          patientId: p.id,
          title: "Adherencia baja sostenida",
          detail: `Adherencia al tratamiento de ${view.adherence30}% en los últimos 30 días.`,
        });
      }

      if (view.anemia === "moderada" || view.anemia === "severa") {
        push({
          id: `al-anemia-${p.id}`,
          type: "anemia",
          patientId: p.id,
          title: `Anemia ${view.anemia}`,
          detail: `Hb observada ${p.hbObserved} g/dL → corregida por altitud ${view.hbCorrected} g/dL.`,
        });
      }

      const overdue = db.appointments.find(
        (a) =>
          a.patientId === p.id &&
          a.control !== null &&
          (a.estado === "programada" || a.estado === "confirmada") &&
          a.dateKey < todayKey,
      );
      if (overdue) {
        push({
          id: `al-ctrl-${p.id}`,
          type: "sin_control",
          patientId: p.id,
          title: "Sin control en la semana esperada",
          detail: `El control ${overdue.control} de 8 estaba previsto para el ${overdue.dateKey} y sigue pendiente.`,
        });
      }
    });

    db.alerts = [...kept, ...fresh];
  }

  // ---------- Cálculos clínicos por paciente ----------

  private computePatient(p: Patient, db: DBState, todayKey: string): PatientView {
    const weeks = gestationalWeeks(p.fumKey, todayKey);
    const risk = assessRisk(p);
    const hb = correctedHb(p.hbObserved);
    const mySupplements = db.supplements.filter((s) => s.patientId === p.id);
    const myLogs = db.intakes[p.id];

    // Adherencia por tomas: cada medicamento aporta sus tomas diarias al total
    // y solo cuenta desde el día en que fue asignado.
    let adherence30 = p.adherenceBase;
    if (mySupplements.length > 0 && myLogs && Object.keys(myLogs).length > 0) {
      let taken = 0;
      let total = 0;
      for (let i = 1; i <= 30; i++) {
        const key = addDaysToKey(todayKey, -i);
        const dayLogs = myLogs[key];
        for (const s of mySupplements) {
          if (!isSupplementActiveOn(s, key)) continue;
          const times = timesPerDayOf(s);
          total += times;
          taken += Math.min(countDoses(dayLogs, s.id), times);
        }
      }
      adherence30 = total > 0 ? Math.round((taken / total) * 100) : p.adherenceBase;
    }

    let streak = 0;
    if (mySupplements.length > 0 && myLogs) {
      const complete = (key: string) => {
        const active = mySupplements.filter((s) => isSupplementActiveOn(s, key));
        if (active.length === 0) return false;
        const dayLogs = myLogs[key];
        return active.every((s) => countDoses(dayLogs, s.id) >= timesPerDayOf(s));
      };
      let cursor = todayKey;
      if (!complete(cursor)) cursor = addDaysToKey(todayKey, -1);
      while (complete(cursor) && streak < 60) {
        streak += 1;
        cursor = addDaysToKey(cursor, -1);
      }
    }

    const upcoming = db.appointments
      .filter((a) => a.patientId === p.id && a.dateKey >= todayKey && isActiveState(a.estado))
      .sort((a, b) => (a.dateKey === b.dateKey ? a.time.localeCompare(b.time) : a.dateKey.localeCompare(b.dateKey)));

    return {
      ...p,
      weeks,
      daysExtra: gestationalDays(p.fumKey, todayKey),
      trimester: trimester(weeks),
      fppKey: fppKeyFromFum(p.fumKey),
      hbCorrected: hb,
      anemia: anemiaClass(hb),
      riskLevel: risk.level,
      riskScore: risk.score,
      riskFactors: risk.factors,
      adherence30,
      streak,
      nextAppointment: upcoming[0] ?? null,
    };
  }

  // ---------- Snapshot por rol ----------

  private snapshotFor(user: StoredUser, db: DBState): Snapshot {
    const todayKey = peruDayKey();
    const isGestante = user.role === "gestante";
    const pid = user.patientId;

    const avatarByDni = new Map<string, number | undefined>(
      db.users.map((u) => [u.dni, u.avatarVersion]),
    );
    const patients = db.patients
      .filter((p) => (isGestante ? p.id === pid : true))
      .map((p) => {
        const view = this.computePatient(p, db, todayKey);
        const avatarVersion = avatarByDni.get(p.dni);
        return avatarVersion ? { ...view, avatarVersion } : view;
      });

    const scopeById = <T extends { patientId: string }>(items: T[]): T[] =>
      isGestante ? items.filter((i) => i.patientId === pid) : items;

    const snapshot: Snapshot = {
      serverTimeISO: new Date().toISOString(),
      todayKey,
      me: publicUser(user),
      center: { name: HEALTH_CENTER, altitudeMsnm: ALTITUDE_MSNM, hbFactor: HB_CORRECTION_FACTOR },
      patients,
      appointments: scopeById(db.appointments),
      supplements: scopeById(db.supplements),
      intakes: isGestante && pid ? { [pid]: db.intakes[pid] ?? {} } : db.intakes,
      messages: isGestante ? db.messages.filter((m) => m.convId === pid) : db.messages,
      alerts: scopeById(db.alerts),
      visits: scopeById(db.visits),
      presence: this.presenceFor(user, db),
      config: db.config,
    };

    if (user.role === "admin") {
      snapshot.users = db.users.map(publicUser);
      snapshot.reports = {
        d30: this.buildReport(db, todayKey, 30),
        total: this.buildReport(db, todayKey, 100000),
      };
    }
    return snapshot;
  }

  // ---------- Reportes MINSA ----------

  private buildReport(db: DBState, todayKey: string, periodDays: number): ReportBlock {
    const fromKey = addDaysToKey(todayKey, -periodDays);
    const views = db.patients.map((p) => this.computePatient(p, db, todayKey));

    const riesgo: Record<RiskLevel, number> = { verde: 0, amarillo: 0, rojo: 0 };
    const anemia: Record<AnemiaClass, number> = { normal: 0, leve: 0, moderada: 0, severa: 0 };
    views.forEach((v) => {
      riesgo[v.riskLevel] += 1;
      anemia[v.anemia] += 1;
    });

    const dueControls = db.appointments.filter(
      (a) => a.control !== null && a.dateKey < todayKey && a.dateKey >= fromKey,
    );
    const asistidos = dueControls.filter((a) => a.estado === "asistida").length;

    const pastAppointments = db.appointments.filter((a) => a.dateKey < todayKey && a.dateKey >= fromKey);
    const asistidas = pastAppointments.filter((a) => a.estado === "asistida").length;
    const noAsistidas = pastAppointments.filter((a) => a.estado !== "asistida").length;

    const periodAlerts = db.alerts.filter((a) => a.atISO.slice(0, 10) >= fromKey);
    const atendidas = periodAlerts.filter((a) => a.status === "atendida").length;

    const adherencias = views.map((v) => v.adherence30);
    const adherenciaPromedio =
      adherencias.length > 0 ? Math.round(adherencias.reduce((a, b) => a + b, 0) / adherencias.length) : 0;
    const cobertura =
      views.length > 0 ? Math.round((views.filter((v) => v.adherence30 >= 75).length / views.length) * 100) : 0;

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

    // Visitas domiciliarias del periodo.
    const periodVisits = db.visits.filter((v) => v.dateKey >= fromKey);
    const visitasRealizadas = periodVisits.filter((v) => v.estado === "realizada").length;

    // Distribución por trimestre de embarazo.
    const trimestres = { t1: 0, t2: 0, t3: 0 };
    views.forEach((v) => {
      trimestres[`t${v.trimester}` as "t1" | "t2" | "t3"] += 1;
    });

    // Desglose por comunidad (ordenado por cantidad de gestantes).
    const byCommunity = new Map<string, PatientView[]>();
    views.forEach((v) => {
      const list = byCommunity.get(v.community) ?? [];
      list.push(v);
      byCommunity.set(v.community, list);
    });
    const porComunidad: CommunityReport[] = [...byCommunity.entries()]
      .map(([community, list]) => ({
        community,
        gestantes: list.length,
        riesgoAlto: list.filter((v) => v.riskLevel === "rojo").length,
        anemiaCount: list.filter((v) => v.anemia === "moderada" || v.anemia === "severa").length,
        adherenciaPromedio: Math.round(
          list.reduce((acc, v) => acc + v.adherence30, 0) / list.length,
        ),
      }))
      .sort((a, b) => b.gestantes - a.gestantes);

    // Asistencia por bloques de 7 días (6 semanas, de la más antigua a la actual).
    const asistenciaSemanal: WeeklyAttendance[] = [];
    for (let w = 5; w >= 0; w--) {
      const startKey = addDaysToKey(todayKey, -(w * 7) - 6);
      const endKey = addDaysToKey(todayKey, -(w * 7));
      const inBlock = db.appointments.filter(
        (a) => a.dateKey >= startKey && a.dateKey <= endKey,
      );
      asistenciaSemanal.push({
        startKey,
        asistidas: inBlock.filter((a) => a.estado === "asistida").length,
        total: inBlock.length,
      });
    }

    return {
      gestantes: views.length,
      riesgo,
      anemia,
      controlesOportunos: { asistidos, esperados: dueControls.length, pct: pct(asistidos, dueControls.length) },
      adherenciaPromedio,
      coberturaSuplementacion: cobertura,
      asistencia: { asistidas, noAsistidas, pct: pct(asistidas, pastAppointments.length) },
      alertas: {
        total: periodAlerts.length,
        atendidas,
        abiertas: periodAlerts.filter((a) => a.status === "abierta").length,
        pct: pct(atendidas, periodAlerts.length),
      },
      citasHoy: db.appointments.filter((a) => a.dateKey === todayKey && isActiveState(a.estado)).length,
      visitas: {
        programadas: periodVisits.filter((v) => v.estado === "programada").length,
        realizadas: visitasRealizadas,
        pct: pct(visitasRealizadas, periodVisits.length),
      },
      trimestres,
      porComunidad,
      asistenciaSemanal,
    };
  }
}

/** Suprime aviso de variables no usadas en tipos re-exportados. */
export type { Supplement, Visit };
