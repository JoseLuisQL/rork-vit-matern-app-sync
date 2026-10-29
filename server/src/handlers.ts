/**
 * VITMATERNA — Manejadores HTTP (misma API que el backend en la nube).
 * Todas las mutaciones corren dentro de una transacción; el snapshot se
 * construye con el estado ya actualizado y las alertas regeneradas.
 */
import bcrypt from "bcryptjs";
import type { Context } from "hono";
import type { PoolClient } from "pg";
import { applyAction } from "./actions";
import {
  addDaysToKey,
  AGENDA_SLOTS,
  gestationalWeeks,
  isValidDayKey,
  MINSA_WEEKS,
  peruDayKey,
} from "./clinical";
import { pool, withTx } from "./db";
import type { Queryable } from "./db";
import { publicUser, regenerateAutoAlerts, snapshotFor } from "./domain";
import { notifyPatientByPatientId } from "./push";
import { presence } from "./presence";
import type { PresenceInput } from "./presence";
import { loadAppData, loadConfig, loadWhatsAppConfig, mapAppointment, mapPatient, mapUser } from "./rows";
import type { AppointmentRow, PatientRow, SessionRow, UserRow } from "./rows";
import {
  buildSeed,
  DEFAULT_MAINTENANCE_MESSAGE,
  DEMO_DNIS,
  HEALTH_CENTER,
  hashPassword,
  insertAppointment,
  insertArticle,
  insertPatient,
  insertSeedState,
  insertSupplement,
  insertUserRecord,
  SEED_VERSION,
  wipeData,
} from "./seed";
import type {
  ActionResult,
  AppEnvironment,
  Appointment,
  Article,
  ArticleLink,
  ClientAction,
  DemoAccount,
  Patient,
  Snapshot,
  SystemConfig,
  UserRecord,
  WhatsAppConfig,
} from "./types";
import { sendWhatsAppText, testWhatsAppConnection } from "./whatsapp/client";
import { dispatchAppointmentNotification, logWhatsAppDelivery } from "./whatsapp/dispatcher";
import { templateTestMessage } from "./whatsapp/templates";

export type AppEnv = { Variables: { user: UserRecord; config: SystemConfig } };
export type AppContext = Context<AppEnv>;

/** ~110 KB en binario; el cliente envía JPEG 320px comprimido (~20 KB). */
const MAX_AVATAR_DATA_URL_LENGTH = 150_000;
const AVATAR_DATA_URL_RE = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/;

async function readJson<T>(c: AppContext): Promise<T> {
  try {
    return (await c.req.json()) as T;
  } catch {
    return {} as T;
  }
}

/** Horarios ocupados de un día (citas activas + visitas programadas). */
async function takenSlots(
  db: Queryable,
  dateKey: string,
  ignoreAppointmentId?: string | null,
): Promise<Set<string>> {
  const res = await db.query<{ time: string }>(
    `SELECT time FROM appointments
      WHERE date_key = $1
        AND estado IN ('programada', 'confirmada', 'solicitud_reprogramacion')
        AND ($2::text IS NULL OR id <> $2)
     UNION
     SELECT time FROM visits WHERE date_key = $1 AND estado = 'programada'`,
    [dateKey, ignoreAppointmentId ?? null],
  );
  return new Set(res.rows.map((r) => r.time));
}

async function freeSlotsFor(
  db: Queryable,
  dateKey: string,
  ignoreAppointmentId?: string | null,
): Promise<string[]> {
  const taken = await takenSlots(db, dateKey, ignoreAppointmentId);
  return AGENDA_SLOTS.filter((s) => !taken.has(s));
}

/** Carga estado + regenera alertas + snapshot para el usuario (ya fresco). */
async function buildSnapshot(
  client: PoolClient,
  user: UserRecord,
  opts?: { regenerate?: boolean },
): Promise<Snapshot> {
  const data = await loadAppData(client);
  if (opts?.regenerate !== false) {
    await regenerateAutoAlerts(client, data);
  }
  const freshUser = data.users.find((u) => u.dni === user.dni) ?? user;
  return snapshotFor(freshUser, data, presence.viewsFor(freshUser, data));
}

// ---------- Auth ----------

export async function handleLogin(c: AppContext): Promise<Response> {
  const body = await readJson<{ dni?: string; password?: string }>(c);
  const dni = (body.dni ?? "").trim();
  const password = body.password ?? "";

  const res = await pool.query<UserRow>("SELECT * FROM users WHERE dni = $1", [dni]);
  const row = res.rows[0];
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return c.json(
      { error: "DNI o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo." },
      401,
    );
  }
  const user = mapUser(row);
  if (!user.active) {
    return c.json(
      { error: "Tu cuenta está desactivada. Comunícate con la administración del centro de salud." },
      403,
    );
  }
  const { config } = await loadConfig(pool);
  if (config.maintenance && user.role !== "admin") {
    return c.json({ error: config.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE }, 503);
  }

  const token = crypto.randomUUID();
  presence.touch(user);
  const snapshot = await withTx(async (client) => {
    await client.query("INSERT INTO sessions (token, dni) VALUES ($1, $2)", [token, user.dni]);
    // Se conservan las 120 sesiones más recientes (paridad con la nube).
    await client.query(
      `DELETE FROM sessions
        WHERE token NOT IN (SELECT token FROM sessions ORDER BY at_iso DESC, token LIMIT 120)`,
    );
    // Limpieza perezosa del registro de idempotencia.
    await client.query("DELETE FROM applied_actions WHERE applied_at < now() - interval '90 days'");
    return buildSnapshot(client, user);
  });
  return c.json({ token, user: publicUser(user), snapshot });
}

/** Configuración pública para el login: mantenimiento, entorno y accesos demo. */
export async function handlePublicConfig(c: AppContext): Promise<Response> {
  const { config } = await loadConfig(pool);
  let demoAccounts: DemoAccount[] = [];
  if (config.environment === "demo") {
    const res = await pool.query<UserRow>(
      "SELECT * FROM users WHERE dni = ANY($1::text[]) AND active = TRUE",
      [[...DEMO_DNIS]],
    );
    const byDni = new Map(res.rows.map((r) => [r.dni, mapUser(r)]));
    demoAccounts = DEMO_DNIS.map((dni) => byDni.get(dni))
      .filter((u): u is UserRecord => u !== undefined)
      .map((u) => ({
        dni: u.dni,
        name: `${u.firstName} ${u.lastName.split(" ")[0]}`,
        role: u.role,
      }));
  }
  return c.json({
    maintenance: config.maintenance,
    maintenanceMessage: config.maintenanceMessage,
    environment: config.environment,
    demoAccounts,
  });
}

