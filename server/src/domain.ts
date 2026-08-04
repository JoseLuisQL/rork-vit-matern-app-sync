/**
 * VITMATERNA — Dominio clínico del servidor (idéntico al backend en la nube).
 * Calcula la ficha de cada gestante, arma el snapshot por rol, construye los
 * reportes MINSA y regenera las alertas tempranas automáticas persistiéndolas
 * en PostgreSQL solo cuando algo cambió.
 */
import {
  addDaysToKey,
  ALTITUDE_MSNM,
  anemiaClass,
  assessRisk,
  correctedHb,
  fppKeyFromFum,
  gestationalDays,
  gestationalWeeks,
  HB_CORRECTION_FACTOR,
  peruDayKey,
  trimester,
} from "./clinical";
import type { Queryable } from "./db";
import { HEALTH_CENTER } from "./seed";
import type {
  Alert,
  AlertType,
  AnemiaClass,
  AppData,
  Appointment,
  CommunityReport,
  PatientView,
  Patient,
  PresenceView,
  PublicUser,
  ReportBlock,
  RiskLevel,
  Snapshot,
  Supplement,
  SupplementFields,
  UserRecord,
  WeeklyAttendance,
} from "./types";

export const ACTIVE_APPT_STATES = [
  "programada",
  "confirmada",
  "solicitud_reprogramacion",
] as const;

export function isActiveState(estado: Appointment["estado"]): boolean {
  return (ACTIVE_APPT_STATES as readonly string[]).includes(estado);
}

/** Usuario visible por el cliente (sin hash; opcionales omitidos si no aplican). */
export function publicUser(u: UserRecord): PublicUser {
  return {
    dni: u.dni,
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    active: u.active,
    ...(u.patientId ? { patientId: u.patientId } : {}),
    ...(u.phone ? { phone: u.phone } : {}),
    createdAtISO: u.createdAtISO,
    ...(u.avatarVersion ? { avatarVersion: u.avatarVersion } : {}),
  };
}

/** Tomas por día de un medicamento (1–6; registros antiguos valen 1). */
export function timesPerDayOf(s: Supplement): number {
  return Math.max(1, Math.min(6, Math.round(s.timesPerDay ?? 1)));
}

/** El medicamento solo se espera desde el día en que fue asignado. */
export function isSupplementActiveOn(s: Supplement, dayKey: string): boolean {
  return !s.startKey || s.startKey <= dayKey;
}

/** Cuántas tomas de un medicamento hay registradas en un día. */
export function countDoses(dayLogs: string[] | undefined, supplementId: string): number {
  if (!dayLogs) return 0;
  let n = 0;
  for (const id of dayLogs) if (id === supplementId) n += 1;
  return n;
}

