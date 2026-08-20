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
  AppEnvironment,
  Appointment,
  Article,
  ArticleAssignment,
  DBState,
  Message,
  Patient,
  StoredUser,
  Supplement,
  SystemConfig,
  Visit,
} from "./types";

export const HEALTH_CENTER = "C.S. Talavera";
export const SEED_VERSION = 4;

/** DNIs de las cuentas de demostración que se muestran en el login (solo en demo). */
export const DEMO_DNIS = ["33333333", "44444444", "11111111", "22222222"] as const;

export const DEFAULT_MAINTENANCE_MESSAGE =
  "Estamos mejorando VitMaterna para cuidarte mejor. Vuelve a intentarlo en un ratito; tus datos están seguros.";

export const DEFAULT_ARTICLES: Article[] = [
  {
    id: "a-alimentacion",
    category: "Nutrición",
    title: "Alimentación en el embarazo andino",
    minutes: 4,
    summary: "Quinua, habas, sangrecita: combate la anemia con lo que tienes en casa.",
    body: [
      "En la altura, tu cuerpo necesita más hierro que en la costa. La buena noticia: los alimentos de tu chacra son grandes aliados.",
      "Come cada semana: sangrecita, hígado, bazo, quinua, habas, lentejas y hojas verdes como la espinaca o el atago.",
      "Acompaña el hierro con vitamina C: un vaso de jugo de naranja, limonada o papaya ayuda a que tu cuerpo lo aproveche mejor.",
      "Evita tomar té, café o mates junto con las comidas principales y tus pastillas de hierro: cortan la absorción. Sepáralos por lo menos 2 horas.",
      "Toma de 6 a 8 vasos de agua hervida al día y usa siempre sal yodada.",
    ],
    active: true,
    links: [
      { label: "Guía nutricional materno-infantil MINSA", url: "https://www.gob.pe/minsa" },
    ],
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
  },
  {
    id: "a-signos",
    category: "Urgencias",
    title: "Signos de alarma: cuándo acudir YA",
    minutes: 3,
    summary: "Reconoce las señales que no pueden esperar hasta tu próximo control.",
    body: [
      "Hay molestias normales del embarazo, pero otras son señales de peligro para ti y tu bebé.",
      "Acude de inmediato al centro de salud si tienes: sangrado, dolor de cabeza fuerte, visión borrosa, fiebre, hinchazón de cara y manos, o si tu bebé deja de moverse.",
      "No esperes a que pase. En la sierra las distancias son largas: ante la duda, sal temprano o pide apoyo a tu promotor de salud.",
      "Si no puedes movilizarte, usa el botón de emergencia de esta app: tu obstetra recibirá tu alerta con tu ubicación.",
      "Guarda los números de tu centro de salud y coordina con tu familia un plan de transporte desde ahora.",
    ],
    active: true,
    links: [
      { label: "Protocolo de emergencias obstétricas", url: "https://www.gob.pe/minsa" },
    ],
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
  },
  {
    id: "a-suplementos",
    category: "Tratamiento",
    title: "Hierro y ácido fólico: por qué cada día cuenta",
    minutes: 3,
    summary: "La anemia en la altura se esconde. Tus pastillas son tu escudo.",
    body: [
      "A 2 900 metros de altura, un análisis de hemoglobina puede parecer normal y aún así haber anemia. Por eso tu obstetra corrige el resultado según la altitud.",
      "El sulfato ferroso previene la anemia, que causa cansancio, partos prematuros y bebés con bajo peso.",
      "Tómalo en ayunas con agua o jugo de naranja. Si te cae pesado, puedes tomarlo antes de dormir.",
      "Es normal que las heces se pongan oscuras. Si tienes náuseas o estreñimiento, cuéntale a tu obstetra: hay formas de aliviarlo sin dejar el tratamiento.",
      "Marca cada toma en la pestaña Tratamiento: tu obstetra ve tu avance y puede ayudarte a tiempo.",
    ],
    active: true,
    links: [
      { label: "Norma técnica de prevención de anemia", url: "https://www.gob.pe/minsa" },
    ],
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
  },
  {
    id: "a-plan-parto",
    category: "Preparación",
    title: "Tu plan de parto: decide con tiempo",
    minutes: 4,
    summary: "Dónde dar a luz, cómo llegar, quién te acompaña. Todo listo antes de la semana 37.",
    body: [
      "Un plan de parto es un acuerdo con tu familia y tu centro de salud para que el día del parto nada te tome por sorpresa.",
      "Decide dónde darás a luz: el parto institucional (en el centro de salud u hospital) es lo más seguro para ti y tu bebé.",
      "Coordina el transporte: ¿quién tiene carro o moto en tu comunidad? ¿Cuánto demora? Ten un plan B si es de noche o llueve.",
      "Prepara tu maletín desde la semana 34: DNI, tu carnet de controles, ropa abrigadora para ti y tu bebé, y frazadas.",
      "Elige a tu acompañante y avísale a tu obstetra. Tienes derecho a estar acompañada durante el parto.",
    ],
    active: true,
    links: [
      { label: "Plan de Parto Institucional MINSA", url: "https://www.gob.pe/minsa" },
    ],
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
  },
  {
    id: "a-lactancia",
    category: "Posparto",
    title: "Lactancia: la primera hora de oro",
    minutes: 3,
    summary: "El calostro es la primera vacuna de tu bebé. Así te preparas desde ahora.",
    body: [
      "La leche materna es el mejor alimento: protege a tu bebé de infecciones y lo abriga por dentro en el frío de la sierra.",
      "La primera hora después del parto es de oro: pide que pongan a tu bebé en tu pecho apenas nazca.",
      "El calostro (la primera leche amarillita) es poquito pero poderoso: es la primera defensa de tu bebé. No lo deseches.",
      "Dale solo pecho hasta los 6 meses: ni agüitas ni mates. La leche materna tiene todo lo que necesita.",
      "Si te duele o sientes que no sale, pide ayuda en tu control: casi siempre se arregla mejorando la posición del bebé.",
    ],
    active: true,
    links: [
      { label: "Beneficios de la lactancia materna exclusiva", url: "https://www.gob.pe/minsa" },
    ],
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
  },
  {
    id: "a-bienestar",
    category: "Salud mental",
    title: "Cuidar tu ánimo también es cuidar tu embarazo",
    minutes: 3,
    summary: "Tristeza, preocupación o miedo: hablar a tiempo hace la diferencia.",
    body: [
      "El embarazo trae emociones fuertes: alegría, pero también miedo o preocupación. Todas son normales.",
      "Si la tristeza dura muchos días, no quieres levantarte o lloras sin razón, no estás sola: es más común de lo que crees y tiene solución.",
      "Busca compañía: camina con alguien de confianza, participa de las reuniones de tu comunidad, comparte cómo te sientes.",
      "En tu control te haremos unas preguntas sencillas sobre tu ánimo. Responde con confianza: nos ayuda a cuidarte mejor.",
      "Si sientes que te hacen daño en casa, cuéntale a tu obstetra. Te escucharemos sin juzgar y te acompañaremos.",
    ],
    active: true,
    links: [
      { label: "Línea 113 Salud Mental MINSA", url: "https://www.gob.pe/113" },
    ],
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
  },
];