// ---------- Sincronización (cola offline) ----------

export async function handleSync(c: AppContext): Promise<Response> {
  const user = c.get("user");
  const config = c.get("config");
  const body = await readJson<{ actions?: ClientAction[]; presence?: PresenceInput }>(c);
  presence.touch(user, body.presence ?? {});

  // Durante el mantenimiento no se aplican cambios de gestantes/obstetras;
  // sus acciones quedan en cola en el teléfono y entran solas al reabrir.
  const maintenanceHold = config.maintenance && user.role !== "admin";
  const actions = !maintenanceHold && Array.isArray(body.actions) ? body.actions : [];

  const { results, snapshot } = await withTx(async (client) => {
    const applied: ActionResult[] = [];
    for (const action of actions) {
      if (!action || typeof action.id !== "string") continue;
      const done = await client.query("SELECT 1 FROM applied_actions WHERE id = $1", [action.id]);
      if ((done.rowCount ?? 0) > 0) {
        applied.push({ id: action.id, ok: true });
        continue;
      }
      const error = await applyAction(client, user, action);
      await client.query(
        "INSERT INTO applied_actions (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
        [action.id],
      );
      applied.push(error ? { id: action.id, ok: false, error } : { id: action.id, ok: true });
    }
    return { results: applied, snapshot: await buildSnapshot(client, user) };
  });

  return c.json({ results, snapshot });
}

// ---------- Agenda sin cruces (solo online) ----------

type ScheduleOutcome =
  | { kind: "ok"; snapshot: Snapshot }
  | { kind: "conflict"; freeSlots: string[] }
  | { kind: "notFound"; error: string }
  | { kind: "invalid"; error: string };

export async function handleSchedule(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role === "gestante") return c.json({ error: "Acción no permitida" }, 403);

  const body = await readJson<{
    mode?: "cita" | "reprogramar" | "visita";
    patientId?: string;
    appointmentId?: string;
    dateKey?: string;
    time?: string;
    motivo?: string;
    notas?: string;
  }>(c);
  const todayKey = peruDayKey();
  const dateKey = body.dateKey ?? "";
  const time = body.time ?? "";
  const cleanNotas = body.notas !== undefined ? body.notas.trim().slice(0, 500) : undefined;

  if (!isValidDayKey(dateKey)) return c.json({ error: "Fecha no válida" }, 400);
  if (dateKey < todayKey) {
    return c.json({ error: "La fecha ya pasó. Elige un día desde hoy." }, 400);
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return c.json({ error: "Ingresa una hora válida en formato HH:MM (ej. 08:30 o 17:15)" }, 400);
  }

  const outcome = await withTx<ScheduleOutcome>(async (client) => {
    const conflict = async (ignoreId?: string | null): Promise<ScheduleOutcome> => ({
      kind: "conflict",
      freeSlots: await freeSlotsFor(client, dateKey, ignoreId),
    });

    if (body.mode === "reprogramar") {
      const apptId = body.appointmentId ?? "";
      const res = await client.query<AppointmentRow>("SELECT * FROM appointments WHERE id = $1", [apptId]);
      const apptRow = res.rows[0];
      if (!apptRow) return { kind: "notFound", error: "La cita ya no existe" };
      if ((await takenSlots(client, dateKey, apptId)).has(time)) return conflict(apptId);
      const nextMotivo =
        body.motivo && body.motivo.trim().length > 0
          ? body.motivo.trim().slice(0, 160)
          : apptRow.motivo;
      const nextNotas =
        cleanNotas !== undefined ? (cleanNotas.length > 0 ? cleanNotas : null) : (apptRow.notas ?? null);
      await client.query(
        "UPDATE appointments SET date_key = $2, time = $3, estado = 'programada', motivo = $4, notas = $5 WHERE id = $1",
        [apptId, dateKey, time, nextMotivo, nextNotas],
      );

      // Notificación WhatsApp de reprogramación
      const patRes = await client.query<PatientRow>("SELECT * FROM patients WHERE id = $1", [
        apptRow.patient_id,
      ]);
      const pRow = patRes.rows[0];
      if (pRow) {
        const waConfig = await loadWhatsAppConfig(client);
        void dispatchAppointmentNotification(
          client,
          waConfig,
          mapPatient(pRow),
          {
            ...mapAppointment(apptRow),
            dateKey,
            time,
            motivo: nextMotivo,
            ...(nextNotas ? { notas: nextNotas } : {}),
          },
          true,
          user,
        );

        // Notificación Push a la gestante
        void notifyPatientByPatientId(client, apptRow.patient_id, {
          title: "Tu cita prenatal ha sido reprogramada",
          body: `Tu cita ahora es el ${dateKey} a las ${time}.`,
          channelId: "avisos",
          sound: "aviso.wav",
          priority: "high",
          data: { kind: "cita", appointmentId: apptId },
        });
      }
    } else if (body.mode === "cita") {
      const res = await client.query<PatientRow>(
        "SELECT * FROM patients WHERE id = $1",
        [body.patientId ?? ""],
      );
      const pRow = res.rows[0];
      if (!pRow) return { kind: "notFound", error: "Paciente no encontrada" };
      if ((await takenSlots(client, dateKey)).has(time)) return conflict();

      const patientFum = pRow.fum_key;
      let controlNum: number | null = null;
      if (body.motivo) {
        const match = body.motivo.match(/control\s*(?:prenatal\s*)?([1-8])/i);
        if (match && match[1]) {
          controlNum = parseInt(match[1], 10);
        }
      }
      const week =
        controlNum !== null && patientFum ? gestationalWeeks(patientFum, dateKey) : null;

      const newAppt: Appointment = {
        id: `ap-${crypto.randomUUID().slice(0, 8)}`,
        patientId: body.patientId as string,
        control: controlNum,
        week,
        dateKey,
        time,
        motivo: (body.motivo ?? (controlNum ? `Control prenatal ${controlNum} de 8` : "Consulta adicional")).trim() || "Consulta adicional",
        estado: "programada",
        lugar: HEALTH_CENTER,
        ...(cleanNotas ? { notas: cleanNotas } : {}),
      };
      await insertAppointment(client, newAppt);

      // Notificación WhatsApp de nueva cita
      const waConfig = await loadWhatsAppConfig(client);
      void dispatchAppointmentNotification(client, waConfig, mapPatient(pRow), newAppt, false, user);

      // Notificación Push a la gestante
      void notifyPatientByPatientId(client, body.patientId as string, {
        title: "Tienes una nueva cita prenatal",
        body: `Cita programada para el ${dateKey} a las ${time} (${newAppt.motivo}).`,
        channelId: "avisos",
        sound: "aviso.wav",
        priority: "high",
        data: { kind: "cita", appointmentId: newAppt.id },
      });
    } else if (body.mode === "visita") {
      const res = await client.query("SELECT 1 FROM patients WHERE id = $1", [body.patientId ?? ""]);
      if ((res.rowCount ?? 0) === 0) return { kind: "notFound", error: "Paciente no encontrada" };
      if ((await takenSlots(client, dateKey)).has(time)) return conflict();
      await client.query(
        `INSERT INTO visits (id, patient_id, date_key, time, motivo, estado, created_at_iso)
         VALUES ($1, $2, $3, $4, $5, 'programada', now())`,
        [
          `v-${crypto.randomUUID().slice(0, 8)}`,
          body.patientId,
          dateKey,
          time,
          (body.motivo ?? "Visita domiciliaria").trim() || "Visita domiciliaria",
        ],
      );
    } else {
      return { kind: "invalid", error: "Operación no válida" };
    }

    return { kind: "ok", snapshot: await buildSnapshot(client, user) };
  });

  switch (outcome.kind) {
    case "ok":
      return c.json({ snapshot: outcome.snapshot });
    case "conflict":
      return c.json(
        {
          error: "Ese horario ya está ocupado. Elige uno de los horarios libres.",
          freeSlots: outcome.freeSlots,
        },
        409,
      );
    case "notFound":
      return c.json({ error: outcome.error }, 404);
    case "invalid":
      return c.json({ error: outcome.error }, 400);
  }
}

