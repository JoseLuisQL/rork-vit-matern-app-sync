import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire("/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js");
const { chromium } = require("playwright");

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve("expo/assets/manual-screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * Inyecta un marcador visual numerado (1, 2, 3) y un borde resaltado sobre un elemento del DOM real
 * para que la captura de pantalla del frontend muestre exactamente dónde hacer clic.
 */
async function highlightTextInPage(page, searchText, badgeNumber, options = {}) {
  await page.evaluate(
    ({ text, num, opts }) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let targetEl = null;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeValue && node.nodeValue.includes(text)) {
          let el = node.parentElement;
          if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
            targetEl = el;
            break;
          }
        }
      }
      if (!targetEl) return;

      let boxEl = targetEl;
      for (let i = 0; i < (opts.climb ?? 1); i++) {
        if (
          boxEl.parentElement &&
          boxEl.parentElement.offsetWidth < window.innerWidth * 0.92 &&
          boxEl.parentElement.offsetHeight < window.innerHeight * 0.65
        ) {
          boxEl = boxEl.parentElement;
        }
      }

      if (opts.scroll) {
        boxEl.scrollIntoView({ behavior: "instant", block: opts.block || "center" });
      }

      const rect = boxEl.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.className = "vm-manual-callout";
      overlay.style.cssText = `
        position: fixed;
        left: ${Math.max(4, rect.left - 4)}px;
        top: ${Math.max(4, rect.top - 4)}px;
        width: ${Math.min(window.innerWidth - 8, rect.width + 8)}px;
        height: ${rect.height + 8}px;
        border: 3px solid #E11D48;
        border-radius: 12px;
        box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.18);
        pointer-events: none;
        z-index: 999998;
      `;
      document.body.appendChild(overlay);

      const badge = document.createElement("div");
      badge.className = "vm-manual-callout";
      badge.textContent = String(num);
      badge.style.cssText = `
        position: fixed;
        left: ${Math.min(window.innerWidth - 36, Math.max(8, rect.right - 14))}px;
        top: ${Math.max(8, rect.top - 14)}px;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: #E11D48;
        color: #FFFFFF;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 800;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #FFFFFF;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        pointer-events: none;
        z-index: 999999;
      `;
      document.body.appendChild(badge);
    },
    { text: searchText, num: badgeNumber, opts: options },
  );
}

async function clearCallouts(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".vm-manual-callout").forEach((el) => el.remove());
  });
}

async function loginWithDni(page, dni, password = "Test@1234") {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const inputs = page.locator("input");
  await inputs.nth(0).fill(dni);
  await inputs.nth(1).fill(password);
  await page.getByText("Entrar", { exact: true }).first().click();
  await page.waitForTimeout(2000);
}

