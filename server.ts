import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { VitmaternaStore } from "./functions/store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const DIST_DIR = path.join(__dirname, "expo", "dist");

function ensureWebBuild(): void {
  const indexHtml = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexHtml)) {
    console.log("[VitMaterna] Building Expo Web bundle into expo/dist...");
    execSync("npm --workspace=expo run build:web", {
      cwd: __dirname,
      stdio: "inherit",
      env: {
        ...process.env,
        CI: "1",
        EXPO_NO_TELEMETRY: "1",
      },
    });
  }
  if (fs.existsSync(indexHtml)) {
    let html = fs.readFileSync(indexHtml, "utf-8");
    const webJsDir = path.join(DIST_DIR, "_expo", "static", "js", "web");
    if (fs.existsSync(webJsDir)) {
      const entryFile = fs.readdirSync(webJsDir).find((f) => f.startsWith("entry-") && f.endsWith(".js"));
      if (entryFile) {
        html = html.replace(/\/_expo\/static\/js\/web\/entry-[a-f0-9]+\.js/g, `/_expo/static/js/web/${entryFile}`);
      }
    }
    if (!html.includes('property="og:title"')) {
      const desc =
        "Plataforma digital de salud prenatal para gestantes de zonas rurales andinas (C.S. Talavera, Andahuaylas) con seguimiento de controles prenatales, suplementación, alertas clínicas y modo offline-first.";
      const metaTags = [
        `<title>VitMaterna</title>`,
        `<meta name="description" content="${desc}" />`,
        `<meta property="og:title" content="VitMaterna" />`,
        `<meta property="og:description" content="${desc}" />`,
      ].join("\n    ");
      html = html.replace("<title>VitMaterna</title>", metaTags);
    }
    fs.writeFileSync(indexHtml, html, "utf-8");
  }
}

ensureWebBuild();

const app = express();
const store = new VitmaternaStore();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-VM-Token", "x-vm-token", "Authorization"],
    maxAge: 86400,
  }),
);

app.use(express.json({ limit: "25mb" }));

app.get("/ping", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, db: true, mode: "in-memory", now: new Date().toISOString() });
});

app.get(["/manual-pruebas-issues-vitmaterna.pdf", "/api/manual-pdf"], (_req, res) => {
  const pdfPath = path.join(__dirname, "manual-pruebas-issues-vitmaterna.pdf");
  if (fs.existsSync(pdfPath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Manual_Pruebas_Issues_37_al_50_VitMaterna.pdf"',
    );
    res.sendFile(pdfPath);
    return;
  }
  res.status(404).json({ error: "Archivo PDF no encontrado" });
});

app.use("/api", async (req, res) => {
  try {
    const protocol = req.protocol || "http";
    const host = req.get("host") || `localhost:${PORT}`;
    const url = `${protocol}://${host}${req.originalUrl}`;

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(", "));
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
    const requestInit: RequestInit = {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    };

    const webRes = await store.fetch(new Request(url, requestInit));
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const buffer = Buffer.from(await webRes.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("[VitMaterna Server Error]", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Serve static assets from Expo web export
app.use(
  express.static(DIST_DIR, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// SPA fallback for Expo Router routes
app.use((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const indexHtml = path.join(DIST_DIR, "index.html");
  if (fs.existsSync(indexHtml)) {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexHtml);
  } else {
    res.status(503).send("Web build not found.");
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[VitMaterna] Servidor Web + API escuchando en http://${HOST}:${PORT}`);
});