// ---------- Foto de perfil ----------

/** Sirve la foto de perfil como imagen (pública, con revalidación rápida para refrescar cambios). */
export async function handleAvatarImage(c: AppContext): Promise<Response> {
  const dni = decodeURIComponent(c.req.param("dni") ?? "").trim();
  if (!/^\d{8}$/.test(dni)) return c.json({ error: "Solicitud no válida" }, 400);
  const res = await pool.query<{ mime: string; bytes: Buffer }>(
    "SELECT mime, bytes FROM avatars WHERE dni = $1",
    [dni],
  );
  const row = res.rows[0];
  if (!row) return c.json({ error: "Sin foto de perfil" }, 404);
  return new Response(new Uint8Array(row.bytes), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

/** Guarda o quita la foto de perfil del usuario con sesión activa. */
export async function handleSetAvatar(c: AppContext): Promise<Response> {
  const user = c.get("user");
  const body = await readJson<{ dataUrl?: string | null }>(c);

  if (body.dataUrl === null) {
    const snapshot = await withTx(async (client) => {
      await client.query("DELETE FROM avatars WHERE dni = $1", [user.dni]);
      await client.query("UPDATE users SET avatar_version = NULL WHERE dni = $1", [user.dni]);
      const updatedUser: UserRecord = { ...user, avatarVersion: null };
      return buildSnapshot(client, updatedUser, { regenerate: false });
    });
    return c.json({ snapshot });
  }

  const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
  const match = dataUrl.match(AVATAR_DATA_URL_RE);
  if (!match) {
    return c.json({ error: "La imagen no tiene un formato válido (JPEG o PNG)" }, 400);
  }
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    return c.json({ error: "La foto es demasiado pesada. Intenta con otra." }, 400);
  }
  const mime = match[1] ?? "image/jpeg";
  const bytes = Buffer.from(match[2] ?? "", "base64");

  const snapshot = await withTx(async (client) => {
    await client.query(
      `INSERT INTO avatars (dni, mime, bytes, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (dni) DO UPDATE SET mime = EXCLUDED.mime, bytes = EXCLUDED.bytes, updated_at = now()`,
      [user.dni, mime, bytes],
    );
    const updateRes = await client.query<{ avatar_version: number }>(
      "UPDATE users SET avatar_version = COALESCE(avatar_version, 0) + 1 WHERE dni = $1 RETURNING avatar_version",
      [user.dni],
    );
    const newVersion = updateRes.rows[0]?.avatar_version ?? (user.avatarVersion ? user.avatarVersion + 1 : 1);
    const updatedUser: UserRecord = { ...user, avatarVersion: newVersion };
    return buildSnapshot(client, updatedUser, { regenerate: false });
  });
  return c.json({ snapshot });
}

/** Actualiza datos de perfil (nombres, teléfono, contraseña opcional) del usuario conectado. */
export async function handleUpdateProfile(c: AppContext): Promise<Response> {
  const user = c.get("user");
  const body = await readJson<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
  }>(c);

  const firstName = (body.firstName ?? user.firstName).trim();
  const lastName = (body.lastName ?? user.lastName).trim();
  const phone = body.phone !== undefined ? body.phone.trim() : (user.phone ?? "");
  const password = body.password !== undefined ? body.password.trim() : "";

  if (firstName.length === 0 || lastName.length === 0) {
    return c.json({ error: "Nombres y apellidos son obligatorios" }, 400);
  }
  if (password.length > 0 && password.length < 6) {
    return c.json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
  }

  const snapshot = await withTx(async (client) => {
    let newHash: string | undefined;
    if (password.length >= 6) {
      newHash = hashPassword(password);
      await client.query(
        "UPDATE users SET first_name = $2, last_name = $3, phone = $4, password_hash = $5 WHERE dni = $1",
        [user.dni, firstName, lastName, phone || null, newHash],
      );
    } else {
      await client.query(
        "UPDATE users SET first_name = $2, last_name = $3, phone = $4 WHERE dni = $1",
        [user.dni, firstName, lastName, phone || null],
      );
    }

    // Si el usuario es gestante, actualizar también teléfono y nombres en la tabla patients si aplica
    if (user.role === "gestante" && user.patientId) {
      await client.query(
        "UPDATE patients SET first_name = $2, last_name = $3, phone = $4 WHERE id = $1",
        [user.patientId, firstName, lastName, phone || ""],
      );
    }

    const updatedUser: UserRecord = {
      ...user,
      firstName,
      lastName,
      phone: phone || null,
      passwordHash: newHash ?? user.passwordHash,
    };
    return buildSnapshot(client, updatedUser, { regenerate: false });
  });

  return c.json({ snapshot });
}

