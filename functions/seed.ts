/**
 * VITMATERNA — Datos de demostración del servidor.
 * Todo se genera RELATIVO al día actual de Perú para que semanas,
 * controles, agenda y alertas siempre sean coherentes al probar.
 */
import {
  addDaysToKey,
  MINSA_WEEKS,
  peruDayKey,
} from "./clinical";
import type {
  Appointment,
  DBState,
  Message,
  Patient,
  StoredUser,
  Supplement,
  Visit,
} from "./types";

export const HEALTH_CENTER = "C.S. Talavera";
export const SEED_VERSION = 3;

function nowISO(minusMinutes = 0): string {
  return new Date(Date.now() - minusMinutes * 60000).toISOString();
}

function buildUsers(): StoredUser[] {
  const createdAtISO = nowISO(60 * 24 * 30);
  return [
    {
      dni: "22222222",
      password: "Test@1234",
      role: "admin",
      firstName: "Patricia",
      lastName: "Salas Vega",
      active: true,
      phone: "983 111 222",
      createdAtISO,
    },
    {
      dni: "11111111",
      password: "Test@1234",
      role: "obstetra",
      firstName: "Carmen",
      lastName: "Rojas Paredes",
      active: true,
      phone: "983 222 333",
      createdAtISO,
    },
    {
      dni: "33333333",
      password: "Test@1234",
      role: "gestante",
      firstName: "Ana",
      lastName: "Quispe Mamani",
      active: true,
      patientId: "p-ana",
      phone: "951 234 567",
      createdAtISO,
    },
    {
      dni: "44444444",
      password: "Test@1234",
      role: "gestante",
      firstName: "Lucía",
      lastName: "Huamán Ccorimanya",
      active: true,
      patientId: "p-lucia",
      phone: "952 345 678",
      createdAtISO,
    },
  ];
}

/** FUM = hoy − (semanas·7 + días). */
function fumFor(todayKey: string, weeks: number, extraDays = 0): string {
  return addDaysToKey(todayKey, -(weeks * 7 + extraDays));
}

function buildPatients(todayKey: string): Patient[] {
  return [
    {
      id: "p-ana",
      dni: "33333333",
      firstName: "Ana",
      lastName: "Quispe Mamani",
      age: 28,
      community: "Talavera",
      phone: "951 234 567",
      fumKey: fumFor(todayKey, 26, 3),
      gestas: 2,
      cesareas: 0,
      abortos: 0,
      obitoFetal: false,
      rhSensibilizado: false,
      antecedentes: [],
      hbObserved: 13.2,
      bpSys: 110,
      bpDia: 70,
      imc: 24.1,
      adherenceBase: 90,
    },
    {
      id: "p-lucia",
      dni: "44444444",
      firstName: "Lucía",
      lastName: "Huamán Ccorimanya",
      age: 39,
      community: "Santa Rosa",
      phone: "952 345 678",
      fumKey: fumFor(todayKey, 33, 1),
      gestas: 4,
      cesareas: 1,
      abortos: 1,
      obitoFetal: false,
      rhSensibilizado: false,
      antecedentes: ["Preeclampsia previa"],
      hbObserved: 11.5,
      bpSys: 145,
      bpDia: 95,
      imc: 27.8,
      adherenceBase: 60,
    },
    {
      id: "p-maria",
      dni: "55555511",
      firstName: "María",
      lastName: "Condori Flores",
      age: 17,
      community: "Ccoyahuacho",
      phone: "953 456 789",
      fumKey: fumFor(todayKey, 12, 0),
      gestas: 1,
      cesareas: 0,
      abortos: 0,
      obitoFetal: false,
      rhSensibilizado: false,
      antecedentes: [],
      hbObserved: 12.4,
      bpSys: 105,
      bpDia: 65,
      imc: 21.5,
      adherenceBase: 75,
    },
    {
      id: "p-rosa",
      dni: "55555522",
      firstName: "Rosa",
      lastName: "Ccahuana Torres",
      age: 31,
      community: "Talavera",
      phone: "954 567 890",
      fumKey: fumFor(todayKey, 20, 4),
      gestas: 3,
      cesareas: 0,
      abortos: 0,
      obitoFetal: false,
      rhSensibilizado: false,
      antecedentes: [],
      hbObserved: 13.6,
      bpSys: 115,
      bpDia: 75,
      imc: 25.3,
      adherenceBase: 88,
    },
    {
      id: "p-yolanda",
      dni: "55555533",
      firstName: "Yolanda",
      lastName: "Mamani Puma",
      age: 42,
      community: "San Juan",
      phone: "955 678 901",
      fumKey: fumFor(todayKey, 36, 2),
      gestas: 6,
      cesareas: 2,
      abortos: 0,
      obitoFetal: false,
      rhSensibilizado: false,
      antecedentes: [],
      hbObserved: 12.9,
      bpSys: 125,
      bpDia: 80,
      imc: 28.4,
      adherenceBase: 42,
    },
    {
      id: "p-silvia",
      dni: "55555544",
      firstName: "Silvia",
      lastName: "Pachari Nina",
      age: 24,
      community: "Talavera",
      phone: "956 789 012",
      fumKey: fumFor(todayKey, 8, 5),
      gestas: 1,
      cesareas: 0,
      abortos: 0,
      obitoFetal: false,
      rhSensibilizado: false,
      antecedentes: [],
      hbObserved: 13.9,
      bpSys: 108,
      bpDia: 68,
      imc: 22.7,
      adherenceBase: 95,
    },
  ];
}

