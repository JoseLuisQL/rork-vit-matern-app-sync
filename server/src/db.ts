/**
 * VITMATERNA — Conexión a PostgreSQL 17 (pool) y ejecutor de migraciones.
 * Los parsers convierten los tipos de PostgreSQL al formato exacto que
 * espera la app: DATE → 'YYYY-MM-DD', TIMESTAMPTZ → ISO 8601, NUMERIC → número.
 */
import pg from "pg";
import type { PoolClient } from "pg";
import { MIGRATIONS } from "./schema";

const { Pool, types: pgTypes } = pg;

// DATE → clave de día 'YYYY-MM-DD' tal cual (sin conversiones de zona horaria).
pgTypes.setTypeParser(1082, (v: string) => v);
// TIMESTAMPTZ → cadena ISO 8601 (igual que new Date().toISOString()).
pgTypes.setTypeParser(1184, (v: string) => new Date(v).toISOString());
// NUMERIC → número (hemoglobina, IMC).
pgTypes.setTypeParser(1700, (v: string) => parseFloat(v));
// BIGINT → número (columnas seq; rangos pequeños en esta aplicación).
pgTypes.setTypeParser(20, (v: string) => parseInt(v, 10));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "[db] Falta DATABASE_URL. Ejemplo: postgres://vitmaterna:CLAVE@localhost:5432/vitmaterna",
  );
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  max: 10,
  // Para PostgreSQL gestionado externo con TLS: DATABASE_SSL=true
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("[db] Error en conexión inactiva del pool:", err.message);
});

/** Cualquier ejecutor de consultas: el pool o un cliente dentro de transacción. */
export type Queryable = Pick<PoolClient, "query">;

/** Ejecuta `fn` dentro de una transacción (COMMIT/ROLLBACK automáticos). */
export async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // la conexión pudo haberse caído; el release la descarta
    }
    throw e;
  } finally {
    client.release();
  }
}

/** Espera a que PostgreSQL acepte conexiones (arranques con docker compose). */
export async function waitForDb(timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (e) {
      if (Date.now() - start > timeoutMs) throw e;
      console.log("[db] Esperando a PostgreSQL…");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

/** Aplica las migraciones pendientes exactamente una vez (con candado). */
export async function migrate(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );
  await withTx(async (client) => {
    // Candado de transacción: si hay varias instancias, migra solo una.
    await client.query("SELECT pg_advisory_xact_lock(727856)");
    for (const migration of MIGRATIONS) {
      const done = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [
        migration.id,
      ]);
      if ((done.rowCount ?? 0) > 0) continue;
      await client.query(migration.sql);
      await client.query("INSERT INTO schema_migrations (id, name) VALUES ($1, $2)", [
        migration.id,
        migration.name,
      ]);
      console.log(`[db] Migración aplicada: ${migration.id} (${migration.name})`);
    }
  });
}