/** Configuración de controles automáticos por obstetra / usuario. */
export async function handleSetAutoControls(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "obstetra" && user.role !== "admin") {
    return c.json({ error: "Acción no permitida" }, 403);
  }
  const body = await readJson<{ autoControls?: boolean }>(c);
  const autoControls = body.autoControls !== false;

  const snapshot = await withTx(async (client) => {
    await client.query("UPDATE users SET auto_controls = $2 WHERE dni = $1", [
      user.dni,
      autoControls,
    ]);
    const updatedUser: UserRecord = { ...user, autoControls };
    return buildSnapshot(client, updatedUser, { regenerate: false });
  });
  return c.json({ snapshot });
}

// ---------- Administración ----------

/** Admin crea cualquier rol; la obstetra solo puede registrar gestantes. */
export async function handleCreateUser(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin" && user.role !== "obstetra") {
    return c.json({ error: "Acción no permitida" }, 403);
  }
  const body = await readJson<{
    dni?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: "gestante" | "obstetra" | "admin";
    phone?: string;
    obstetraDni?: string;
    patient?: {
      obstetraDni?: string;
      age?: number;
      community?: string;
      fumKey?: string;
      hbObserved?: number;
      bpSys?: number;
      bpDia?: number;
      weight?: number;
      height?: number;
      imc?: number;
      gestas?: number;
      cesareas?: number;
      abortos?: number;
    };
  }>(c);

  const dni = (body.dni ?? "").trim();
  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const role = body.role;
  const password = body.password ?? "";

  if (user.role === "obstetra" && role !== "gestante") {
    return c.json({ error: "La obstetra solo puede registrar cuentas de gestantes" }, 403);
  }
  if (!/^\d{8}$/.test(dni)) return c.json({ error: "El DNI debe tener 8 dígitos" }, 400);
  if (firstName.length === 0 || lastName.length === 0) {
    return c.json({ error: "Nombres y apellidos son obligatorios" }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
  }
  if (role !== "gestante" && role !== "obstetra" && role !== "admin") {
    return c.json({ error: "Rol no válido" }, 400);
  }

  const todayKey = peruDayKey();
  let fumKey = "";
  if (role === "gestante") {
    const p = body.patient;
    if (!p || !p.fumKey || !isValidDayKey(p.fumKey)) {
      return c.json(
        { error: "Para una gestante se necesita la fecha de última menstruación (FUM)" },
        400,
      );
    }
    if (p.fumKey > todayKey) {
      return c.json({ error: "La FUM no puede ser una fecha futura" }, 400);
    }
    fumKey = p.fumKey;
  }

  const outcome = await withTx<{ error?: string; snapshot?: Snapshot }>(async (client) => {
    const dup = await client.query(
      "SELECT 1 FROM users WHERE dni = $1 UNION SELECT 1 FROM patients WHERE dni = $1",
      [dni],
    );
    if ((dup.rowCount ?? 0) > 0) {
      return { error: "Ya existe un usuario o paciente con ese DNI" };
    }

    let patientId: string | null = null;
    if (role === "gestante") {
      const p = body.patient ?? {};
      patientId = `p-${crypto.randomUUID().slice(0, 8)}`;
      const weight =
        typeof p.weight === "number" && Number.isFinite(p.weight) && p.weight > 0
          ? Math.max(30, Math.min(200, Math.round(p.weight * 10) / 10))
          : undefined;
      const rawHeight =
        typeof p.height === "number" && Number.isFinite(p.height) && p.height > 0
          ? p.height > 3
            ? p.height / 100
            : p.height
          : undefined;
      const height =
        rawHeight !== undefined
          ? Math.max(1.2, Math.min(2.2, Math.round(rawHeight * 100) / 100))
          : undefined;
      const calculatedImc =
        weight !== undefined && height !== undefined && height > 0
          ? Math.round((weight / (height * height)) * 10) / 10
          : p.imc ?? 24;
      let defaultObstetraDni =
        user.role === "obstetra"
          ? user.dni
          : (body.obstetraDni ?? p.obstetraDni ?? "").trim();
      if (!defaultObstetraDni) {
        const obsRes = await client.query<{ dni: string }>(
          "SELECT dni FROM users WHERE role = 'obstetra' AND active = TRUE ORDER BY seq LIMIT 1",
        );
        defaultObstetraDni = obsRes.rows[0]?.dni ?? "11111111";
      }
      const patient: Patient = {
        id: patientId,
        dni,
        firstName,
        lastName,
        obstetraDni: defaultObstetraDni,
        age: Math.max(12, Math.min(60, Math.round(p.age ?? 25))),
        community: (p.community ?? "Talavera").trim() || "Talavera",
        phone: (body.phone ?? "").trim(),
        fumKey,
        gestas: Math.max(1, Math.round(p.gestas ?? 1)),
        cesareas: Math.max(0, Math.round(p.cesareas ?? 0)),
        abortos: Math.max(0, Math.round(p.abortos ?? 0)),
        obitoFetal: false,
        rhSensibilizado: false,
        antecedentes: [],
        hbObserved: Math.max(4, Math.min(20, p.hbObserved ?? 13)),
        bpSys: Math.max(70, Math.min(240, Math.round(p.bpSys ?? 110))),
        bpDia: Math.max(40, Math.min(140, Math.round(p.bpDia ?? 70))),
        ...(weight !== undefined ? { weight } : {}),
        ...(height !== undefined ? { height } : {}),
        imc: Math.max(12, Math.min(60, Math.round(calculatedImc * 10) / 10)),
        adherenceBase: 0,
      };
      await insertPatient(client, patient);
      // Issue #52: No se generan controles ni citas prenatales automáticas al registrar una gestante;
      // el personal de obstetricia los programa manualmente según la agenda real del establecimiento.
    }

    await client.query(
      `INSERT INTO users (dni, password_hash, role, first_name, last_name, active, patient_id, phone, auto_controls, created_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, FALSE, now())`,
      [
        dni,
        hashPassword(password),
        role,
        firstName,
        lastName,
        patientId,
        (body.phone ?? "").trim() || null,
      ],
    );

    return { snapshot: await buildSnapshot(client, user) };
  });

  if (outcome.error) return c.json({ error: outcome.error }, 400);
  return c.json({ snapshot: outcome.snapshot });
}

