import { describe, expect, it } from "bun:test";
import { applyOutbox } from "./outbox";
import type { ClientAction, Snapshot, User } from "../types";

describe("Frontend Outbox — Optimistic State Reducer", () => {
  const baseUser: User = {
    dni: "33333333",
    role: "gestante",
    firstName: "Ana",
    lastName: "Quispe",
    patientId: "p-ana",
    active: true,
    createdAtISO: new Date().toISOString(),
  };

  const initialSnapshot: Snapshot = {
    todayKey: ["2026", "08", "16"].join("-"),
    user: baseUser,
    community: {
      name: "Talavera",
      altitudeMsnm: 2926,
      hbCorrectionFactor: -1.8,
    },
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
        fppKey: ["2026", "10", "08"].join("-"),
        weeks: 32,
        daysExtra: 3,
        trimester: 3,
        gestas: 1,
        cesareas: 0,
        abortos: 0,
        obitoFetal: false,
        rhSensibilizado: false,
        imc: 24.2,
        hbObserved: 12.8,
        hbCorrected: 11.0,
        anemia: "normal",
        bpSys: 110,
        bpDia: 70,
        antecedentes: [],
        riskScore: 0,
        riskLevel: "verde",
        riskFactors: [],
        adherence30: 85,
        streak: 5,
        nextAppointment: null,
      },
    ],
    appointments: [
      {
        id: "a-1",
        patientId: "p-ana",
        dateKey: ["2026", "08", "20"].join("-"),
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
        id: "s-hierro",
        patientId: "p-ana",
        name: "Sulfato Ferroso",
        dose: "1 tableta",
        schedule: "En ayunas",
        timesPerDay: 1,
        startKey: ["2026", "08", "01"].join("-"),
      },
    ],
    intakes: {
      "p-ana": {
        "2026-08-16": [],
      },
    },
    messages: [],
    alerts: [],
    visits: [],
  };

  it("returns original snapshot unmodified when actions array is empty", () => {
    const res = applyOutbox(initialSnapshot, [], baseUser);
    expect(res).toBe(initialSnapshot);
  });

  it("optimistically confirms an appointment", () => {
    const action: ClientAction = {
      id: "act-1",
      type: "confirm_appointment",
      appointmentId: "a-1",
      atISO: new Date().toISOString(),
    };
    const res = applyOutbox(initialSnapshot, [action], baseUser);
    expect(res.appointments[0]?.estado).toBe("confirmada");
  });

  it("optimistically requests a reschedule for an appointment", () => {
    const action: ClientAction = {
      id: "act-2",
      type: "request_reschedule",
      appointmentId: "a-1",
      atISO: new Date().toISOString(),
    };
    const res = applyOutbox(initialSnapshot, [action], baseUser);
    expect(res.appointments[0]?.estado).toBe("solicitud_reprogramacion");
  });

  it("optimistically toggles supplement intake for today", () => {
    const actionTake: ClientAction = {
      id: "act-3",
      type: "toggle_intake",
      patientId: "p-ana",
      supplementId: "s-hierro",
      dayKey: ["2026", "08", "16"].join("-"),
      taken: true,
      atISO: new Date().toISOString(),
    };
    const resTake = applyOutbox(initialSnapshot, [actionTake], baseUser);
    expect(resTake.intakes["p-ana"]?.["2026-08-16"]).toContain("s-hierro");

    const actionUntake: ClientAction = {
      id: "act-4",
      type: "toggle_intake",
      patientId: "p-ana",
      supplementId: "s-hierro",
      dayKey: ["2026", "08", "16"].join("-"),
      taken: false,
      atISO: new Date().toISOString(),
    };
    const resUntake = applyOutbox(resTake, [actionUntake], baseUser);
    expect(resUntake.intakes["p-ana"]?.["2026-08-16"]).toEqual([]);
  });

  it("optimistically appends a sent chat message", () => {
    const actionMsg: ClientAction = {
      id: "act-5",
      type: "send_message",
      convId: "c-ana",
      text: "Buenas tardes obstetra, tengo una consulta",
      atISO: new Date().toISOString(),
    };
    const res = applyOutbox(initialSnapshot, [actionMsg], baseUser);
    expect(res.messages.length).toBe(1);
    expect(res.messages[0]?.text).toBe("Buenas tardes obstetra, tengo una consulta");
    expect(res.messages[0]?.pending).toBe(true);
    expect(res.messages[0]?.sender).toBe("gestante");
  });

  it("optimistically triggers a panic SOS emergency alert", () => {
    const actionPanic: ClientAction = {
      id: "act-6",
      type: "panic",
      atISO: new Date().toISOString(),
      lat: -13.654,
      lng: -73.356,
    };
    const res = applyOutbox(initialSnapshot, [actionPanic], baseUser);
    const emergencyAlert = res.alerts.find((a) => a.type === "emergencia");
    expect(emergencyAlert).toBeDefined();
    expect(emergencyAlert?.status).toBe("abierta");
    expect(emergencyAlert?.lat).toBe(-13.654);
    expect(emergencyAlert?.lng).toBe(-73.356);
  });

  it("optimistically records alarm symptoms report", () => {
    const actionAlarm: ClientAction = {
      id: "act-7",
      type: "report_alarm",
      signs: ["Cefalea intensa", "Visión borrosa"],
      note: "Desde esta mañana",
      atISO: new Date().toISOString(),
      lat: -13.654,
      lng: -73.356,
    };
    const res = applyOutbox(initialSnapshot, [actionAlarm], baseUser);
    const alarmAlert = res.alerts.find((a) => a.type === "alarma");
    expect(alarmAlert).toBeDefined();
    expect(alarmAlert?.detail).toContain("Cefalea intensa, Visión borrosa");
    expect(alarmAlert?.status).toBe("abierta");
  });

  const obstetraUser: User = {
    ...baseUser,
    role: "obstetra",
    patientId: undefined,
  };

  it("optimistically adds, updates, and removes supplement for health staff", () => {
    const addAction: ClientAction = {
      id: "act-8",
      type: "add_supplement",
      patientId: "p-ana",
      fields: {
        name: "Calcio 500 mg",
        dose: "1 tableta",
        schedule: "Con el almuerzo",
        timesPerDay: 2,
      },
      atISO: new Date().toISOString(),
    };
    const resAdd = applyOutbox(initialSnapshot, [addAction], obstetraUser);
    const added = resAdd.supplements.find((s) => s.name === "Calcio 500 mg");
    expect(added).toBeDefined();
    expect(added?.timesPerDay).toBe(2);

    const updateAction: ClientAction = {
      id: "act-9",
      type: "update_supplement",
      supplementId: added!.id,
      fields: {
        name: "Calcio 500 mg",
        dose: "2 tabletas",
        schedule: "Mañana y noche",
        timesPerDay: 2,
      },
      atISO: new Date().toISOString(),
    };
    const resUpdate = applyOutbox(resAdd, [updateAction], obstetraUser);
    const updated = resUpdate.supplements.find((s) => s.id === added!.id);
    expect(updated?.dose).toBe("2 tabletas");

    const removeAction: ClientAction = {
      id: "act-10",
      type: "remove_supplement",
      supplementId: added!.id,
      atISO: new Date().toISOString(),
    };
    const resRemove = applyOutbox(resUpdate, [removeAction], obstetraUser);
    expect(resRemove.supplements.find((s) => s.id === added!.id)).toBeUndefined();
  });

  it("ignores supplement modifications attempted by gestante", () => {
    const addAction: ClientAction = {
      id: "act-11",
      type: "add_supplement",
      patientId: "p-ana",
      fields: {
        name: "Calcio 500 mg",
        dose: "1 tableta",
        schedule: "Con el almuerzo",
        timesPerDay: 2,
      },
      atISO: new Date().toISOString(),
    };
    const resAdd = applyOutbox(initialSnapshot, [addAction], baseUser);
    expect(resAdd.supplements.find((s) => s.name === "Calcio 500 mg")).toBeUndefined();
  });
});
