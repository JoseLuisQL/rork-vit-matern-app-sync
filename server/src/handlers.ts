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
import { presence } from "./presence";
import type { PresenceInput } from "./presence";
import { loadAppData, loadConfig, mapUser } from "./rows";
import type { SessionRow, UserRow } from "./rows";
import {
  buildSeed,
  DEFAULT_MAINTENANCE_MESSAGE,
  DEMO_DNIS,
  HEALTH_CENTER,
  hashPassword,
  insertAppointment,
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
  ClientAction,
  DemoAccount,
  Patient,
  Snapshot,
  SystemConfig,
  UserRecord,
} from "./types";

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
  }>(c);
  const todayKey = peruDayKey();
  const dateKey = body.dateKey ?? "";
  const time = body.time ?? "";

  if (!isValidDayKey(dateKey)) return c.json({ error: "Fecha no válida" }, 400);
  if (dateKey < todayKey) {
    return c.json({ error: "La fecha ya pasó. Elige un día desde hoy." }, 400);
  }
  if (!AGENDA_SLOTS.includes(time)) {
    return c.json({ error: "Horario fuera de la agenda (08:00–16:30)" }, 400);
  }

  const outcome = await withTx<ScheduleOutcome>(async (client) => {
    const conflict = async (ignoreId?: string | null): Promise<ScheduleOutcome> => ({
      kind: "conflict",
      freeSlots: await freeSlotsFor(client, dateKey, ignoreId),
    });

    if (body.mode === "reprogramar") {
      const apptId = body.appointmentId ?? "";
      const res = await client.query("SELECT 1 FROM appointments WHERE id = $1", [apptId]);
      if ((res.rowCount ?? 0) === 0) return { kind: "notFound", error: "La cita ya no existe" };
      if ((await takenSlots(client, dateKey, apptId)).has(time)) return conflict(apptId);
      await client.query(
        "UPDATE appointments SET date_key = $2, time = $3, estado = 'programada' WHERE id = $1",
        [apptId, dateKey, time],
      );
    } else if (body.mode === "cita") {
      const res = await client.query<{ fum_key: string }>(
        "SELECT fum_key FROM patients WHERE id = $1",
        [body.patientId ?? ""],
      );
      if ((res.rowCount ?? 0) === 0) return { kind: "notFound", error: "Paciente no encontrada" };
      if ((await takenSlots(client, dateKey)).has(time)) return conflict();

      const patientFum = res.rows[0]?.fum_key;
      let controlNum: number | null = null;
      if (body.motivo) {
        const match = body.motivo.match(/control\s*(?:prenatal\s*)?([1-8])/i);
        if (match && match[1]) {
          controlNum = parseInt(match[1], 10);
        }
      }
      const week =
        controlNum !== null && patientFum ? gestationalWeeks(patientFum, dateKey) : null;

      await insertAppointment(client, {
        id: `ap-${crypto.randomUUID().slice(0, 8)}`,
        patientId: body.patientId as string,
        control: controlNum,
        week,
        dateKey,
        time,
        motivo: (body.motivo ?? (controlNum ? `Control prenatal ${controlNum} de 8` : "Consulta adicional")).trim() || "Consulta adicional",
        estado: "programada",
        lugar: HEALTH_CENTER,
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

/** Sirve la foto de perfil como imagen (pública, cacheable por versión). */
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
      "Cache-Control": "public, max-age=31536000, immutable",
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
      return buildSnapshot(client, user, { regenerate: false });
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
    await client.query(
      "UPDATE users SET avatar_version = COALESCE(avatar_version, 0) + 1 WHERE dni = $1",
      [user.dni],
    );
    return buildSnapshot(client, user, { regenerate: false });
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
      const patient: Patient = {
        id: patientId,
        dni,
        firstName,
        lastName,
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
        imc: Math.max(12, Math.min(60, Math.round((p.imc ?? 24) * 10) / 10)),
        adherenceBase: 0,
      };
      await insertPatient(client, patient);

      // Cronograma MINSA generado automáticamente solo si el usuario obstetra tiene habilitada la opción.
      const shouldAutoAssign = user.autoControls !== false;
      if (shouldAutoAssign) {
        for (const [i, week] of MINSA_WEEKS.entries()) {
          const dateKey = addDaysToKey(fumKey, week * 7);
          if (dateKey < todayKey) continue;
          const preferred = ["09:00", "10:30", "11:30", "15:00"][i % 4] ?? "09:00";
          const free = await freeSlotsFor(client, dateKey);
          const time = free.includes(preferred) ? preferred : free[0] ?? preferred;
          const appointment: Appointment = {
            id: `${patientId}-c${i + 1}`,
            patientId,
            control: i + 1,
            week,
            dateKey,
            time,
            motivo: `Control prenatal ${i + 1} de 8`,
            estado: "programada",
            lugar: HEALTH_CENTER,
          };
          await insertAppointment(client, appointment);
        }
      }
    }

    await client.query(
      `INSERT INTO users (dni, password_hash, role, first_name, last_name, active, patient_id, phone, auto_controls, created_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, TRUE, now())`,
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