export async function handleSetActive(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);
  const body = await readJson<{ dni?: string; active?: boolean }>(c);
  if (body.dni === user.dni) {
    return c.json({ error: "No puedes desactivar tu propia cuenta" }, 400);
  }

  const outcome = await withTx<{ notFound?: boolean; snapshot?: Snapshot }>(async (client) => {
    const res = await client.query("UPDATE users SET active = $2 WHERE dni = $1", [
      body.dni ?? "",
      body.active === true,
    ]);
    if ((res.rowCount ?? 0) === 0) return { notFound: true };
    if (body.active !== true) {
      await client.query("DELETE FROM sessions WHERE dni = $1", [body.dni]);
    }
    return { snapshot: await buildSnapshot(client, user, { regenerate: false }) };
  });

  if (outcome.notFound) return c.json({ error: "Usuario no encontrado" }, 404);
  return c.json({ snapshot: outcome.snapshot });
}

/** Elimina un usuario o paciente definitivamente (admin o obstetra sobre sus gestantes). */
export async function handleDeleteUser(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin" && user.role !== "obstetra") {
    return c.json({ error: "Acción no permitida" }, 403);
  }
  const body = await readJson<{ dni?: string; patientId?: string }>(c);
  const dni = (body.dni ?? "").trim();
  const requestedPatientId = (body.patientId ?? "").trim();

  if (!dni && !requestedPatientId) {
    return c.json({ error: "DNI o identificador de paciente requerido" }, 400);
  }
  if (dni && dni === user.dni) {
    return c.json({ error: "No puedes eliminar tu propia cuenta" }, 400);
  }

  const outcome = await withTx<{
    status: number;
    error?: string;
    snapshot?: Snapshot;
  }>(async (client) => {
    const uRes = dni
      ? await client.query<UserRow>("SELECT * FROM users WHERE dni = $1", [dni])
      : { rows: [] as UserRow[] };
    const targetUser = uRes.rows[0] ? mapUser(uRes.rows[0]) : undefined;

    const pRes = await client.query<PatientRow>(
      "SELECT * FROM patients WHERE ($1 <> '' AND id = $1) OR ($2 <> '' AND dni = $2) OR ($3 <> '' AND id = $3)",
      [requestedPatientId, dni, targetUser?.patientId ?? ""],
    );
    const targetPatient = pRes.rows[0] ? mapPatient(pRes.rows[0]) : undefined;

    if (!targetUser && !targetPatient) {
      return { status: 404, error: "Usuario no encontrado" };
    }

    if (user.role === "obstetra") {
      if (targetUser && targetUser.role !== "gestante") {
        return { status: 403, error: "La obstetra solo puede dar de baja cuentas de gestantes" };
      }
      if (targetPatient && targetPatient.obstetraDni && targetPatient.obstetraDni !== user.dni) {
        return { status: 403, error: "Solo puedes eliminar gestantes asignadas a tu cargo" };
      }
    }

    if (targetUser?.role === "admin") {
      const adminCountRes = await client.query<{ c: string }>(
        "SELECT COUNT(*)::text AS c FROM users WHERE role = 'admin' AND active = TRUE AND dni <> $1",
        [targetUser.dni],
      );
      if (Number(adminCountRes.rows[0]?.c ?? 0) === 0) {
        return {
          status: 400,
          error: "No puedes eliminar la última cuenta de administración activa",
        };
      }
    }

    if (targetUser) {
      await client.query("DELETE FROM users WHERE dni = $1", [targetUser.dni]);
    }
    if (targetPatient) {
      await client.query("DELETE FROM users WHERE patient_id = $1 OR dni = $2", [
        targetPatient.id,
        targetPatient.dni,
      ]);
      await client.query("DELETE FROM patients WHERE id = $1", [targetPatient.id]);
    }
    if (targetUser?.role === "obstetra") {
      const fallbackRes = await client.query<{ dni: string }>(
        "SELECT dni FROM users WHERE role = 'obstetra' AND active = TRUE ORDER BY seq LIMIT 1",
      );
      const fallbackDni = fallbackRes.rows[0]?.dni ?? null;
      await client.query("UPDATE patients SET obstetra_dni = $2 WHERE obstetra_dni = $1", [
        targetUser.dni,
        fallbackDni,
      ]);
    }

    return { status: 200, snapshot: await buildSnapshot(client, user) };
  });

  if (outcome.error) {
    return c.json({ error: outcome.error }, outcome.status as 400 | 403 | 404);
  }
  return c.json({ snapshot: outcome.snapshot });
}

/**
 * Cambia mantenimiento, mensaje o entorno (solo admin). Pasar a producción
 * limpia los datos de demostración y conserva únicamente las cuentas de
 * administración; volver a demostración restaura el seed completo. El
 * cambio viaja en el snapshot y llega a todos los teléfonos en segundos.
 */
