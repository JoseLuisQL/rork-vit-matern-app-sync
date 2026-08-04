/**
 * VITMATERNA — Cliente HTTP del servidor central.
 * Timeout corto para detectar rápido la falta de señal; los errores de red
 * se convierten en ApiError(status 0) que la app trata como "sin conexión".
 */

const BASE_URL =
  process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ?? "https://vit-matern-app-sync-backend.rork.app";

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

/**
 * URL de la foto de perfil de un usuario. La versión rompe el caché al
 * cambiar la foto; sin versión no hay foto y se muestra el icono por defecto.
 */
export function avatarUri(dni: string | undefined, version: number | undefined): string | undefined {
  if (!dni || !version) return undefined;
  return `${BASE_URL}/api/avatar/${dni}?v=${version}`;
}

interface ApiOptions {
  token?: string;
  body?: unknown;
  timeoutMs?: number;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
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
    throw new ApiError("No hay conexión con el servidor", 0);
  } finally {
    clearTimeout(timer);
  }
}
