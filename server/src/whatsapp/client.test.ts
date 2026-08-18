import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  sendWhatsAppLocation,
  sendWhatsAppText,
  testWhatsAppConnection,
} from "./client";
import type { WhatsAppConfig } from "./types";

const activeConfig: WhatsAppConfig = {
  enabled: true,
  serverUrl: "https://openwa.qware.me",
  apiKey: "secret_token_123",
  sessionId: "8da91c81-66f5-49ec-8231-4b4e09c89f12",
  notifyAppointments: true,
  notifySupplements: true,
  remindAppointments: true,
  remindSupplements: true,
  chatOfflineFallback: true,
  sosOfflineAlerts: true,
  updatedAtISO: new Date().toISOString(),
};

const originalFetch = globalThis.fetch;

describe("WhatsApp Client — Open-WA HTTP Service", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("skips sending if WhatsApp is disabled in configuration", async () => {
    const disabledConfig = { ...activeConfig, enabled: false };
    const res = await sendWhatsAppText(disabledConfig, "987654321", "Hola");
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe(true);
  });

  it("skips sending if API key or server URL are missing", async () => {
    const noKeyConfig = { ...activeConfig, apiKey: "" };
    const res = await sendWhatsAppText(noKeyConfig, "987654321", "Hola");
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe(true);
  });

  it("fails gracefully if phone number is invalid", async () => {
    const res = await sendWhatsAppText(activeConfig, "123", "Hola");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("no válido");
  });

  it("sends text message successfully to modern multi-session Open-WA endpoint (201 Created)", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    let capturedApiKey = "";
    let capturedXApiKey = "";

    globalThis.fetch = mock(async (url, init) => {
      capturedUrl = String(url);
      capturedBody = String(init?.body);
      const headers = init?.headers as Record<string, string>;
      capturedApiKey = String(headers?.api_key);
      capturedXApiKey = String(headers?.["X-API-Key"]);
      return new Response(
        JSON.stringify({
          messageId: "true_102650087514262@lid_3EB08E89423D20F9915771_out",
          timestamp: 1787015181,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as unknown as typeof fetch;

    const res = await sendWhatsAppText(activeConfig, "987654321", "Mensaje de prueba");
    expect(res.ok).toBe(true);
    expect(res.messageId).toBe("true_102650087514262@lid_3EB08E89423D20F9915771_out");
    expect(capturedUrl).toContain("/api/sessions/8da91c81-66f5-49ec-8231-4b4e09c89f12/messages/send-text");
    expect(capturedApiKey).toBe("secret_token_123");
    expect(capturedXApiKey).toBe("secret_token_123");
    expect(capturedBody).toContain("51987654321@c.us");
    expect(capturedBody).toContain("Mensaje de prueba");
  });

  it("falls back to standalone /sendText if multi-session endpoint returns 404", async () => {
    const requestedUrls: string[] = [];

    globalThis.fetch = mock(async (url) => {
      const urlStr = String(url);
      requestedUrls.push(urlStr);
      if (urlStr.includes("/messages/send-text")) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response(JSON.stringify({ response: true, id: "msg-fallback" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const res = await sendWhatsAppText(activeConfig, "987654321", "Mensaje con fallback");
    expect(res.ok).toBe(true);
    expect(res.messageId).toBe("msg-fallback");
    expect(requestedUrls.length).toBeGreaterThan(1);
    expect(requestedUrls[requestedUrls.length - 1]).toContain("/sendText");
  });

  it("handles HTTP 401 error gracefully without throwing exceptions", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("Unauthorized error", { status: 401 });
    }) as unknown as typeof fetch;

    const res = await sendWhatsAppText(activeConfig, "987654321", "Hola");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("401");
  });

  it("sends GPS location successfully via modern multi-session endpoint", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    globalThis.fetch = mock(async (url, init) => {
      capturedUrl = String(url);
      capturedBody = String(init?.body);
      return new Response(JSON.stringify({ messageId: "loc-msg-123" }), { status: 201 });
    }) as unknown as typeof fetch;

    const res = await sendWhatsAppLocation(
      activeConfig,
      "987654321",
      -13.6543,
      -73.3512,
      "Emergencia VitMaterna",
      "Puesto de salud",
    );
    expect(res.ok).toBe(true);
    expect(res.messageId).toBe("loc-msg-123");
    expect(capturedUrl).toContain("/messages/send-location");
    expect(capturedBody).toContain("-13.6543");
  });

  it("tests Open-WA connection successfully with multi-session status object", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          id: "8da91c81-66f5-49ec-8231-4b4e09c89f12",
          name: "prod",
          status: "ready",
          phone: "51950328511",
          pushName: "DKB",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const status = await testWhatsAppConnection(activeConfig);
    expect(status.ok).toBe(true);
    expect(status.status).toBe("connected");
    expect(status.details).toContain("DKB");
  });

  it("tests Open-WA connection successfully with legacy status response", async () => {
    globalThis.fetch = mock(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/sessions/")) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response(
        JSON.stringify({ response: "CONNECTED", battery: 95 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const status = await testWhatsAppConnection({ ...activeConfig, sessionId: "" });
    expect(status.ok).toBe(true);
    expect(status.status).toBe("connected");
    expect(status.battery).toBe(95);
  });
});