export async function handleAdminConfig(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);
  const body = await readJson<{
    maintenance?: boolean;
    maintenanceMessage?: string;
    environment?: AppEnvironment;
  }>(c);
  const nowISO = new Date().toISOString();

  const snapshot = await withTx(async (client) => {
    const { config } = await loadConfig(client);
    const wantsEnv =
      body.environment === "demo" || body.environment === "produccion" ? body.environment : null;

    if (wantsEnv && wantsEnv !== config.environment) {
      if (wantsEnv === "produccion") {
        const adminsRes = await client.query<UserRow>(
          "SELECT * FROM users WHERE role = 'admin' AND active = TRUE ORDER BY seq",
        );
        let keep = adminsRes.rows.map(mapUser);
        if (keep.length === 0) keep = [user];
        const keepDnis = keep.map((u) => u.dni);
        const sessions = await client.query<SessionRow>(
          "SELECT token, dni, at_iso FROM sessions WHERE dni = ANY($1::text[])",
          [keepDnis],
        );
        const avatars = await client.query<{ dni: string; mime: string; bytes: Buffer }>(
          "SELECT dni, mime, bytes FROM avatars WHERE dni = ANY($1::text[])",
          [keepDnis],
        );
        await wipeData(client);
        for (const keptUser of keep) await insertUserRecord(client, keptUser);
        for (const s of sessions.rows) {
          await client.query("INSERT INTO sessions (token, dni, at_iso) VALUES ($1, $2, $3)", [
            s.token,
            s.dni,
            s.at_iso,
          ]);
        }
        for (const a of avatars.rows) {
          await client.query("INSERT INTO avatars (dni, mime, bytes) VALUES ($1, $2, $3)", [
            a.dni,
            a.mime,
            a.bytes,
          ]);
        }
        const seedArticles = buildSeed().articles ?? [];
        for (const art of seedArticles) {
          await insertArticle(client, art);
        }
        await client.query("UPDATE app_config SET environment = 'produccion', updated_at = $1", [
          nowISO,
        ]);
        console.log("[server] Entorno cambiado a PRODUCCIÓN");
      } else {
        const sessions = await client.query<SessionRow>("SELECT token, dni, at_iso FROM sessions");
        const adminSelf: UserRecord = { ...user, avatarVersion: null };
        await wipeData(client);
        const seedState = buildSeed();
        await insertSeedState(client, seedState);
        if (!seedState.users.some((u) => u.dni === adminSelf.dni)) {
          await insertUserRecord(client, adminSelf, { resetAvatar: true });
        }
        const validDnis = new Set([...seedState.users.map((u) => u.dni), adminSelf.dni]);
        for (const s of sessions.rows) {
          if (!validDnis.has(s.dni)) continue;
          await client.query("INSERT INTO sessions (token, dni, at_iso) VALUES ($1, $2, $3)", [
            s.token,
            s.dni,
            s.at_iso,
          ]);
        }
        await client.query(
          "UPDATE app_config SET environment = 'demo', seed_version = $2, updated_at = $1",
          [nowISO, SEED_VERSION],
        );
        console.log("[server] Entorno cambiado a DEMOSTRACIÓN");
      }
    }

    if (body.maintenance !== undefined) {
      await client.query("UPDATE app_config SET maintenance = $1", [body.maintenance === true]);
    }
    if (typeof body.maintenanceMessage === "string") {
      const msg = body.maintenanceMessage.trim().slice(0, 240);
      await client.query("UPDATE app_config SET maintenance_message = $1", [
        msg.length > 0 ? msg : DEFAULT_MAINTENANCE_MESSAGE,
      ]);
    }
    await client.query("UPDATE app_config SET updated_at = $1", [nowISO]);

    return buildSnapshot(client, user);
  });

  return c.json({ snapshot });
}

export async function handleReset(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);

  const snapshot = await withTx(async (client) => {
    const { config } = await loadConfig(client);
    const sessions = await client.query<SessionRow>("SELECT token, dni, at_iso FROM sessions");
    const adminSelf: UserRecord = { ...user, avatarVersion: null };

    await wipeData(client);
    const seedState = buildSeed();
    await insertSeedState(client, seedState);
    if (!seedState.users.some((u) => u.dni === adminSelf.dni)) {
      await insertUserRecord(client, adminSelf, { resetAvatar: true });
    }
    const validDnis = new Set([...seedState.users.map((u) => u.dni), adminSelf.dni]);
    for (const s of sessions.rows) {
      if (!validDnis.has(s.dni)) continue;
      await client.query("INSERT INTO sessions (token, dni, at_iso) VALUES ($1, $2, $3)", [
        s.token,
        s.dni,
        s.at_iso,
      ]);
    }
    // Se conserva el mantenimiento actual; el entorno vuelve a demostración.
    await client.query(
      `UPDATE app_config
          SET environment = 'demo', seed_version = $1, maintenance = $2,
              maintenance_message = $3, updated_at = $4`,
      [SEED_VERSION, config.maintenance, config.maintenanceMessage, new Date().toISOString()],
    );

    return buildSnapshot(client, user);
  });

  console.log("[server] Datos de demostración restaurados");
  return c.json({ snapshot });
}

export const handleAdminReset = handleReset;

// ---------- Configuración de WhatsApp (Open-WA) ----------

/**
 * Actualiza la configuración global de WhatsApp (solo admin).
 */
export async function handleAdminWhatsAppConfig(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);
  const body = await readJson<Partial<WhatsAppConfig>>(c);

  const snapshot = await withTx(async (client) => {
    const current = await loadWhatsAppConfig(client);
    const updated: WhatsAppConfig = {
      enabled: typeof body.enabled === "boolean" ? body.enabled : current.enabled,
      serverUrl: typeof body.serverUrl === "string" ? body.serverUrl.trim() : current.serverUrl,
      apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : current.apiKey,
      sessionId: typeof body.sessionId === "string" ? body.sessionId.trim() : current.sessionId,
      notifyAppointments:
        typeof body.notifyAppointments === "boolean"
          ? body.notifyAppointments
          : current.notifyAppointments,
      notifySupplements:
        typeof body.notifySupplements === "boolean"
          ? body.notifySupplements
          : current.notifySupplements,
      remindAppointments:
        typeof body.remindAppointments === "boolean"
          ? body.remindAppointments
          : current.remindAppointments,
      remindSupplements:
        typeof body.remindSupplements === "boolean"
          ? body.remindSupplements
          : current.remindSupplements,
      chatOfflineFallback:
        typeof body.chatOfflineFallback === "boolean"
          ? body.chatOfflineFallback
          : current.chatOfflineFallback,
      sosOfflineAlerts:
        typeof body.sosOfflineAlerts === "boolean"
          ? body.sosOfflineAlerts
          : current.sosOfflineAlerts,
      updatedAtISO: new Date().toISOString(),
    };

    await client.query(
      `INSERT INTO whatsapp_config (
         id, enabled, server_url, api_key, session_id,
         notify_appointments, notify_supplements, remind_appointments,
         remind_supplements, chat_offline_fallback, sos_offline_alerts, updated_at
       ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         server_url = EXCLUDED.server_url,
         api_key = EXCLUDED.api_key,
         session_id = EXCLUDED.session_id,
         notify_appointments = EXCLUDED.notify_appointments,
         notify_supplements = EXCLUDED.notify_supplements,
         remind_appointments = EXCLUDED.remind_appointments,
         remind_supplements = EXCLUDED.remind_supplements,
         chat_offline_fallback = EXCLUDED.chat_offline_fallback,
         sos_offline_alerts = EXCLUDED.sos_offline_alerts,
         updated_at = EXCLUDED.updated_at`,
      [
        updated.enabled,
        updated.serverUrl,
        updated.apiKey,
        updated.sessionId,
        updated.notifyAppointments,
        updated.notifySupplements,
        updated.remindAppointments,
        updated.remindSupplements,
        updated.chatOfflineFallback,
        updated.sosOfflineAlerts,
        updated.updatedAtISO,
      ],
    );

    return buildSnapshot(client, user, { regenerate: false });
  });

  return c.json({ snapshot });
}