const CONTROL_TIMES = ["09:00", "10:30", "11:30", "15:00"] as const;

function buildAppointments(patients: Patient[], todayKey: string): Appointment[] {
  const out: Appointment[] = [];

  /** Demo: próximo control de María HOY; Ana en 6 días; Lucía en 2 (prioridad por riesgo). */
  const forceNextToToday: Record<string, string> = { "p-maria": "09:00" };
  const nextOffsets: Record<string, { days: number; time: string }> = {
    "p-ana": { days: 6, time: "09:30" },
    "p-lucia": { days: 2, time: "10:30" },
  };

  patients.forEach((p) => {
    let nextAssigned = false;
    MINSA_WEEKS.forEach((week, i) => {
      let dateKey = addDaysToKey(p.fumKey, week * 7);
      const isPast = dateKey < todayKey;
      let time: string = CONTROL_TIMES[i % CONTROL_TIMES.length];
      let estado: Appointment["estado"];

      if (isPast) {
        if (p.id === "p-lucia" && i === 2) {
          estado = "no_asistida";
        } else if (p.id === "p-yolanda" && i === 5) {
          // Control 6 nunca atendido ni marcado → alerta "sin control".
          estado = "programada";
        } else {
          estado = "asistida";
        }
      } else {
        if (!nextAssigned) {
          nextAssigned = true;
          const force = forceNextToToday[p.id];
          const offset = nextOffsets[p.id];
          if (force) {
            dateKey = todayKey;
            time = force;
          } else if (offset) {
            dateKey = addDaysToKey(todayKey, offset.days);
            time = offset.time;
          }
        }
        estado = "programada";
      }

      out.push({
        id: `${p.id}-c${i + 1}`,
        patientId: p.id,
        control: i + 1,
        week,
        dateKey,
        time,
        motivo: `Control prenatal ${i + 1} de 8`,
        estado,
        lugar: HEALTH_CENTER,
      });
    });
  });

  out.push(
    {
      id: "extra-rosa",
      patientId: "p-rosa",
      control: null,
      week: null,
      dateKey: todayKey,
      time: "16:00",
      motivo: "Consulta por dolor lumbar",
      estado: "programada",
      lugar: HEALTH_CENTER,
    },
    {
      id: "extra-silvia",
      patientId: "p-silvia",
      control: null,
      week: null,
      dateKey: todayKey,
      time: "15:30",
      motivo: "Orientación y apertura de historia",
      estado: "programada",
      lugar: HEALTH_CENTER,
    },
  );

  return out;
}

function buildSupplements(): Supplement[] {
  const base = (patientId: string): Supplement[] => [
    {
      id: `${patientId}-hierro`,
      patientId,
      name: "Sulfato ferroso 60 mg",
      dose: "1 tableta",
      schedule: "En ayunas, con agua o jugo de naranja",
      timesPerDay: 1,
    },
    {
      id: `${patientId}-folico`,
      patientId,
      name: "Ácido fólico 500 µg",
      dose: "1 tableta",
      schedule: "Con el almuerzo",
      timesPerDay: 1,
    },
    {
      id: `${patientId}-calcio`,
      patientId,
      name: "Calcio 500 mg",
      dose: "1 tableta",
      schedule: "Con la cena (separado del hierro)",
      timesPerDay: 1,
    },
  ];
  return [
    ...base("p-ana"),
    ...base("p-lucia"),
    {
      id: "p-lucia-metildopa",
      patientId: "p-lucia",
      name: "Metildopa 250 mg",
      dose: "1 tableta",
      schedule: "Mañana y noche (control de presión)",
      timesPerDay: 2,
    },
  ];
}

