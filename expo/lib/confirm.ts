/**
 * Confirmación y avisos multiplataforma con diseño clínico cálido consistente.
 * Totalmente desacoplado de las alertas nativas del navegador / sistema operativo.
 */
import React from "react";

export type ConfirmVariant =
  | "danger"
  | "warning"
  | "info"
  | "success"
  | "default";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  variant?: ConfirmVariant;
  badge?: string;
  accentColor?: string;
  singleButton?: boolean;
  icon?: React.ComponentType<{ size: number; color: string }>;
}

export type ConfirmHandler = (options: ConfirmOptions) => Promise<boolean>;

let globalConfirmHandler: ConfirmHandler | null = null;

export function registerConfirmHandler(handler: ConfirmHandler | null): void {
  globalConfirmHandler = handler;
}

/**
 * Abre el diálogo de confirmación personalizado de VitMaterna.
 * Retorna una promesa que resuelve en `true` si el usuario aceptó o `false` si canceló.
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (globalConfirmHandler) {
    return globalConfirmHandler(options);
  }
  // En caso de ejecutarse antes del montaje del host o en pruebas unitarias:
  if (typeof window !== "undefined" && typeof window.confirm === "function") {
    const ok = window.confirm(
      `${options.title}${options.message ? `\n\n${options.message}` : ""}`
    );
    return Promise.resolve(!!ok);
  }
  return Promise.resolve(true);
}

/**
 * Muestra un aviso informativo o de advertencia con un solo botón de aceptación.
 */
export function showNotice(
  title: string,
  message: string,
  options?: Partial<ConfirmOptions>
): Promise<boolean> {
  return confirmAction({
    title,
    message,
    confirmText: options?.confirmText || "Entendido",
    singleButton: true,
    variant:
      options?.variant || (options?.destructive ? "danger" : "info"),
    ...options,
  });
}

/**
 * Hook para invocar diálogos de confirmación en componentes funcionales.
 */
export function useConfirm() {
  return {
    confirm: confirmAction,
    notice: showNotice,
  };
}