/**
 * Diagnóstico: Prueba la conexión con el servidor Open-WA (solo admin).
 */
export async function handleAdminWhatsAppTestConnection(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);
  const body = await readJson<Partial<WhatsAppConfig>>(c);

  const current = await loadWhatsAppConfig(pool);
  const testCfg: WhatsAppConfig = {
    ...current,
    serverUrl: body.serverUrl?.trim() || current.serverUrl,
    apiKey: body.apiKey?.trim() || current.apiKey,
    sessionId: body.sessionId?.trim() || current.sessionId,
  };

  if (
    testCfg.serverUrl !== current.serverUrl ||
    testCfg.apiKey !== current.apiKey ||
    testCfg.sessionId !== current.sessionId
  ) {
    await pool.query(
      `UPDATE whatsapp_config
          SET server_url = $1, api_key = $2, session_id = $3, updated_at = $4
        WHERE id = 1`,
      [testCfg.serverUrl, testCfg.apiKey, testCfg.sessionId, new Date().toISOString()],
    );
  }

  const status = await testWhatsAppConnection(testCfg);
  return c.json(status);
}

/**
 * Envía un mensaje de prueba a un número telefónico (solo admin).
 */
export async function handleAdminWhatsAppSendTest(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);
  const body = await readJson<{
    phone?: string;
    message?: string;
    serverUrl?: string;
    apiKey?: string;
    sessionId?: string;
  }>(c);

  const phone = (body.phone ?? "").trim();
  if (!phone) {
    return c.json({ error: "Ingresa un número de celular de prueba" }, 400);
  }

  const storedConfig = await loadWhatsAppConfig(pool);
  const config: WhatsAppConfig = {
    ...storedConfig,
    serverUrl: body.serverUrl?.trim() || storedConfig.serverUrl || "https://openwa.qware.me",
    apiKey: body.apiKey?.trim() || storedConfig.apiKey || "vitmaterna-openwa-key",
    sessionId: body.sessionId?.trim() || storedConfig.sessionId || "vitmaterna",
  };
  if (!config.serverUrl || !config.apiKey) {
    return c.json(
      { error: "Primero debes configurar la URL del servidor y la API Key de Open-WA" },
      400,
    );
  }

  if (
    config.serverUrl !== storedConfig.serverUrl ||
    config.apiKey !== storedConfig.apiKey ||
    config.sessionId !== storedConfig.sessionId
  ) {
    await pool.query(
      `UPDATE whatsapp_config
          SET server_url = $1, api_key = $2, session_id = $3, updated_at = $4
        WHERE id = 1`,
      [config.serverUrl, config.apiKey, config.sessionId, new Date().toISOString()],
    );
  }

  const customText = body.message?.trim();
  const message =
    customText ||
    templateTestMessage({
      adminName: `${user.firstName} ${user.lastName}`.trim(),
      timestamp: new Date().toLocaleString("es-PE", { timeZone: "America/Lima" }),
    });

  // Forzamos enabled = true para la prueba explícita
  const res = await sendWhatsAppText({ ...config, enabled: true }, phone, message);
  await logWhatsAppDelivery(
    pool,
    phone,
    "mensaje_prueba_admin",
    res.ok ? "sent" : res.skipped ? "skipped" : "failed",
    res.error,
  );

  if (!res.ok) {
    return c.json(
      { error: res.error || "No se pudo entregar el mensaje de prueba a WhatsApp" },
      500,
    );
  }

  return c.json({ ok: true, message: "Mensaje de prueba enviado con éxito" });
}

/**
 * Registra o actualiza el Push Token (Expo/FCM) del usuario conectado.
 */
export async function handleRegisterPushToken(c: AppContext): Promise<Response> {
  const user = c.get("user");
  const body = await readJson<{ pushToken?: string; platform?: string }>(c);
  const token = (body.pushToken ?? "").trim();
  const platform = (body.platform ?? "android").toLowerCase().trim();

  if (!token) {
    return c.json({ error: "Push token requerido" }, 400);
  }

  // Eliminar el token de cualquier otro DNI previo en este mismo dispositivo
  await pool.query("DELETE FROM push_tokens WHERE token = $1 AND dni <> $2", [token, user.dni]);

  await pool.query(
    `INSERT INTO push_tokens (dni, token, platform, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (dni, token) DO UPDATE SET updated_at = EXCLUDED.updated_at, platform = EXCLUDED.platform`,
    [user.dni, token, platform],
  );

  console.log(`[Push] Token registrado para DNI ${user.dni} (${user.firstName} - ${platform}): ${token}`);
  return c.json({ ok: true });
}

/**
 * Elimina un Push Token cuando el usuario cierra sesión.
 */
export async function handleDeletePushToken(c: AppContext): Promise<Response> {
  const user = c.get("user");
  const body = await readJson<{ pushToken?: string }>(c);
  const token = (body.pushToken ?? "").trim();

  if (token) {
    await pool.query("DELETE FROM push_tokens WHERE dni = $1 AND token = $2", [user.dni, token]);
  } else {
    await pool.query("DELETE FROM push_tokens WHERE dni = $1", [user.dni]);
  }

  return c.json({ ok: true });
}

// ---------- Educación y Artículos ----------

