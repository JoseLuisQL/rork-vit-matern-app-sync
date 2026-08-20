/**
 * VITMATERNA — Servidor HTTP autoalojado (Bun + Hono + PostgreSQL 17).
 * Expone exactamente la misma API que el backend en la nube, por lo que la
 * app móvil se conecta sin ningún cambio (solo apuntando EXPO_PUBLIC_API_URL
 * a este servidor al compilar el APK).
 *
 * Orden de despacho (paridad con la nube):
 * 1. CORS y OPTIONS → 204.
 * 2. GET /ping y GET /health (verificación).
 * 3. GET /api/avatar/:dni (foto pública cacheable).
 * 4. /api/* solo acepta POST (405 en otro método).
 * 5. POST /api/login y /api/config son públicos.
 * 6. El resto exige sesión (X-VM-Token) y respeta el modo mantenimiento.
 */
import { Hono } from "hono";
import { migrate, pool, waitForDb } from "./db";
import {
  handleAdminConfig,
  handleAdminWhatsAppConfig,
  handleAdminWhatsAppSendTest,
  handleAdminWhatsAppTestConnection,
  handleAvatarImage,
  handleCreateUser,
  handleDeletePushToken,
  handleLogin,
  handlePublicConfig,
  handleRegisterPushToken,
  handleReset,
  handleSchedule,
  handleSetActive,
  handleSetAutoControls,
  handleSetAvatar,
  handleSync,
  handleUpdateProfile,
} from "./handlers";
import type { AppEnv } from "./handlers";
import { presence } from "./presence";
import { getUserByToken, loadConfig } from "./rows";
import { startScheduler } from "./scheduler";
import { DEFAULT_MAINTENANCE_MESSAGE, ensureSeeded } from "./seed";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-VM-Token",
  "Access-Control-Max-Age": "86400",
};

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  await next();
  Object.entries(CORS_HEADERS).forEach(([k, v]) => c.res.headers.set(k, v));
});

app.onError((err, c) => {
  console.error("[server] Error:", err instanceof Error ? err.stack : err);
  return c.json({ error: "Error interno del servidor" }, 500);
});

app.get("/ping", (c) => c.json({ ok: true, now: new Date().toISOString() }));

app.get("/health", async (c) => {
  try {
    await pool.query("SELECT 1");
    return c.json({ ok: true, db: true, now: new Date().toISOString() });
  } catch {
    return c.json({ ok: false, db: false }, 503);
  }
});

// Foto de perfil (pública, cacheable por versión).
app.get("/api/avatar/:dni", handleAvatarImage);

// La API es solo POST (paridad con el backend en la nube).
app.use("/api/*", async (c, next) => {
  if (c.req.method !== "POST") return c.json({ error: "Método no permitido" }, 405);
  await next();
});

// Rutas públicas (sin sesión).
app.post("/api/login", handleLogin);
app.post("/api/config", handlePublicConfig);

// Autenticación por token + presencia + puerta de mantenimiento.
app.use("/api/*", async (c, next) => {
  const token = c.req.header("x-vm-token");
  const user = token ? await getUserByToken(pool, token) : null;
  if (!user) {
    return c.json({ error: "Sesión inválida o cuenta desactivada" }, 401);
  }
  presence.touch(user);
  c.set("user", user);

  const { config } = await loadConfig(pool);
  c.set("config", config);

  // Mantenimiento activo: solo administración opera; la sincronización sigue
  // viva (sin aplicar cambios) para que el aviso llegue y se vaya en tiempo
  // real en todos los teléfonos.
  if (config.maintenance && user.role !== "admin" && c.req.path !== "/api/sync") {
    return c.json({ error: config.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE }, 503);
  }
  await next();
});

app.post("/api/sync", handleSync);
app.post("/api/schedule", handleSchedule);
app.post("/api/push-token", handleRegisterPushToken);
app.post("/api/push-token/delete", handleDeletePushToken);
app.post("/api/user/avatar", handleSetAvatar);
app.post("/api/user/profile", handleUpdateProfile);
app.post("/api/user/auto-controls", handleSetAutoControls);
app.post("/api/admin/create-user", handleCreateUser);
app.post("/api/admin/set-active", handleSetActive);
app.post("/api/admin/config", handleAdminConfig);
app.post("/api/admin/reset", handleReset);
app.post("/api/admin/whatsapp/config", handleAdminWhatsAppConfig);
app.post("/api/admin/whatsapp/test-connection", handleAdminWhatsAppTestConnection);
app.post("/api/admin/whatsapp/send-test", handleAdminWhatsAppSendTest);
app.all("/api/*", (c) => c.json({ error: "Ruta no encontrada" }, 404));

app.notFound((c) => c.json({ error: "not found" }, 404));

const port = Number(process.env.PORT ?? 8080);

await waitForDb();
await migrate();
await ensureSeeded();
startScheduler();
console.log(`[server] VitMaterna escuchando en el puerto ${port} (PostgreSQL listo)`);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
