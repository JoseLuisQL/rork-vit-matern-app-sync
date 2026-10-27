import { describe, expect, it } from "bun:test";
import fs from "fs";
import path from "path";
import { generateManualTestingPdfDoc, ISSUES_MANUAL_DATA } from "./manualTestingPdf";

describe("Manual de Pruebas Manuales (PDF) — Issues #37 al #50", () => {
  it("contiene las 14 fichas completas desde el Issue #37 hasta el #50", () => {
    expect(ISSUES_MANUAL_DATA.length).toBe(14);
    const numbers = ISSUES_MANUAL_DATA.map((i) => i.number);
    expect(numbers).toEqual([37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
    for (const item of ISSUES_MANUAL_DATA) {
      expect(item.steps.length).toBeGreaterThanOrEqual(3);
      expect(item.expectedResult.length).toBeGreaterThan(15);
    }
  });

  it("genera el archivo PDF vectorial con capturas comparativas y lo guarda en disco", () => {
    const doc = generateManualTestingPdfDoc();
    expect(doc.getNumberOfPages()).toBe(8);

    const arrayBuf = doc.output("arraybuffer");
    const buffer = Buffer.from(arrayBuf);
    expect(buffer.byteLength).toBeGreaterThan(15000);
    // Verificar cabecera %PDF-
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");

    // Guardar copia estática en la raíz del proyecto y en expo/public para descarga directa
    const rootPdfPath = path.resolve(__dirname, "../../manual-pruebas-issues-vitmaterna.pdf");
    fs.writeFileSync(rootPdfPath, buffer);
    expect(fs.existsSync(rootPdfPath)).toBe(true);

    const publicDir = path.resolve(__dirname, "../public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const publicPdfPath = path.join(publicDir, "manual-pruebas-issues-vitmaterna.pdf");
    fs.writeFileSync(publicPdfPath, buffer);
    expect(fs.existsSync(publicPdfPath)).toBe(true);
  });
});
