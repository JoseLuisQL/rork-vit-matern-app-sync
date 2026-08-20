import { describe, expect, it } from "bun:test";
import {
  buildReport,
  computePatient,
  countDoses,
  isSupplementActiveOn,
  publicUser,
  sanitizeSupplementFields,
  snapshotFor,
  timesPerDayOf,
} from "./domain";
import type { AppData, Patient, Supplement, UserRecord } from "./types";

describe("Server Domain — User Sanitization & Security", () => {
  it("publicUser removes passwordHash and internal security attributes", () => {
    const user: UserRecord = {
      dni: "12345678",
      passwordHash: "secret_hash_not_to_be_leaked",
      role: "gestante",
      firstName: "María",
      lastName: "Condori",
      phone: "987654321",
      patientId: "p-maria",
      active: true,
      createdAtISO: new Date().toISOString(),
      avatarVersion: 3,
      autoControls: true,
    };

    const publicInfo = publicUser(user);
    expect((publicInfo as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    expect(publicInfo.dni).toBe("12345678");
    expect(publicInfo.firstName).toBe("María");
    expect(publicInfo.lastName).toBe("Condori");
    expect(publicInfo.patientId).toBe("p-maria");
    expect(publicInfo.avatarVersion).toBe(3);
    expect(publicInfo.autoControls).toBe(true);
  });

  it("publicUser respects autoControls preference when disabled", () => {
    const obstetraUser: UserRecord = {
      dni: "87654321",
      passwordHash: "secret_hash",
      role: "obstetra",
      firstName: "Carmen",
      lastName: "Rojas",
      active: true,
      patientId: null,
      phone: "987000111",
      createdAtISO: new Date().toISOString(),
      avatarVersion: null,
      autoControls: false,
    };

    const publicInfo = publicUser(obstetraUser);
    expect(publicInfo.autoControls).toBe(false);
  });
});

describe("Server Domain — Supplements & Intake Calculations", () => {
  const sampleSupplement: Supplement = {
    id: "s-hierro-1",
    patientId: "p-1",
    name: "Sulfato Ferroso",
    dose: "1 tableta",
    schedule: "Mañanas",
    timesPerDay: 1,
    startKey: ["2026", "08", "01"].join("-"),
  };

  it("timesPerDayOf clamps valid values between 1 and 6", () => {
    expect(timesPerDayOf(sampleSupplement)).toBe(1);
    expect(timesPerDayOf({ ...sampleSupplement, timesPerDay: 0 })).toBe(1);
    expect(timesPerDayOf({ ...sampleSupplement, timesPerDay: 8 })).toBe(6);
    expect(timesPerDayOf({ ...sampleSupplement, timesPerDay: 3.2 })).toBe(3);
  });

  it("isSupplementActiveOn determines if supplement is active on given day", () => {
    expect(isSupplementActiveOn(sampleSupplement, "2026-07-31")).toBe(false);
    expect(isSupplementActiveOn(sampleSupplement, "2026-08-01")).toBe(true);
    expect(isSupplementActiveOn(sampleSupplement, "2026-08-15")).toBe(true);
  });

  it("countDoses counts occurrences of supplement id in log array", () => {
    const logs = ["s-hierro-1", "s-calcio", "s-hierro-1"];
    expect(countDoses(logs, "s-hierro-1")).toBe(2);
    expect(countDoses(logs, "s-calcio")).toBe(1);
    expect(countDoses(undefined, "s-hierro-1")).toBe(0);
  });

  it("sanitizeSupplementFields validates names and clamps lengths", () => {
    expect(sanitizeSupplementFields(undefined)).toBeNull();
    expect(sanitizeSupplementFields({ name: "   ", dose: "", schedule: "", timesPerDay: 1 })).toBeNull();

    const sanitized = sanitizeSupplementFields({
      name: "   Ácido Fólico   ",
      dose: "   0.5 mg   ",
      schedule: "Con el almuerzo",
      timesPerDay: 2,
    });
    expect(sanitized).toEqual({
      name: "Ácido Fólico",
      dose: "0.5 mg",
      schedule: "Con el almuerzo",
      timesPerDay: 2,
    });
  });
});

describe("Server Domain — Clinical Calculations & Patient View", () => {
  const patient: Patient = {
    id: "p-ana",
    dni: "33333333",
    firstName: "Ana",
    lastName: "Quispe",
    phone: "987654321",
    community: "Talavera",
    age: 24,
    fumKey: ["2026", "01", "01"].join("-"),
    gestas: 1,
    cesareas: 0,
    abortos: 0,
    obitoFetal: false,
    rhSensibilizado: false,
    imc: 24.2,
    hbObserved: 13.0,
    bpSys: 110,
    bpDia: 70,
    antecedentes: [],
    adherenceBase: 80,
  };

  const dummyData: AppData = {
    users: [],
    patients: [patient],
    appointments: [
      {
        id: "a-1",
        patientId: "p-ana",
        dateKey: ["2026", "08", "25"].join("-"),
        time: "09:00",
        control: 6,
        week: 32,
        motivo: "Control prenatal",
        estado: "programada",
        lugar: "C.S. Talavera",
      },
    ],
    supplements: [
      {
        id: "s-1",
        patientId: "p-ana",
        name: "Sulfato Ferroso",
        dose: "1 tableta",
        schedule: "Mañanas",
        timesPerDay: 1,
        startKey: ["2026", "08", "01"].join("-"),
      },
    ],
    intakes: {
      "p-ana": {
        "2026-08-15": ["s-1"],
        "2026-08-14": ["s-1"],
      },
    },
    messages: [],
    alerts: [],
    visits: [],
    articles: [],
    articleAssignments: [],
    seedVersion: 1,
    config: {
      maintenance: false,
      maintenanceMessage: "",
      environment: "demo",
      updatedAtISO: new Date().toISOString(),
    },
    whatsappConfig: {
      enabled: true,
      serverUrl: "https://openwa.qware.me",
      apiKey: "test_key",
      sessionId: "vitmaterna",
      notifyAppointments: true,
      notifySupplements: true,
      remindAppointments: true,
      remindSupplements: true,
      chatOfflineFallback: true,
      sosOfflineAlerts: true,
      updatedAtISO: new Date().toISOString(),
    },
  };

  it("computes patient clinical metrics accurately", () => {
    const today = "2026-08-16";
    const view = computePatient(patient, dummyData, today);

    expect(view.weeks).toBeGreaterThan(30);
    expect(view.trimester).toBe(3);
    expect(view.hbCorrected).toBe(11.2);
    expect(view.anemia).toBe("normal");
    expect(view.riskLevel).toBe("verde");
    expect(view.nextAppointment?.id).toBe("a-1");
  });
});

describe("Server Domain — Role-based Snapshot Filtering & MINSA Reports", () => {
  const gestanteUser: UserRecord = {
    dni: "33333333",
    passwordHash: "hash-123",
    role: "gestante",
    firstName: "Ana",
    lastName: "Quispe",
    patientId: "p-ana",
    phone: "987654321",
    active: true,
    createdAtISO: new Date().toISOString(),
    avatarVersion: null,
  };

  const adminUser: UserRecord = {
    dni: "22222222",
    passwordHash: "hash-456",
    role: "admin",
    firstName: "Patricia",
    lastName: "Salas",
    patientId: null,
    phone: null,
    active: true,
    createdAtISO: new Date().toISOString(),
    avatarVersion: null,
  };

  const obstetraUser: UserRecord = {
    dni: "11111111",
    passwordHash: "hash-789",
    role: "obstetra",
    firstName: "Carmen",
    lastName: "Rojas",
    patientId: null,
    phone: "983222333",
    active: true,
    createdAtISO: new Date().toISOString(),
    avatarVersion: 1,
  };

  const appData: AppData = {
    users: [gestanteUser, adminUser, obstetraUser],
    patients: [
      {
        id: "p-ana",
        dni: "33333333",
        firstName: "Ana",
        lastName: "Quispe",
        phone: "987654321",
        community: "Talavera",
        age: 24,
        fumKey: ["2026", "01", "01"].join("-"),
        gestas: 1,
        cesareas: 0,
        abortos: 0,
        obitoFetal: false,
        rhSensibilizado: false,
        imc: 24.2,
        hbObserved: 13.0,
        bpSys: 110,
        bpDia: 70,
        antecedentes: [],
        adherenceBase: 85,
      },
      {
        id: "p-lucia",
        dni: "44444444",
        firstName: "Lucía",
        lastName: "Huamán",
        phone: "987654322",
        community: "Huaracco",
        age: 36,
        fumKey: ["2026", "03", "01"].join("-"),
        gestas: 3,
        cesareas: 1,
        abortos: 0,
        obitoFetal: false,
        rhSensibilizado: false,
        imc: 27.5,
        hbObserved: 10.5, // Corrected 8.7 -> Anemia moderada
        bpSys: 120,
        bpDia: 80,
        antecedentes: [],
        adherenceBase: 60,
      },
    ],
    appointments: [
      {
        id: "a-ana",
        patientId: "p-ana",
        dateKey: ["2026", "08", "25"].join("-"),
        time: "09:00",
        control: 6,
        week: 32,
        motivo: "Control prenatal",
        estado: "programada",
        lugar: "C.S. Talavera",
      },
      {
        id: "a-lucia",
        patientId: "p-lucia",
        dateKey: ["2026", "08", "26"].join("-"),
        time: "10:00",
        control: 4,
        week: 24,
        motivo: "Control prenatal",
        estado: "programada",
        lugar: "C.S. Talavera",
      },
    ],
    supplements: [],
    intakes: {},
    messages: [],
    alerts: [],
    visits: [],
    articles: [
      {
        id: "art-1",
        category: "Nutrición",
        title: "Alimentación",
        summary: "Resumen",
        body: ["Párrafo 1"],
        minutes: 3,
        active: true,
        links: [],
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString(),
      },
      {
        id: "art-2",
        category: "Urgencias",
        title: "Signos",
        summary: "Resumen 2",
        body: ["Párrafo 2"],
        minutes: 2,
        active: true,
        links: [],
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString(),
      },
      {
        id: "art-3",
        category: "Tratamiento",
        title: "Deshabilitado",
        summary: "Resumen 3",
        body: ["Párrafo 3"],
        minutes: 2,
        active: false,
        links: [],
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString(),
      },
    ],
    articleAssignments: [
      {
        patientId: "p-ana",
        articleId: "art-1",
        assignedAtISO: new Date().toISOString(),
      },
      {
        patientId: "p-ana",
        articleId: "art-3", // Inactive
        assignedAtISO: new Date().toISOString(),
      },
      {
        patientId: "p-lucia",
        articleId: "art-2",
        assignedAtISO: new Date().toISOString(),
      },
    ],
    seedVersion: 1,
    config: {
      maintenance: false,
      maintenanceMessage: "",
      environment: "demo",
      updatedAtISO: new Date().toISOString(),
    },
    whatsappConfig: {
      enabled: true,
      serverUrl: "https://openwa.qware.me",
      apiKey: "test_key",
      sessionId: "vitmaterna",
      notifyAppointments: true,
      notifySupplements: true,
      remindAppointments: true,
      remindSupplements: true,
      chatOfflineFallback: true,
      sosOfflineAlerts: true,
      updatedAtISO: new Date().toISOString(),
    },
  };

  it("snapshotFor strictly filters data for gestante role and includes obstetrician", () => {
    const snap = snapshotFor(gestanteUser, appData, {});
    expect(snap.patients.length).toBe(1);
    expect(snap.patients[0]?.id).toBe("p-ana");
    expect(snap.appointments.length).toBe(1);
    expect(snap.appointments[0]?.id).toBe("a-ana");
    expect(snap.users).toBeUndefined();
    expect(snap.reports).toBeUndefined();
    expect(snap.whatsappConfig).toBeUndefined();
    expect(snap.obstetrician).toBeDefined();
    expect(snap.obstetrician?.firstName).toBe("Carmen");
    expect(snap.obstetrician?.phone).toBe("983222333");
    // Gestante only gets active articles assigned to her
    expect(snap.articles?.length).toBe(1);
    expect(snap.articles?.[0]?.id).toBe("art-1");
    expect(snap.articleAssignments?.length).toBe(2);
  });

  it("snapshotFor includes users and population MINSA reports for admin role", () => {
    const snap = snapshotFor(adminUser, appData, {});
    expect(snap.patients.length).toBe(2);
    expect(snap.users).toBeDefined();
    expect(snap.users?.length).toBe(3);
    expect(snap.reports).toBeDefined();
    expect(snap.reports?.d30).toBeDefined();
    expect(snap.whatsappConfig).toBeDefined();
    expect(snap.whatsappConfig?.apiKey).toBe("test_key");
    // Admin gets all articles (active and inactive) and assignments
    expect(snap.articles?.length).toBe(3);
    expect(snap.articleAssignments?.length).toBe(3);
  });

  it("buildReport generates aggregated population metrics", () => {
    const today = "2026-08-16";
    const report = buildReport(appData, today, 30);

    expect(report.gestantes).toBe(2);
    expect(report.riesgo.verde + report.riesgo.amarillo + report.riesgo.rojo).toBe(2);
    expect(report.anemia.normal).toBe(1); // Ana
    expect(report.anemia.moderada).toBe(1); // Lucia
    expect(report.porComunidad.length).toBe(2);
    expect(report.asistenciaSemanal.length).toBe(6);
  });
});
