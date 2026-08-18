/**
 * VITMATERNA — Cliente HTTP para Open-WA (@open-wa/wa-automate).
 * Conecta con el servidor en https://openwa.qware.me (o endpoints locales/dedicados)
 * para enviar mensajes, ubicaciones y verificar el estado de la sesión de WhatsApp.
 * Soporta la arquitectura multi-sesión moderna de Open-WA y la API REST clásica.
 */
import { formatPeruPhoneToJid } from "./formatter";
import type {
  WhatsAppConfig,
  WhatsAppSendResult,
  WhatsAppStatusResult,
} from "./types";

/** Timeout por defecto para llamadas a la API de WhatsApp (8 segundos). */
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Realiza una petición HTTP fetch con timeout seguro.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Genera los encabezados de autenticación compatibles con Open-WA.
 */
function getAuthHeaders(config: WhatsAppConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-API-Key": config.apiKey,
    "api_key": config.apiKey,
    "Authorization": `Bearer ${config.apiKey}`,
  };
}

/**
 * Resuelve la lista de endpoints candidatos para enviar mensajes de texto.
 */
function getTextEndpoints(config: WhatsAppConfig): string[] {
  const cleanBase = config.serverUrl.replace(/\/+$/, "");
  const apiBase = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
  const endpoints: string[] = [];

  if (config.sessionId?.trim()) {
    const session = encodeURIComponent(config.sessionId.trim());
    endpoints.push(`${apiBase}/sessions/${session}/messages/send-text`);
    endpoints.push(`${cleanBase}/sessions/${session}/messages/send-text`);
  }
  endpoints.push(`${cleanBase}/sendText`);
  endpoints.push(`${apiBase}/sendText`);

  return Array.from(new Set(endpoints));
}

/**
 * Resuelve la lista de endpoints candidatos para enviar ubicaciones GPS.
 */
function getLocationEndpoints(config: WhatsAppConfig): string[] {
  const cleanBase = config.serverUrl.replace(/\/+$/, "");
  const apiBase = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
  const endpoints: string[] = [];

  if (config.sessionId?.trim()) {
    const session = encodeURIComponent(config.sessionId.trim());
    endpoints.push(`${apiBase}/sessions/${session}/messages/send-location`);
    endpoints.push(`${cleanBase}/sessions/${session}/messages/send-location`);
  }
  endpoints.push(`${cleanBase}/sendLocation`);
  endpoints.push(`${apiBase}/sendLocation`);

  return Array.from(new Set(endpoints));
}

/**
 * Resuelve la lista de endpoints candidatos para verificar estado/sesión.
 */
function getConnectionTestEndpoints(config: WhatsAppConfig): string[] {
  const cleanBase = config.serverUrl.replace(/\/+$/, "");
  const apiBase = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
  const endpoints: string[] = [];

  if (config.sessionId?.trim()) {
    const session = encodeURIComponent(config.sessionId.trim());
    endpoints.push(`${apiBase}/sessions/${session}`);
    endpoints.push(`${cleanBase}/sessions/${session}`);
  }
  endpoints.push(`${apiBase}/sessions`);
  endpoints.push(`${cleanBase}/sessions`);
  endpoints.push(`${cleanBase}/getConnectionState`);
  endpoints.push(`${cleanBase}/getHostNumber`);
  endpoints.push(`${cleanBase}/getBatteryLevel`);
  endpoints.push(`${cleanBase}/getMe`);
  endpoints.push(`${apiBase}/health`);
  endpoints.push(`${cleanBase}/health`);

  return Array.from(new Set(endpoints));
}

/**
 * Envía un mensaje de texto plano o enriquecido a un número de WhatsApp.
 */
