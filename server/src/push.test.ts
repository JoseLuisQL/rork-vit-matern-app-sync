import { describe, expect, it, mock } from "bun:test";
import {
  getPushTokensForDnis,
  notifyActiveObstetras,
  notifyPatientByPatientId,
  notifyUserByDni,
  sendExpoPush,
} from "./push";

describe("Push Notification Dispatcher", () => {
  it("filters empty or invalid messages in sendExpoPush", async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;
    globalThis.fetch = mock(async () => {
      fetchCalled = true;
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as any;

    try {
      await sendExpoPush([]);
      expect(fetchCalled).toBe(false);

      await sendExpoPush([{ to: "", title: "test", body: "body" }]);
      expect(fetchCalled).toBe(false);

      await sendExpoPush([{ to: "ExponentPushToken[xyz]", title: "test", body: "body" }]);
      expect(fetchCalled).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("retrieves push tokens for given DNIs from db", async () => {
    const fakeDb = {
      query: mock(async (sql: string, params: any[]) => {
        expect(sql).toContain("FROM push_tokens WHERE dni = ANY");
        expect(params[0]).toEqual(["12345678", "87654321"]);
        return {
          rows: [
            { dni: "12345678", token: "ExponentPushToken[111]", platform: "android" },
            { dni: "87654321", token: "ExponentPushToken[222]", platform: "android" },
          ],
        };
      }),
    };

    const tokens = await getPushTokensForDnis(fakeDb as any, ["12345678", "87654321"]);
    expect(tokens.length).toBe(2);
    expect(tokens[0].token).toBe("ExponentPushToken[111]");
  });

  it("notifies user by DNI with correct channels and priority", async () => {
    const originalFetch = globalThis.fetch;
    let sentBody: any = null;
    globalThis.fetch = mock(async (_url: string, init: any) => {
      sentBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 });
    }) as any;

    const fakeDb = {
      query: mock(async () => ({
        rows: [{ dni: "12345678", token: "ExponentPushToken[test1234]", platform: "android" }],
      })),
    };

    try {
      await notifyUserByDni(fakeDb as any, "12345678", {
        title: "Nuevo mensaje",
        body: "Hola ¿cómo estás?",
        channelId: "mensajes",
        sound: "mensaje.wav",
        priority: "high",
        data: { convId: "p-01" },
      });

      expect(sentBody).not.toBeNull();
      expect(sentBody.length).toBe(1);
      expect(sentBody[0].to).toBe("ExponentPushToken[test1234]");
      expect(sentBody[0].title).toBe("Nuevo mensaje");
      expect(sentBody[0].channelId).toBe("mensajes");
      expect(sentBody[0].priority).toBe("high");
      expect(sentBody[0].data.convId).toBe("p-01");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("notifies all active obstetras excluding sender", async () => {
    const originalFetch = globalThis.fetch;
    let sentBody: any = null;
    globalThis.fetch = mock(async (_url: string, init: any) => {
      sentBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 });
    }) as any;

    const fakeDb = {
      query: mock(async (sql: string) => {
        if (sql.includes("FROM users WHERE role = 'obstetra'")) {
          return { rows: [{ dni: "44444444" }, { dni: "55555555" }] };
        }
        if (sql.includes("FROM push_tokens WHERE dni = ANY")) {
          return {
            rows: [
              { dni: "44444444", token: "ExponentPushToken[obs1]", platform: "android" },
              { dni: "55555555", token: "ExponentPushToken[obs2]", platform: "android" },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    try {
      await notifyActiveObstetras(
        fakeDb as any,
        {
          title: "🚨 SOS",
          body: "Emergencia activada",
          channelId: "emergencias",
          sound: "sos.wav",
          priority: "high",
        },
        "99999999",
      );

      expect(sentBody).not.toBeNull();
      expect(sentBody.length).toBe(2);
      expect(sentBody[0].to).toBe("ExponentPushToken[obs1]");
      expect(sentBody[1].to).toBe("ExponentPushToken[obs2]");
      expect(sentBody[0].channelId).toBe("emergencias");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
