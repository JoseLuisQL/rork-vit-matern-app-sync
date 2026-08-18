/**
 * VITMATERNA — Tipos del cliente e integraciones de WhatsApp con Open-WA.
 */

export interface WhatsAppConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
  sessionId: string;
  notifyAppointments: boolean;
  notifySupplements: boolean;
  remindAppointments: boolean;
  remindSupplements: boolean;
  chatOfflineFallback: boolean;
  sosOfflineAlerts: boolean;
  updatedAtISO: string;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  enabled: false,
  serverUrl: "https://openwa.qware.me",
  apiKey: "",
  sessionId: "vitmaterna",
  notifyAppointments: true,
  notifySupplements: true,
  remindAppointments: true,
  remindSupplements: true,
  chatOfflineFallback: true,
  sosOfflineAlerts: true,
  updatedAtISO: new Date().toISOString(),
};

export interface WhatsAppSendResult {
  ok: boolean;
  skipped?: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppStatusResult {
  ok: boolean;
  status: "connected" | "disconnected" | "unconfigured" | "error";
  battery?: number | null;
  serverUrl?: string;
  details?: string;
  error?: string;
}