export async function sendWhatsAppText(
  config: WhatsAppConfig,
  phone: string | null | undefined,
  text: string,
): Promise<WhatsAppSendResult> {
  if (!config.enabled) {
    return { ok: false, skipped: true, error: "WhatsApp deshabilitado globalmente" };
  }
  if (!config.apiKey || !config.serverUrl) {
    return { ok: false, skipped: true, error: "Servidor Open-WA o API Key no configurados" };
  }
  const jid = formatPeruPhoneToJid(phone);
  if (!jid) {
    return { ok: false, error: `Número de teléfono no válido: ${phone ?? "vacío"}` };
  }
  const cleanText = text.trim();
  if (!cleanText) {
    return { ok: false, error: "Mensaje de texto vacío" };
  }

  const headers = getAuthHeaders(config);
  const endpoints = getTextEndpoints(config);
  let lastError = "No se pudo entregar el mensaje";

  for (const endpoint of endpoints) {
    try {
      // DTO estricto según la ruta de Open-WA
      const isModernSessionApi = endpoint.includes("/messages/send-text");
      const payload = isModernSessionApi
        ? {
            chatId: jid,
            text: cleanText,
          }
        : {
            to: jid,
            content: cleanText,
            chatId: jid,
            text: cleanText,
            args: {
              to: jid,
              content: cleanText,
            },
          };

      const res = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          messageId?: string;
          id?: string;
          response?: string | boolean;
        };
        const messageId =
          typeof data.messageId === "string"
            ? data.messageId
            : typeof data.id === "string"
              ? data.id
              : undefined;

        return { ok: true, messageId };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: `API Key incorrecta o no autorizada en Open-WA (HTTP ${res.status})`,
        };
      }

      const errBody = await res.text().catch(() => "");
      lastError = `HTTP ${res.status}: ${errBody.slice(0, 150)}`;

      if (res.status === 404) {
        continue;
      }

      console.warn(`[whatsapp] Fallo en endpoint ${endpoint} para ${jid} (HTTP ${res.status}):`, errBody);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = `Fallo de red: ${message}`;
    }
  }

  return { ok: false, error: lastError };
}

/**
 * Envía una ubicación GPS a través de Open-WA.
 */
export async function sendWhatsAppLocation(
  config: WhatsAppConfig,
  phone: string | null | undefined,
  lat: number,
  lng: number,
  title: string,
  subtitle?: string,
): Promise<WhatsAppSendResult> {
  if (!config.enabled || !config.apiKey || !config.serverUrl) {
    return { ok: false, skipped: true, error: "WhatsApp deshabilitado o sin configurar" };
  }
  const jid = formatPeruPhoneToJid(phone);
  if (!jid) {
    return { ok: false, error: `Número de teléfono no válido: ${phone ?? "vacío"}` };
  }

  const headers = getAuthHeaders(config);
  const endpoints = getLocationEndpoints(config);
  let lastError = "No se pudo enviar la ubicación";

  for (const endpoint of endpoints) {
    try {
      const isModernSessionApi = endpoint.includes("/messages/send-location");
      const payload = isModernSessionApi
        ? {
            chatId: jid,
            latitude: lat,
            longitude: lng,
            ...(title ? { description: title } : {}),
            ...(subtitle ? { address: subtitle } : {}),
          }
        : {
            to: jid,
            latitude: lat,
            longitude: lng,
            title,
            subtitle: subtitle ?? "VitMaterna Emergencias",
            chatId: jid,
            description: title,
            args: {
              to: jid,
              latitude: lat,
              longitude: lng,
              title,
              subtitle: subtitle ?? "VitMaterna Emergencias",
            },
          };

      const res = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          messageId?: string;
          id?: string;
        };
        const messageId =
          typeof data.messageId === "string"
            ? data.messageId
            : typeof data.id === "string"
              ? data.id
              : undefined;

        return { ok: true, messageId };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: `API Key incorrecta o no autorizada en Open-WA (HTTP ${res.status})`,
        };
      }

      const errBody = await res.text().catch(() => "");
      lastError = `HTTP ${res.status}: ${errBody.slice(0, 150)}`;

      if (res.status === 404) {
        continue;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = `Fallo de red: ${message}`;
    }
  }

  return { ok: false, error: lastError };
}

/**
 * Verifica la conectividad y estado de la sesión de WhatsApp en el servidor Open-WA.
 */