async function captureJpegBase64(page, issueNum) {
  const filePath = path.join(OUT_DIR, `issue-${issueNum}.jpg`);
  const buf = await page.screenshot({
    path: filePath,
    type: "jpeg",
    quality: 84,
  });
  console.log(`[Capture] Issue #${issueNum} saved (${Math.round(buf.length / 1024)} KB)`);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const screenshots = {};

  // =========================================================================
  // 1. SESIÓN OBSTETRA EN ESCRITORIO (Issues #37, #46, #44, #49, #39, #42, #40, #48, #50)
  // =========================================================================
  const deskContext = await browser.newContext({
    viewport: { width: 1180, height: 740 },
    deviceScaleFactor: 1.5,
  });
  const page = await deskContext.newPage();

  console.log("Logging in as Obstetra Carmen Rojas (11111111)...");
  await loginWithDni(page, "11111111");

  // --- ISSUE #37: Persistencia de sesión al cambiar de ventana o recargar ---
  await page.goto(`${BASE_URL}/(obstetra)/(tabs)/gestantes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await highlightTextInPage(page, "Gestantes", 1, { climb: 1 });
  await highlightTextInPage(page, "Ana Quispe Mamani", 2, { climb: 2 });
  screenshots[37] = await captureJpegBase64(page, 37);
  await clearCallouts(page);

  // --- ISSUE #46: Filtrado exclusivo de Gestantes por Obstetra asignado ---
  await highlightTextInPage(page, "6 en seguimiento", 1, { climb: 1 });
  await highlightTextInPage(page, "Ana Quispe Mamani", 2, { climb: 2 });
  screenshots[46] = await captureJpegBase64(page, 46);
  await clearCallouts(page);

  // --- ISSUE #44: Fecha Probable de Parto (FPP) destacada en el perfil ---
  await page.goto(`${BASE_URL}/(obstetra)/gestante/p-ana`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  await highlightTextInPage(page, "Fecha Probable de Parto (FPP)", 1, { climb: 2, scroll: true });
  screenshots[44] = await captureJpegBase64(page, 44);
  await clearCallouts(page);

  // --- ISSUE #49: Asignación de contenido educativo multimedia ---
  await page.getByText("Educación", { exact: true }).first().click();
  await page.waitForTimeout(1200);
  await highlightTextInPage(page, "Alimentación en el embarazo", 1, { climb: 2 });
  await highlightTextInPage(page, "Signos de alarma", 2, { climb: 2 });
  screenshots[49] = await captureJpegBase64(page, 49);
  await clearCallouts(page);

  // Volver a la ficha de gestante
  await page.goto(`${BASE_URL}/(obstetra)/gestante/p-ana`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // --- ISSUE #39: Opción para eliminar gestantes con confirmación ---
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue?.includes("Eliminar gestante")) {
        walker.currentNode.parentElement?.scrollIntoView({ behavior: "instant", block: "center" });
        break;
      }
    }
  });
  await page.waitForTimeout(600);
  await highlightTextInPage(page, "Eliminar gestante", 1, { climb: 1 });
  await page.getByText("Eliminar gestante", { exact: false }).first().click();
  await page.waitForTimeout(800);
  await highlightTextInPage(page, "Cancelar", 2, { climb: 2 });
  screenshots[39] = await captureJpegBase64(page, 39);
  await clearCallouts(page);

  // --- ISSUE #42: Cambio de etiqueta 'Comunidad' por 'Dirección' ---
  await page.goto(`${BASE_URL}/(obstetra)/nueva-gestante`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await highlightTextInPage(page, "Dirección", 1, { climb: 2, scroll: true });
  screenshots[42] = await captureJpegBase64(page, 42);
  await clearCallouts(page);

  // --- ISSUE #40: Cálculo automático del IMC a partir de Peso y Talla ---
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input"));
    const pesoInput = inputs.find((i) => i.placeholder?.includes("58"));
    const tallaInput = inputs.find((i) => i.placeholder?.includes("1.55"));
    const setNativeValue = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    if (pesoInput) setNativeValue(pesoInput, "60");
    if (tallaInput) setNativeValue(tallaInput, "1.55");
  });
  await page.waitForTimeout(800);
  await highlightTextInPage(page, "Peso (kg)", 1, { climb: 2, scroll: true });
  await highlightTextInPage(page, "IMC calculado automáticamente", 2, { climb: 1 });
  screenshots[40] = await captureJpegBase64(page, 40);
  await clearCallouts(page);

  // --- ISSUE #48: Calendario mensual completo para programar citas futuras ---
  await page.goto(`${BASE_URL}/(obstetra)/programar?patientId=p-ana`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cita-calendario"]');
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "center" });
      el.click();
    }
  });
  await page.waitForTimeout(900);
  await highlightTextInPage(page, "Selecciona el día en el calendario", 1, { climb: 2 });
  await highlightTextInPage(page, "Confirmar", 2, { climb: 1 });
  screenshots[48] = await captureJpegBase64(page, 48);
  await clearCallouts(page);

  // --- ISSUE #50: Horario ampliado y hora personalizada (HH:MM) ---
  await page.goto(`${BASE_URL}/(obstetra)/programar?patientId=p-ana`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const customInput =
      document.querySelector('[data-testid="input-hora-personalizada"]') ||
      Array.from(document.querySelectorAll("input")).find((i) => i.placeholder?.includes("07:30"));
    if (customInput) {
      customInput.scrollIntoView({ behavior: "instant", block: "center" });
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(customInput, "07:45");
      customInput.dispatchEvent(new Event("input", { bubbles: true }));
      customInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.waitForTimeout(800);
  await highlightTextInPage(page, "¿Prefieres ingresar otra hora personalizada?", 1, {
    climb: 2,
    scroll: true,
  });
  await highlightTextInPage(page, "07:45", 2, { climb: 1 });
  screenshots[50] = await captureJpegBase64(page, 50);
  await clearCallouts(page);

  await deskContext.close();

  // =========================================================================
  // 2. SESIÓN ADMINISTRADOR EN ESCRITORIO (Issues #38, #43, #45)
  // =========================================================================
  const adminContext = await browser.newContext({
    viewport: { width: 1180, height: 740 },
    deviceScaleFactor: 1.5,
  });
  const adminPage = await adminContext.newPage();

  console.log("Logging in as Admin Patricia Salas (22222222)...");
  await loginWithDni(adminPage, "22222222");

  // --- ISSUE #38: Relación entre Obstetra y Gestante (Selector Obstetra responsable) ---
  await adminPage.goto(`${BASE_URL}/(admin)/nuevo-usuario`, { waitUntil: "networkidle" });
  await adminPage.waitForTimeout(1500);
  await adminPage.getByText("Carmen Rojas Paredes", { exact: false }).first().click();
  await adminPage.waitForTimeout(500);
  await highlightTextInPage(adminPage, "Asigna la obstetra que realizará el seguimiento", 1, {
    climb: 2,
    scroll: true,
  });
  screenshots[38] = await captureJpegBase64(adminPage, 38);
  await clearCallouts(adminPage);

  // --- ISSUE #43: Eliminación de usuarios en Administración sin error 404 ---
  await adminPage.goto(`${BASE_URL}/(admin)/(tabs)/usuarios`, { waitUntil: "networkidle" });
  await adminPage.waitForTimeout(1500);
  await highlightTextInPage(adminPage, "Marco Huamán Quispe", 1, { climb: 2 });
  await highlightTextInPage(adminPage, "Carmen Rojas Paredes", 2, { climb: 2 });
  screenshots[43] = await captureJpegBase64(adminPage, 43);
  await clearCallouts(adminPage);

  // --- ISSUE #45: Integración de WhatsApp (Open-WA) con resolución automática de sesión ---
  await adminPage.goto(`${BASE_URL}/(admin)/(tabs)/sistema`, { waitUntil: "networkidle" });
  await adminPage.waitForTimeout(1500);
  await highlightTextInPage(adminPage, "URL del Servidor Open-WA", 1, {
    climb: 2,
    scroll: true,
  });
  await highlightTextInPage(adminPage, "Probar conexión", 2, { climb: 1 });
  screenshots[45] = await captureJpegBase64(adminPage, 45);
  await clearCallouts(adminPage);

  await adminContext.close();

  // =========================================================================
  // 3. VISTA MÓVIL REAL (410 x 760) PARA ISSUES MÓVILES (#41 y #47)
  // =========================================================================
  const mobileContext = await browser.newContext({
    viewport: { width: 410, height: 760 },
    deviceScaleFactor: 2,
  });
  const mobPage = await mobileContext.newPage();

  console.log("Capturing Mobile view for Issue #41 (Obstetra Stepper)...");
  await loginWithDni(mobPage, "11111111");
  await mobPage.goto(`${BASE_URL}/(obstetra)/actualizar-datos?id=p-ana`, {
    waitUntil: "networkidle",
  });
  await mobPage.waitForTimeout(1600);
  await highlightTextInPage(mobPage, "Gestaciones", 1, { climb: 2, scroll: true });
  await highlightTextInPage(mobPage, "Cesáreas", 2, { climb: 2 });
  await highlightTextInPage(mobPage, "Abortos", 3, { climb: 2 });
  screenshots[41] = await captureJpegBase64(mobPage, 41);
  await clearCallouts(mobPage);

  console.log("Capturing Mobile view for Issue #47 (Gestante Chat KeyboardAvoidingView)...");
  await loginWithDni(mobPage, "33333333");
  await mobPage.goto(`${BASE_URL}/(gestante)/(tabs)/chat`, { waitUntil: "networkidle" });
  await mobPage.waitForTimeout(1500);
  await mobPage.evaluate(() => {
    const input = document.querySelector("textarea, input");
    if (input) {
      input.focus();
      const setter =
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "Hola obstetra Carmen, ya tomé mi hierro hoy");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await mobPage.waitForTimeout(600);
  await highlightTextInPage(mobPage, "Hola obstetra Carmen", 1, { climb: 2 });
  screenshots[47] = await captureJpegBase64(mobPage, 47);
  await clearCallouts(mobPage);

  await mobileContext.close();
  await browser.close();

  // Generar módulo TypeScript con las capturas reales codificadas en Base64
  const tsFile = path.resolve("expo/lib/manualScreenshotsData.ts");
  const lines = [
    "/**",
    " * Capturas de pantalla reales del frontend de VitMaterna (generadas con Playwright/Chromium)",
    " * para los Issues #37 al #50 con marcadores visuales numerados.",
    " */",
    "export const REAL_ISSUE_SCREENSHOTS: Record<number, string> = {",
  ];
  for (const [num, dataUri] of Object.entries(screenshots)) {
    lines.push(`  ${num}: "${dataUri}",`);
  }
  lines.push("};\n");
  fs.writeFileSync(tsFile, lines.join("\n"), "utf-8");
  console.log(`Generated ${tsFile} with ${Object.keys(screenshots).length} real screenshots!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
