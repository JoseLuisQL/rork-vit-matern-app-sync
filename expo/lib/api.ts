/**
 * VITMATERNA — Cliente HTTP del servidor central.
 * Timeout corto para detectar rápido la falta de señal; los errores de red
 * se convierten en ApiError(status 0) que la app trata como "sin conexión".
 *
 * Orden de conexión:
 * 1. EXPO_PUBLIC_RORK_FUNCTIONS_URL — backend en la nube de Rork (vista previa).
 * 2. EXPO_PUBLIC_API_URL — backend propio autoalojado (VPS con PostgreSQL;
 *    defínela en expo/.env al compilar tu APK; ver server/README.md).
 * 3. Web sin variables: el MISMO dominio desde el que se sirve la página —
 *    así funciona la versión web del docker compose (nginx pasa /api a la API).
 * 4. URL fija del backend en la nube (respaldo).
 */
import { Platform } from "react-native";

export function resolveBaseUrl(): string {
  const rorkCloud = process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL?.trim();
  if (rorkCloud) return rorkCloud.replace(/\/+$/, "");

  // Si estamos en entorno web en localhost (ej. Expo Web en localhost:8081)
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
    window.location.port !== "8080"
  ) {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  const selfHosted = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (selfHosted) return selfHosted.replace(/\/+$/, "");

  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location?.origin?.startsWith("http")
  ) {
    return window.location.origin;
  }
  return "https://vit-matern-app-sync-backend.rork.app";
}

export class ApiError extends Error {
  status: number;
  freeSlots?: string[];

  constructor(message: string, status: number, freeSlots?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.freeSlots = freeSlots;
  }
}

export function isOfflineError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 0;
}

export function avatarUri(dni: string | undefined, version: number | undefined | null): string | undefined {
  if (!dni || version === undefined || version === null) return undefined;
  return `${resolveBaseUrl()}/api/avatar/${dni}?v=${version}`;
}

interface ApiOptions {
  token?: string;
  body?: unknown;
  timeoutMs?: number;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { "X-VM-Token": options.token } : {}),
      },
      body: JSON.stringify(options.body ?? {}),
      signal: controller.signal,
    });
    let data: { error?: string; freeSlots?: string[] } = {};
    try {
      data = (await res.json()) as { error?: string; freeSlots?: string[] };
    } catch {
      data = {};
    }
    if (!res.ok) {
      throw new ApiError(data.error ?? `Error del servidor (${res.status})`, res.status, data.freeSlots);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error("[VitMaterna API Error]", e, `URL intentada: ${baseUrl}${path}`);
    throw new ApiError("No hay conexión con el servidor", 0);
  } finally {
    clearTimeout(timer);
  }
}