export async function testWhatsAppConnection(
  config: WhatsAppConfig,
): Promise<WhatsAppStatusResult> {
  const baseUrl = config.serverUrl?.replace(/\/+$/, "") || "";
  if (!baseUrl) {
    return {
      ok: false,
      status: "unconfigured",
      error: "No se ha configurado la URL del servidor Open-WA",
    };
  }
  if (!config.apiKey) {
    return {
      ok: false,
      status: "unconfigured",
      error: "No se ha ingresado la API Key de Open-WA",
    };
  }

  const headers = getAuthHeaders(config);
  const testEndpoints = getConnectionTestEndpoints(config);
  let lastError = "No se pudo conectar";

  for (const endpoint of testEndpoints) {
    try {
      const res = await fetchWithTimeout(endpoint, { method: "GET", headers }, 5000);
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

        // Caso 1: Objeto de sesión individual de Open-WA multi-sesión
        if (body && typeof body === "object" && "id" in body && "status" in body) {
          const sessionStatus = String(body.status);
          const pushName = typeof body.pushName === "string" ? body.pushName : "";
          const phone = typeof body.phone === "string" ? body.phone : "";
          const name = typeof body.name === "string" ? body.name : "";
          const who = pushName ? `${pushName} (${phone || name})` : phone || name || "WhatsApp";

          if (sessionStatus === "ready" || sessionStatus === "connected" || sessionStatus === "inChat") {
            return {
              ok: true,
              status: "connected",
              serverUrl: baseUrl,
              details: `Sesión activa (${who})`,
            };
          } else if (sessionStatus === "disconnected") {
            return {
              ok: false,
              status: "disconnected",
              serverUrl: baseUrl,
              error: `La sesión ${name || config.sessionId} está desconectada en Open-WA`,
            };
          } else if (sessionStatus === "qr") {
            return {
              ok: false,
              status: "disconnected",
              serverUrl: baseUrl,
              error: `La sesión ${name || config.sessionId} requiere escanear código QR`,
            };
          }
        }

        // Caso 2: Lista de sesiones de Open-WA multi-sesión
        if (Array.isArray(body)) {
          const match = body.find(
            (s: unknown) =>
              s &&
              typeof s === "object" &&
              "id" in s &&
              (s.id === config.sessionId || (s as { name?: string }).name === config.sessionId),
          ) as { status?: string; pushName?: string; phone?: string; name?: string } | undefined;

          if (match) {
            const isReady = match.status === "ready" || match.status === "connected";
            const who = match.pushName
              ? `${match.pushName} (${match.phone || match.name})`
              : match.phone || match.name || "WhatsApp";

            if (isReady) {
              return {
                ok: true,
                status: "connected",
                serverUrl: baseUrl,
                details: `Sesión activa (${who})`,
              };
            } else {
              return {
                ok: false,
                status: "disconnected",
                serverUrl: baseUrl,
                error: `Sesión en estado: ${match.status}`,
              };
            }
          }

          // Si hay alguna sesión activa en la lista
          const anyReady = body.some(
            (s: unknown) =>
              s && typeof s === "object" && "status" in s && ((s as { status: string }).status === "ready" || (s as { status: string }).status === "connected"),
          );
          if (anyReady) {
            return {
              ok: true,
              status: "connected",
              serverUrl: baseUrl,
              details: `Servidor conectado (${body.length} sesiones)`,
            };
          }
        }

        // Caso 3: API clásica Open-WA (@open-wa/wa-automate standalone)
        const stateStr =
          typeof body.response === "string"
            ? body.response
            : typeof body.state === "string"
              ? body.state
              : typeof body.status === "string"
                ? body.status
                : "CONNECTED";

        return {
          ok: true,
          status: "connected",
          serverUrl: baseUrl,
          battery: typeof body.battery === "number" ? body.battery : null,
          details: `Sesión activa (${stateStr})`,
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          status: "error",
          serverUrl: baseUrl,
          error: "API Key incorrecta o no autorizada en el servidor Open-WA",
        };
      } else if (res.status === 404) {
        // Continuamos con el siguiente endpoint de prueba
        continue;
      } else {
        lastError = `HTTP ${res.status}: ${await res.text().catch(() => "")}`;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    ok: false,
    status: "disconnected",
    serverUrl: baseUrl,
    error: `Servidor inaccesible: ${lastError}`,
  };
}
