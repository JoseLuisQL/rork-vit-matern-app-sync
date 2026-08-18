/**
 * VITMATERNA — Presencia de chat (en línea / última vez / escribiendo).
 * Datos efímeros por diseño: viven en la memoria del proceso, igual que en
 * el backend en la nube. Si el servidor se reinicia, todos aparecen "sin
 * conexión" unos segundos y se recupera solo con la siguiente sincronización
 * de cada teléfono (cada 2–4 s). No tiene sentido persistir esto en la base.
 */
import type { AppData, PresenceView, UserRecord } from "./types";

/** En línea si sincronizó hace menos de 15 s. */
const ONLINE_WINDOW_MS = 15_000;
/** "Escribiendo…" válido por 8 s desde el último aviso del teclado. */
const TYPING_WINDOW_MS = 8_000;

/** Aviso de presencia que el cliente adjunta a cada sincronización. */
export interface PresenceInput {
  convId?: string | null;
  typing?: boolean;
}

interface PresenceRecord {
  lastSeenISO: string;
  typingConvId: string | null;
  typingAtISO: string | null;
}

class PresenceTracker {
  private records = new Map<string, PresenceRecord>();

  /**
   * Marca al usuario como visto ahora. Si llega aviso de teclado, registra en
   * qué conversación escribe (la gestante solo puede escribir en la suya).
   */
  touch(user: UserRecord, typing?: PresenceInput): void {
    const nowISO = new Date().toISOString();
    const rec = this.records.get(user.dni) ?? {
      lastSeenISO: nowISO,
      typingConvId: null,
      typingAtISO: null,
    };
    rec.lastSeenISO = nowISO;
    if (typing !== undefined) {
      const convId = typeof typing.convId === "string" ? typing.convId : null;
      const allowed =
        user.role === "gestante" ? convId !== null && convId === (user.patientId ?? null) : true;
      if (typing.typing === true && convId !== null && allowed) {
        rec.typingConvId = convId;
        rec.typingAtISO = nowISO;
      } else {
        rec.typingConvId = null;
        rec.typingAtISO = null;
      }
    }
    this.records.set(user.dni, rec);
  }

  /** Estado combinado de uno o varios DNI respecto a una conversación. */
  private viewOf(dnis: string[], convId: string, nowMs: number): PresenceView {
    let lastSeenISO: string | null = null;
    let online = false;
    let typing = false;
    for (const dni of dnis) {
      const rec = this.records.get(dni);
      if (!rec) continue;
      if (lastSeenISO === null || rec.lastSeenISO > lastSeenISO) lastSeenISO = rec.lastSeenISO;
      if (nowMs - Date.parse(rec.lastSeenISO) <= ONLINE_WINDOW_MS) online = true;
      if (
        rec.typingConvId === convId &&
        rec.typingAtISO !== null &&
        nowMs - Date.parse(rec.typingAtISO) <= TYPING_WINDOW_MS
      ) {
        typing = true;
      }
    }
    return { online, lastSeenISO, typing };
  }

  /** Verifica si un usuario con DNI dado está en línea (sincronizó hace <15s). */
  isOnline(dni: string): boolean {
    const rec = this.records.get(dni);
    if (!rec) return false;
    return Date.now() - Date.parse(rec.lastSeenISO) <= ONLINE_WINDOW_MS;
  }

  /** Verifica si alguno de los DNI dados está en línea. */
  areAnyOnline(dnis: string[]): boolean {
    return dnis.some((dni) => this.isOnline(dni));
  }

  /**
   * Presencia visible por rol: la gestante ve al equipo obstétrico bajo la
   * clave "obstetra"; la obstetra (y admin) ve a cada gestante por el id de
   * su ficha, que es también el id de la conversación.
   */
  viewsFor(user: UserRecord, data: AppData): Record<string, PresenceView> {
    const nowMs = Date.now();
    const result: Record<string, PresenceView> = {};
    if (user.role === "gestante") {
      const obstetras = data.users
        .filter((u) => u.role === "obstetra" && u.active)
        .map((u) => u.dni);
      result.obstetra = this.viewOf(obstetras, user.patientId ?? "", nowMs);
    } else {
      data.patients.forEach((p) => {
        result[p.id] = this.viewOf([p.dni], p.id, nowMs);
      });
    }
    return result;
  }
}

export const presence = new PresenceTracker();