/** Configuración inicial del sistema. */
export function defaultConfig(environment: AppEnvironment = "demo"): SystemConfig {
  return {
    maintenance: false,
    maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
    environment,
    updatedAtISO: new Date().toISOString(),
  };
}

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
  const articles = [...DEFAULT_ARTICLES];
  const articleAssignments: ArticleAssignment[] = [
    { patientId: "p-maria", articleId: "a-alimentacion", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 5) },
    { patientId: "p-maria", articleId: "a-signos", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 5) },
    { patientId: "p-maria", articleId: "a-suplementos", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 3) },
    { patientId: "p-lucia", articleId: "a-signos", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 4) },
    { patientId: "p-lucia", articleId: "a-plan-parto", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 2) },
    { patientId: "p-rosa", articleId: "a-alimentacion", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 3) },
    { patientId: "p-rosa", articleId: "a-suplementos", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 3) },
    { patientId: "p-ana", articleId: "a-lactancia", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 1) },
    { patientId: "p-ana", articleId: "a-bienestar", assignedByDni: "11111111", assignedAtISO: nowISO(60 * 24 * 1) },
  ];

  return {
    seedVersion: SEED_VERSION,
    config: defaultConfig("demo"),
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
    articles,
    articleAssignments,
    sessions: {},
    appliedActionIds: [],
  };
}

/**
 * Seed de PRODUCCIÓN: plataforma limpia para uso real. Conserva únicamente
 * las cuentas de administración indicadas (para no cortar su sesión); el
 * resto de usuarios, pacientes, citas, mensajes y alertas de demostración
 * desaparecen. Desde aquí la administración registra al personal real.
 */
export function buildProductionSeed(keepUsers: StoredUser[]): DBState {
  return {
    seedVersion: SEED_VERSION,
    config: defaultConfig("produccion"),
    users: keepUsers.map((u) => ({ ...u })),
    patients: [],
    appointments: [],
    supplements: [],
    intakes: {},
    messages: [],
    alerts: [],
    visits: [],
    articles: [...DEFAULT_ARTICLES],
    articleAssignments: [],
    sessions: {},
    appliedActionIds: [],
  };
}
