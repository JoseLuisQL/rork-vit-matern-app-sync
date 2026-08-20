import { describe, expect, it } from "bun:test";
import {
  confirmAction,
  registerConfirmHandler,
  showNotice,
} from "./confirm";

describe("Confirm & Notice System", () => {
  it("uses registered global handler for confirmAction", async () => {
    let capturedOptions: any = null;
    registerConfirmHandler(async (options) => {
      capturedOptions = options;
      return true;
    });

    const result = await confirmAction({
      title: "Cerrar sesión",
      message: "¿Deseas salir de tu cuenta?",
      confirmText: "Cerrar sesión",
      destructive: true,
    });

    expect(result).toBe(true);
    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.title).toBe("Cerrar sesión");
    expect(capturedOptions.destructive).toBe(true);
    expect(capturedOptions.confirmText).toBe("Cerrar sesión");

    registerConfirmHandler(null);
  });

  it("handles cancel resolution in handler", async () => {
    registerConfirmHandler(async () => {
      return false;
    });

    const result = await confirmAction({
      title: "Eliminar elemento",
      message: "Esta acción no se puede deshacer",
    });

    expect(result).toBe(false);
    registerConfirmHandler(null);
  });

  it("formats single-button notices via showNotice", async () => {
    let capturedOptions: any = null;
    registerConfirmHandler(async (options) => {
      capturedOptions = options;
      return true;
    });

    const result = await showNotice(
      "Sin conexión",
      "Necesitas conexión a internet para esta acción.",
      { variant: "warning" }
    );

    expect(result).toBe(true);
    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.title).toBe("Sin conexión");
    expect(capturedOptions.singleButton).toBe(true);
    expect(capturedOptions.confirmText).toBe("Entendido");
    expect(capturedOptions.variant).toBe("warning");

    registerConfirmHandler(null);
  });
});
