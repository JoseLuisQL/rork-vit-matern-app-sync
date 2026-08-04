/**
 * VITMATERNA — Entrypoint del Worker.
 * Todas las rutas /api/* se despachan al Durable Object "VitmaternaStore"
 * (instancia única "main"), que es la fuente de verdad de la plataforma.
 */
export { VitmaternaStore } from "./store";

type Env = { DO: Fetcher };

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-VM-Token",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: Response): Response {
  const wrapped = new Response(res.body, res);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => wrapped.headers.set(k, v));
  return wrapped;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/ping") {
      return withCors(Response.json({ ok: true, now: new Date().toISOString() }));
    }

    if (url.pathname.startsWith("/api/")) {
      const wrapped = new Request(request.url, request);
      wrapped.headers.set("X-Rork-DO-Class", "VitmaternaStore");
      wrapped.headers.set("X-Rork-DO-Id", "main");
      const res = await env.DO.fetch(wrapped);
      return withCors(res);
    }

    return withCors(Response.json({ error: "not found" }, { status: 404 }));
  },
} satisfies ExportedHandler<Env>;