/** Crea o actualiza un artículo educativo (admin u obstetra), con asignación directa opcional a gestante. */
export async function handleAdminSaveArticle(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin" && user.role !== "obstetra") {
    return c.json({ error: "Acción no permitida" }, 403);
  }

  const body = await readJson<{
    id?: string;
    category?: string;
    title?: string;
    summary?: string;
    body?: string[];
    indicaciones?: string | null;
    patientId?: string;
    minutes?: number;
    active?: boolean;
    mediaType?: "lectura" | "texto" | "video" | "imagen" | "pdf";
    mediaUrl?: string | null;
    imageUrl?: string | null;
    links?: ArticleLink[];
  }>(c);

  const title = (body.title ?? "").trim();
  if (!title) return c.json({ error: "El título es obligatorio" }, 400);

  const mediaType: "lectura" | "video" | "imagen" | "pdf" =
    body.mediaType === "video" || body.mediaType === "imagen" || body.mediaType === "pdf"
      ? body.mediaType
      : "lectura";

  const indicaciones = body.indicaciones ? body.indicaciones.trim() : null;
  const rawMediaUrl = body.mediaUrl ? body.mediaUrl.trim() : null;
  const rawImageUrl = body.imageUrl ? body.imageUrl.trim() : null;
  const imageUrl = rawImageUrl || (mediaType === "imagen" ? rawMediaUrl : null);
  const mediaUrl = rawMediaUrl || (mediaType === "imagen" ? imageUrl : null);

  if (mediaType === "imagen" && !imageUrl && !mediaUrl) {
    return c.json({ error: "Sube un archivo de imagen para este contenido" }, 400);
  }
  if (mediaType === "pdf" && !mediaUrl) {
    return c.json({ error: "Sube un archivo PDF para este contenido" }, 400);
  }
  if (mediaType === "video" && !mediaUrl) {
    return c.json({ error: "Ingresa la URL del video" }, 400);
  }

  const rawBody = Array.isArray(body.body)
    ? body.body.map((p) => p.trim()).filter((p) => p.length > 0)
    : [];

  if (mediaType === "lectura" && rawBody.length === 0) {
    return c.json({ error: "Redacta el mensaje o lectura del contenido" }, 400);
  }

  const defaultSummary =
    mediaType === "imagen"
      ? "Imagen educativa asignada por tu obstetra."
      : mediaType === "pdf"
        ? "Documento PDF educativo asignado por tu obstetra."
        : mediaType === "video"
          ? "Video educativo recomendado por tu obstetra."
          : rawBody[0]?.slice(0, 180) || "Lectura educativa prenatal.";

  const summary = (body.summary ?? "").trim() || indicaciones || defaultSummary;
  const articleBody =
    rawBody.length > 0 ? rawBody : [indicaciones || summary];
  const category = (body.category ?? "").trim() || "Cuidado general";
  const minutes = Math.max(1, Math.min(60, Math.round(body.minutes ?? 3)));
  const active = body.active !== false;
  const links = Array.isArray(body.links)
    ? body.links
        .map((l) => ({
          label: (l.label ?? "").trim(),
          url: (l.url ?? "").trim(),
          ...(l.kind ? { kind: l.kind } : {}),
        }))
        .filter((l) => l.label.length > 0 && l.url.length > 0)
    : [];

  const id = body.id?.trim() || `art-${crypto.randomUUID().slice(0, 8)}`;
  const targetPatientId = (body.patientId ?? "").trim();

  const snapshot = await withTx(async (client) => {
    const article: Article = {
      id,
      category,
      title,
      summary,
      body: articleBody,
      indicaciones,
      minutes,
      active,
      mediaType,
      mediaUrl,
      imageUrl,
      links,
      createdAtISO: new Date().toISOString(),
      updatedAtISO: new Date().toISOString(),
    };
    await insertArticle(client, article);
    if (targetPatientId) {
      await client.query(
        `INSERT INTO article_assignments (patient_id, article_id, assigned_by_dni, assigned_at_iso)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (patient_id, article_id) DO NOTHING`,
        [targetPatientId, id, user.dni],
      );
    }
    return buildSnapshot(client, user, { regenerate: false });
  });

  return c.json({ snapshot });
}

/** Deshabilita o habilita un artículo educativo (solo admin). */
export async function handleAdminToggleArticleActive(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);

  const body = await readJson<{ id?: string; active?: boolean }>(c);
  const id = (body.id ?? "").trim();
  if (!id) return c.json({ error: "ID de artículo requerido" }, 400);

  const snapshot = await withTx(async (client) => {
    await client.query(
      "UPDATE articles SET active = $2, updated_at_iso = now() WHERE id = $1",
      [id, body.active === true],
    );
    return buildSnapshot(client, user, { regenerate: false });
  });

  return c.json({ snapshot });
}

/** Elimina un artículo educativo (solo admin). */
export async function handleAdminDeleteArticle(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "admin") return c.json({ error: "Acción no permitida" }, 403);

  const body = await readJson<{ id?: string }>(c);
  const id = (body.id ?? "").trim();
  if (!id) return c.json({ error: "ID de artículo requerido" }, 400);

  const snapshot = await withTx(async (client) => {
    await client.query("DELETE FROM articles WHERE id = $1", [id]);
    return buildSnapshot(client, user, { regenerate: false });
  });

  return c.json({ snapshot });
}

/** Asigna o desasigna un artículo educativo a una o varias gestantes (obstetra / admin). */
export async function handleObstetraAssignArticle(c: AppContext): Promise<Response> {
  const user = c.get("user");
  if (user.role !== "obstetra" && user.role !== "admin") {
    return c.json({ error: "Acción no permitida" }, 403);
  }

  const body = await readJson<{
    patientId?: string;
    patientIds?: string[];
    articleId?: string;
    assigned?: boolean;
  }>(c);

  const articleId = (body.articleId ?? "").trim();
  if (!articleId) return c.json({ error: "ID de artículo requerido" }, 400);

  const patientIds: string[] = [];
  if (body.patientId) patientIds.push(body.patientId.trim());
  if (Array.isArray(body.patientIds)) {
    for (const pid of body.patientIds) {
      const clean = (pid ?? "").trim();
      if (clean && !patientIds.includes(clean)) patientIds.push(clean);
    }
  }

  if (patientIds.length === 0) {
    return c.json({ error: "Selecciona al menos una paciente" }, 400);
  }

  const assigned = body.assigned !== false;

  const snapshot = await withTx(async (client) => {
    for (const pid of patientIds) {
      if (assigned) {
        await client.query(
          `INSERT INTO article_assignments (patient_id, article_id, assigned_by_dni, assigned_at_iso)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (patient_id, article_id) DO NOTHING`,
          [pid, articleId, user.dni],
        );
      } else {
        await client.query(
          "DELETE FROM article_assignments WHERE patient_id = $1 AND article_id = $2",
          [pid, articleId],
        );
      }
    }
    return buildSnapshot(client, user, { regenerate: false });
  });

  return c.json({ snapshot });
}
