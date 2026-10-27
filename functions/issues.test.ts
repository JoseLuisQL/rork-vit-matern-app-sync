/**
 * Pruebas unitarias e integración para los 13 Issues de GitHub (#38 al #50).
 * Verifica cada requerimiento de punta a punta en el backend (/functions y /server)
 * y utilitarios compartidos del frontend (/expo/lib).
 */
import { describe, expect, it } from "bun:test";
import { VitmaternaStore } from "./store";
import { fppKeyFromFum, gestationalWeeks } from "./clinical";
import { snapshotFor } from "../server/src/domain";
import { testWhatsAppConnection, sendWhatsAppText } from "../server/src/whatsapp/client";
import { buildSeed } from "./seed";
import { fppKeyLocal, weeksLocal } from "../expo/lib/optimistic";
import { applyOutbox } from "../expo/lib/outbox";
import { fechaCompleta, fechaCorta } from "../expo/lib/format";

const store = new VitmaternaStore();

async function callApi(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (token) {
    headers["X-VM-Token"] = token;
  }
  const req = new Request(`http://localhost:3000${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const res = await store.fetch(req);
  const data = await res.json();
  return { status: res.status, data };
}

async function loginAs(dni: string, password: string): Promise<{ token: string; snapshot: any }> {
  const res = await callApi("POST", "/api/login", { dni, password });
  expect(res.status).toBe(200);
  expect(res.data.token).toBeDefined();
  return { token: res.data.token as string, snapshot: res.data.snapshot };
}

async function syncState(token: string, actions: any[] = []): Promise<any> {
  const res = await callApi("POST", "/api/sync", { actions }, token);
  expect(res.status).toBe(200);
  return res.data.snapshot;
}

describe("GitHub Issues #38 - #50 Complete Verification Suite", () => {
  it("reset demo state before suite", async () => {
    const { token: adminToken } = await loginAs("22222222", "Test@1234");
    const resetRes = await callApi("POST", "/api/admin/reset", {}, adminToken);
    expect(resetRes.status).toBe(200);
  });

  it("Issue #38 & #46: Relación de Obstetra con Gestante y Visibilidad por Obstetra asignada", async () => {
    const { token: adminToken } = await loginAs("22222222", "Test@1234");

    // Crear una segunda obstetra (DNI 55555555)
    const createObstetraRes = await callApi(
      "POST",
      "/api/admin/create-user",
      {
        dni: "55555555",
        password: "Obstetra2@2026",
        firstName: "Elena",
        lastName: "Vargas",
        role: "obstetra",
        phone: "988111222",
      },
      adminToken,
    );
    expect(createObstetraRes.status).toBe(200);

    // Crear una gestante asignada explícitamente a la obstetra Elena (55555555)
    const createGestanteRes = await callApi(
      "POST",
      "/api/admin/create-user",
      {
        dni: "66666666",
        password: "Gestante@2026",
        firstName: "Valeria",
        lastName: "Mendoza",
        role: "gestante",
        phone: "988333444",
        obstetraDni: "55555555",
        patient: {
          fumKey: "2026-04-10",
          age: 26,
          community: "Av. Perú 450, Talavera",
          hbObserved: 13.2,
          bpSys: 112,
          bpDia: 72,
          weight: 60,
          height: 1.6,
          gestas: 2,
          cesareas: 1,
          abortos: 0,
        },
      },
      adminToken,
    );
    expect(createGestanteRes.status).toBe(200);

    // Verificar que la Obstetra Elena (55555555) SOLO ve a su gestante asignada (Valeria, 66666666)
    const { snapshot: elenaSnap } = await loginAs("55555555", "Obstetra2@2026");
    expect(elenaSnap.patients.length).toBe(1);
    expect(elenaSnap.patients[0].dni).toBe("66666666");
    expect(elenaSnap.patients[0].obstetraDni).toBe("55555555");

    // Verificar que la Obstetra Carmen (11111111) NO ve a Valeria (66666666)
    const { snapshot: carmenSnap } = await loginAs("11111111", "Test@1234");
    const dnisForCarmen = carmenSnap.patients.map((p: any) => p.dni);
    expect(dnisForCarmen).not.toContain("66666666");
    expect(dnisForCarmen).toContain("33333333");

    // Verificar que la gestante Valeria ve a Elena como su obstetra asignada
    const { snapshot: valeriaSnap } = await loginAs("66666666", "Gestante@2026");
    expect(valeriaSnap.obstetrician?.firstName).toBe("Elena");
  });

  it("Issue #40: Peso y Talla con cálculo automático de IMC = Peso / (Talla * Talla)", async () => {
    const { token: elenaToken, snapshot: elenaSnap } = await loginAs("55555555", "Obstetra2@2026");
    const valeria = elenaSnap.patients[0];

    // 60 kg / (1.60 m * 1.60 m) = 23.4375 -> 23.4
    expect(valeria.weight).toBe(60);
    expect(valeria.height).toBe(1.6);
    expect(valeria.imc).toBe(23.4);

    // Actualizar peso a 72 kg y talla en centímetros (160 cm -> 1.60 m) => IMC = 72 / 2.56 = 28.1
    const updatedSnap = await syncState(elenaToken, [
      {
        id: "act-imc-1",
        type: "update_patient",
        patientId: valeria.id,
        fields: {
          weight: 72,
          height: 160,
        },
        atISO: new Date().toISOString(),
      },
    ]);
    const updatedValeria = updatedSnap.patients[0];
    expect(updatedValeria.weight).toBe(72);
    expect(updatedValeria.height).toBe(1.6);
    expect(updatedValeria.imc).toBe(28.1);
  });

  it("Issue #41 & #42: Registro y actualización de Gestaciones, Cesáreas, Abortos y Dirección", async () => {
    const { token: elenaToken, snapshot: elenaSnap } = await loginAs("55555555", "Obstetra2@2026");
    const valeria = elenaSnap.patients[0];

    const updatedSnap = await syncState(elenaToken, [
      {
        id: "act-hist-1",
        type: "update_patient",
        patientId: valeria.id,
        fields: {
          gestas: 4,
          cesareas: 2,
          abortos: 1,
          community: "Jr. Apurímac 210, Talavera",
        },
        atISO: new Date().toISOString(),
      },
    ]);
    const updated = updatedSnap.patients[0];
    expect(updated.gestas).toBe(4);
    expect(updated.cesareas).toBe(2);
    expect(updated.abortos).toBe(1);
    expect(updated.community).toBe("Jr. Apurímac 210, Talavera");
  });

  it("Issue #44: Cálculo y visualización de la Fecha Probable de Parto (FPP) a partir de FUM", () => {
    // Regla de Naegele: FUM 2026-04-10 -> FPP 2027-01-17
    const fppBackend = fppKeyFromFum("2026-04-10");
    const fppFrontend = fppKeyLocal("2026-04-10");
    expect(fppBackend).toBe("2027-01-17");
    expect(fppFrontend).toBe("2027-01-17");
    expect(fechaCorta(fppBackend)).toContain("17");
    expect(fechaCompleta(fppBackend)).toContain("2027");
    expect(gestationalWeeks("2026-04-10", "2026-06-19")).toBe(10);
    expect(weeksLocal("2026-04-10", "2026-06-19")).toBe(10);
  });

  it("Issue #48 & #50: Programar citas en cualquier fecha futura y con cualquier hora personalizada (HH:MM)", async () => {
    const { token: elenaToken, snapshot: elenaSnap } = await loginAs("55555555", "Obstetra2@2026");
    const valeria = elenaSnap.patients[0];

    // Programar en una fecha futura más allá de 14 días (ej. 2027-02-15) y hora personalizada (17:45)
    const schedRes = await callApi(
      "POST",
      "/api/schedule",
      {
        mode: "cita",
        patientId: valeria.id,
        dateKey: "2027-02-15",
        time: "17:45",
        motivo: "Ecografía obstétrica de control",
      },
      elenaToken,
    );
    expect(schedRes.status).toBe(200);
    const createdAppt = schedRes.data.snapshot.appointments.find(
      (a: any) => a.patientId === valeria.id && a.dateKey === "2027-02-15" && a.time === "17:45",
    );
    expect(createdAppt).toBeDefined();
    expect(createdAppt.motivo).toBe("Ecografía obstétrica de control");
  });

  it("Issue #49: Contenidos educativos multimedia (Lectura, Video, PDF, Imagen) creables y asignables por Obstetra y Admin", async () => {
    const { token: elenaToken, snapshot: elenaSnap } = await loginAs("55555555", "Obstetra2@2026");
    const valeria = elenaSnap.patients[0];

    // Obstetra crea un nuevo material educativo tipo Video
    const saveVideoRes = await callApi(
      "POST",
      "/api/admin/article/save",
      {
        title: "Video: Ejercicios de psicoprofilaxis obstétrica",
        category: "Preparación",
        summary: "Rutina guiada de respiración y estiramientos suaves para el tercer trimestre.",
        minutes: 5,
        body: ["Realiza estos ejercicios sobre una colchoneta firme respirando profundamente."],
        mediaType: "video",
        mediaUrl: "https://www.youtube.com/watch?v=MinsaPsicoprofilaxis",
        links: [
          {
            label: "Guía PDF de Psicoprofilaxis MINSA",
            url: "https://www.gob.pe/minsa/psicoprofilaxis.pdf",
            kind: "pdf",
          },
        ],
        active: true,
      },
      elenaToken,
    );
    expect(saveVideoRes.status).toBe(200);
    const createdArticle = saveVideoRes.data.snapshot.articles.find(
      (a: any) => a.title === "Video: Ejercicios de psicoprofilaxis obstétrica",
    );
    expect(createdArticle).toBeDefined();
    expect(createdArticle.mediaType).toBe("video");
    expect(createdArticle.mediaUrl).toBe("https://www.youtube.com/watch?v=MinsaPsicoprofilaxis");

    // Obstetra asigna el video a su gestante
    const assignSnap = await syncState(elenaToken, [
      {
        id: "act-assign-video-1",
        type: "assign_article",
        patientId: valeria.id,
        articleId: createdArticle.id,
        assigned: true,
        atISO: new Date().toISOString(),
      },
    ]);
    const hasAssignment = assignSnap.articleAssignments.some(
      (asgn: any) => asgn.patientId === valeria.id && asgn.articleId === createdArticle.id,
    );
    expect(hasAssignment).toBe(true);
  });

  it("Issue #45: Integración con WhatsApp (Open-WA) activa por defecto y sin error de sesión desconectada", async () => {
    const { token: adminToken, snapshot: adminSnap } = await loginAs("22222222", "Test@1234");
    expect(adminSnap.whatsappConfig.enabled).toBe(true);
    expect(adminSnap.whatsappConfig.apiKey).toBe("vitmaterna-openwa-key");

    // Probar conexión desde el endpoint /api/admin/whatsapp/test-connection
    const waTestRes = await callApi(
      "POST",
      "/api/admin/whatsapp/test-connection",
      {},
      adminToken,
    );
    expect(waTestRes.status).toBe(200);
    expect(waTestRes.data.ok).toBe(true);
    expect(waTestRes.data.status).toBe("connected");

    // Probar cliente de servidor en /server/src/whatsapp/client.ts con las credenciales por defecto
    const status = await testWhatsAppConnection(adminSnap.whatsappConfig);
    expect(status.ok).toBe(true);
    expect(status.status).toBe("connected");

    const sendRes = await sendWhatsAppText(adminSnap.whatsappConfig, "987654321", "Prueba VitMaterna");
    expect(sendRes.ok).toBe(true);
  });

  it("Issue #39 & #43: Eliminar Gestante (desde Obstetra) y Eliminar Usuario (desde Admin)", async () => {
    const { token: elenaToken } = await loginAs("55555555", "Obstetra2@2026");
    const { token: adminToken } = await loginAs("22222222", "Test@1234");

    // Obstetra Elena no puede eliminar una gestante que pertenece a otra obstetra (ej. Ana, 33333333)
    const forbiddenDel = await callApi(
      "POST",
      "/api/admin/delete-user",
      { dni: "33333333" },
      elenaToken,
    );
    expect(forbiddenDel.status).toBe(403);

    // Obstetra Elena SÍ puede eliminar a su propia gestante asignada (Valeria, 66666666)
    const delValeriaRes = await callApi(
      "POST",
      "/api/admin/delete-user",
      { dni: "66666666" },
      elenaToken,
    );
    expect(delValeriaRes.status).toBe(200);
    expect(delValeriaRes.data.snapshot.patients.length).toBe(0);

    // Admin puede eliminar a la obstetra Elena (55555555)
    const delElenaRes = await callApi(
      "POST",
      "/api/admin/delete-user",
      { dni: "55555555" },
      adminToken,
    );
    expect(delElenaRes.status).toBe(200);
    const remainingDnis = delElenaRes.data.snapshot.users.map((u: any) => u.dni);
    expect(remainingDnis).not.toContain("55555555");
    expect(remainingDnis).not.toContain("66666666");
  });

  it("Issue #47 & Frontend Outbox + Server Domain: Reductor optimista y filtrado por obstetra en /server/src/domain.ts", async () => {
    const { snapshot: carmenSnap } = await loginAs("11111111", "Test@1234");
    const firstPatient = carmenSnap.patients[0];

    // Probar reductor optimista del frontend (/expo/lib/outbox.ts) con weight, height, imc y obstetraDni
    const optimisticSnap = applyOutbox(
      carmenSnap,
      [
        {
          id: "opt-1",
          type: "update_patient",
          patientId: firstPatient.id,
          fields: {
            weight: 64,
            height: 160,
            gestas: 3,
            cesareas: 1,
            abortos: 1,
            community: "Jr. Cusco 120, Talavera",
          },
          atISO: new Date().toISOString(),
        },
      ],
      {
        dni: "11111111",
        role: "obstetra",
        firstName: "Carmen",
        lastName: "Rojas",
        active: true,
      },
    );
    const updatedLocal = optimisticSnap.patients.find((p: any) => p.id === firstPatient.id)!;
    expect(updatedLocal.weight).toBe(64);
    expect(updatedLocal.height).toBe(1.6);
    expect(updatedLocal.imc).toBe(25);
    expect(updatedLocal.gestas).toBe(3);
    expect(updatedLocal.cesareas).toBe(1);
    expect(updatedLocal.abortos).toBe(1);
    expect(updatedLocal.community).toBe("Jr. Cusco 120, Talavera");

    // Probar snapshotFor en /server/src/domain.ts aislando pacientes por obstetraDni
    const rawSeed = buildSeed();
    rawSeed.patients[0].obstetraDni = "99999999"; // Asignar la primera paciente a otra obstetra
    const carmenUser = rawSeed.users.find((u) => u.dni === "11111111")!;
    const domainSnap = snapshotFor(carmenUser as any, rawSeed as any, {});
    const domainIds = domainSnap.patients.map((p) => p.id);
    expect(domainIds).not.toContain(rawSeed.patients[0].id);
  });
});