/** Normaliza los campos de un medicamento; null si el nombre está vacío. */
export function sanitizeSupplementFields(
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

// ---------- Cálculos clínicos por paciente ----------

export function computePatient(p: Patient, data: AppData, todayKey: string): PatientView {
  const weeks = gestationalWeeks(p.fumKey, todayKey);
  const risk = assessRisk(p);
  const hb = correctedHb(p.hbObserved);
  const mySupplements = data.supplements.filter((s) => s.patientId === p.id);
  const myLogs = data.intakes[p.id];

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

  const upcoming = data.appointments
    .filter((a) => a.patientId === p.id && a.dateKey >= todayKey && isActiveState(a.estado))
    .sort((a, b) =>
      a.dateKey === b.dateKey ? a.time.localeCompare(b.time) : a.dateKey.localeCompare(b.dateKey),
    );

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

export function snapshotFor(
  user: UserRecord,
  data: AppData,
  presenceViews: Record<string, PresenceView>,
): Snapshot {
  const todayKey = peruDayKey();
  const isGestante = user.role === "gestante";
  const pid = user.patientId;

  const avatarByDni = new Map<string, number | null>(
    data.users.map((u) => [u.dni, u.avatarVersion]),
  );
  const patients = data.patients
    .filter((p) => (isGestante ? p.id === pid : true))
    .map((p) => {
      const view = computePatient(p, data, todayKey);
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
    appointments: scopeById(data.appointments),
    supplements: scopeById(data.supplements),
    intakes: isGestante && pid ? { [pid]: data.intakes[pid] ?? {} } : data.intakes,
    messages: isGestante ? data.messages.filter((m) => m.convId === pid) : data.messages,
    alerts: scopeById(data.alerts),
    visits: scopeById(data.visits),
    presence: presenceViews,
    config: data.config,
  };

  if (user.role === "admin") {
    snapshot.users = data.users.map(publicUser);
    snapshot.reports = {
      d30: buildReport(data, todayKey, 30),
      total: buildReport(data, todayKey, 100000),
    };
  }
  return snapshot;
}

// ---------- Reportes MINSA ----------

export function buildReport(data: AppData, todayKey: string, periodDays: number): ReportBlock {
  const fromKey = addDaysToKey(todayKey, -periodDays);
  const views = data.patients.map((p) => computePatient(p, data, todayKey));

  const riesgo: Record<RiskLevel, number> = { verde: 0, amarillo: 0, rojo: 0 };
  const anemia: Record<AnemiaClass, number> = { normal: 0, leve: 0, moderada: 0, severa: 0 };
  views.forEach((v) => {
    riesgo[v.riskLevel] += 1;
    anemia[v.anemia] += 1;
  });

  const dueControls = data.appointments.filter(
    (a) => a.control !== null && a.dateKey < todayKey && a.dateKey >= fromKey,
  );
  const asistidos = dueControls.filter((a) => a.estado === "asistida").length;

  const pastAppointments = data.appointments.filter(
    (a) => a.dateKey < todayKey && a.dateKey >= fromKey,
  );
  const asistidas = pastAppointments.filter((a) => a.estado === "asistida").length;
  const noAsistidas = pastAppointments.filter((a) => a.estado !== "asistida").length;

  const periodAlerts = data.alerts.filter((a) => a.atISO.slice(0, 10) >= fromKey);
  const atendidas = periodAlerts.filter((a) => a.status === "atendida").length;

  const adherencias = views.map((v) => v.adherence30);
  const adherenciaPromedio =
    adherencias.length > 0
      ? Math.round(adherencias.reduce((a, b) => a + b, 0) / adherencias.length)
      : 0;
  const cobertura =
    views.length > 0
      ? Math.round((views.filter((v) => v.adherence30 >= 75).length / views.length) * 100)
      : 0;

  const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

  // Visitas domiciliarias del periodo.
  const periodVisits = data.visits.filter((v) => v.dateKey >= fromKey);
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
    const inBlock = data.appointments.filter((a) => a.dateKey >= startKey && a.dateKey <= endKey);
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
    controlesOportunos: {
      asistidos,
      esperados: dueControls.length,
      pct: pct(asistidos, dueControls.length),
    },
    adherenciaPromedio,
    coberturaSuplementacion: cobertura,
    asistencia: { asistidas, noAsistidas, pct: pct(asistidas, pastAppointments.length) },
    alertas: {
      total: periodAlerts.length,
      atendidas,
      abiertas: periodAlerts.filter((a) => a.status === "abierta").length,
      pct: pct(atendidas, periodAlerts.length),
    },
    citasHoy: data.appointments.filter((a) => a.dateKey === todayKey && isActiveState(a.estado))
      .length,
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

// ---------- Alertas tempranas automáticas ----------

const DERIVED_TYPES: AlertType[] = ["inasistencia", "adherencia", "anemia", "sin_control"];

/**
 * Recalcula las alertas derivadas (inasistencia, adherencia, anemia, sin
 * control), conservando las atendidas y la fecha original de las que siguen
 * vigentes. Persiste en la base únicamente las diferencias y actualiza
 * `data.alerts` para que el snapshot refleje el resultado sin recargar.
 */
export async function regenerateAutoAlerts(client: Queryable, data: AppData): Promise<void> {
  const todayKey = peruDayKey();
  const nowISO = new Date().toISOString();
  const previous = new Map(
    data.alerts.filter((a) => DERIVED_TYPES.includes(a.type)).map((a) => [a.id, a]),
  );
  const kept = data.alerts.filter((a) => !DERIVED_TYPES.includes(a.type) || a.status === "atendida");
  const attendedIds = new Set(kept.map((a) => a.id));
  const fresh: Alert[] = [];

  const push = (alert: Omit<Alert, "atISO" | "status">) => {
    if (attendedIds.has(alert.id)) return;
    const prev = previous.get(alert.id);
    fresh.push({ ...alert, atISO: prev?.atISO ?? nowISO, status: "abierta" });
  };

  data.appointments.forEach((a) => {
    if (a.estado !== "no_asistida") return;
    const p = data.patients.find((x) => x.id === a.patientId);
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

  data.patients.forEach((p) => {
    const view = computePatient(p, data, todayKey);

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

    const overdue = data.appointments.find(
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

  // Diferencias contra lo que hay abierto en la base (evita escrituras inútiles).
  const openById = new Map(
    data.alerts
      .filter((a) => DERIVED_TYPES.includes(a.type) && a.status === "abierta")
      .map((a) => [a.id, a]),
  );
  const freshIds = new Set(fresh.map((a) => a.id));
  const toDelete = [...openById.keys()].filter((id) => !freshIds.has(id));
  const toUpsert = fresh.filter((a) => {
    const prev = openById.get(a.id);
    return !prev || prev.title !== a.title || prev.detail !== a.detail || prev.atISO !== a.atISO;
  });

  if (toDelete.length > 0) {
    await client.query("DELETE FROM alerts WHERE id = ANY($1::text[])", [toDelete]);
  }
  for (const a of toUpsert) {
    await client.query(
      `INSERT INTO alerts (id, type, patient_id, at_iso, title, detail, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'abierta')
       ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title, detail = EXCLUDED.detail, at_iso = EXCLUDED.at_iso
         WHERE alerts.status = 'abierta'`,
      [a.id, a.type, a.patientId, a.atISO, a.title, a.detail],
    );
  }

  data.alerts = [...kept, ...fresh];
}