/** Tomas de los últimos 29 días: Ana ~90% · Lucía ~60%. Hoy empieza vacío. */
function buildIntakes(
  supplements: Supplement[],
  todayKey: string,
): Record<string, Record<string, string[]>> {
  const logs: Record<string, Record<string, string[]>> = {};
  const patterns: Record<string, (day: number) => boolean> = {
    "p-ana": (day) => day % 11 !== 0,
    "p-lucia": (day) => day % 5 < 3,
  };
  Object.keys(patterns).forEach((patientId) => {
    // Cada id se repite según sus tomas diarias (día cumplido = día completo).
    const ids = supplements
      .filter((s) => s.patientId === patientId)
      .flatMap((s) => Array<string>(Math.max(1, s.timesPerDay ?? 1)).fill(s.id));
    const perDay: Record<string, string[]> = {};
    for (let i = 1; i <= 29; i++) {
      if (patterns[patientId](i)) {
        perDay[addDaysToKey(todayKey, -i)] = [...ids];
      }
    }
    logs[patientId] = perDay;
  });
  return logs;
}

function buildMessages(): Message[] {
  const yesterdayMorning = (mins: number) =>
    new Date(Date.now() - 24 * 3600000 - mins * 60000).toISOString();

  return [
    {
      id: "m-ana-1",
      convId: "p-ana",
      sender: "obstetra",
      kind: "text",
      text: "Hola Ana, ¿cómo te sientes esta semana?",
      atISO: yesterdayMorning(24),
      readByGestante: true,
      readByObstetra: true,
    },
    {
      id: "m-ana-2",
      convId: "p-ana",
      sender: "gestante",
      kind: "text",
      text: "Buenos días doctora, todo bien. Solo con un poco de sueño.",
      atISO: yesterdayMorning(16),
      readByGestante: true,
      readByObstetra: true,
    },
    {
      id: "m-ana-3",
      convId: "p-ana",
      sender: "obstetra",
      kind: "text",
      text: "Es normal a tus semanas. Recuerda tomar tu sulfato ferroso en ayunas. Te espero en tu próximo control.",
      atISO: yesterdayMorning(12),
      readByGestante: false,
      readByObstetra: true,
    },
    {
      id: "m-lucia-1",
      convId: "p-lucia",
      sender: "gestante",
      kind: "emergencia",
      text: "Botón de emergencia activado: dolor de cabeza fuerte y veo lucecitas.",
      atISO: nowISO(120),
      readByGestante: true,
      readByObstetra: true,
      lat: -13.6547,
      lng: -73.4288,
    },
    {
      id: "m-lucia-2",
      convId: "p-lucia",
      sender: "obstetra",
      kind: "text",
      text: "Lucía, vi tu alerta. Con tu presión alta eso es un signo de alarma. Por favor ven al centro de salud AHORA. Si no puedes movilizarte, avísame para coordinar.",
      atISO: nowISO(110),
      readByGestante: false,
      readByObstetra: true,
    },
    {
      id: "m-maria-1",
      convId: "p-maria",
      sender: "gestante",
      kind: "text",
      text: "Doctora, ¿puedo seguir tomando mate de coca con mis pastillas de hierro?",
      atISO: nowISO(30),
      readByGestante: true,
      readByObstetra: false,
    },
  ];
}

function buildVisits(todayKey: string): Visit[] {
  return [
    {
      id: "v-lucia-1",
      patientId: "p-lucia",
      dateKey: addDaysToKey(todayKey, 1),
      time: "11:00",
      motivo: "Seguimiento por inasistencia al control 3 y presión alta",
      estado: "programada",
      createdAtISO: nowISO(60 * 20),
    },
    {
      id: "v-yolanda-1",
      patientId: "p-yolanda",
      dateKey: addDaysToKey(todayKey, -3),
      time: "10:00",
      motivo: "Consejería de suplementación y plan de parto",
      estado: "realizada",
      resultado:
        "Gestante estable. Se reforzó la toma diaria de sulfato ferroso y se coordinó transporte para su próximo control.",
      createdAtISO: nowISO(60 * 24 * 5),
    },
  ];
}

export function buildSeed(): DBState {
  const todayKey = peruDayKey();
  const patients = buildPatients(todayKey);
  const supplements = buildSupplements();
  return {
    seedVersion: SEED_VERSION,
    users: buildUsers(),
    patients,
    appointments: buildAppointments(patients, todayKey),
    supplements,
    intakes: buildIntakes(supplements, todayKey),
    messages: buildMessages(),
    alerts: [
      {
        id: "al-emergencia-lucia-seed",
        type: "emergencia",
        patientId: "p-lucia",
        atISO: nowISO(120),
        title: "Botón de emergencia",
        detail: "Dolor de cabeza fuerte y visión de lucecitas.",
        status: "abierta",
        lat: -13.6547,
        lng: -73.4288,
      },
    ],
    visits: buildVisits(todayKey),
    sessions: {},
    appliedActionIds: [],
  };
}
