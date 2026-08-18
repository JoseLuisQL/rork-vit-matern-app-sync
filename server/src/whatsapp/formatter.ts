/**
 * VITMATERNA — Normalizador de números telefónicos peruanos para WhatsApp.
 * Convierte formatos locales (+51, espacios, 9 dígitos) al formato JID
 * requerido por Open-WA: 519XXXXXXXX@c.us
 */

/**
 * Limpia y normaliza un número de teléfono a solo dígitos.
 */
export function sanitizeDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

/**
 * Valida si un número telefónico corresponde a un celular peruano válido (9 dígitos).
 */
export function isValidPeruPhone(raw: string | null | undefined): boolean {
  const digits = sanitizeDigits(raw);
  if (digits.length === 9 && digits.startsWith("9")) {
    return true;
  }
  if (digits.length === 11 && digits.startsWith("519")) {
    return true;
  }
  return false;
}

/**
 * Convierte cualquier formato de celular peruano a JID de Open-WA (ej: 51987654321@c.us).
 * Retorna null si el número no es válido.
 */
export function formatPeruPhoneToJid(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (cleaned.endsWith("@c.us")) {
    const prefix = cleaned.replace("@c.us", "");
    const digits = sanitizeDigits(prefix);
    if (isValidPeruPhone(digits)) {
      const normalized = digits.length === 9 ? `51${digits}` : digits;
      return `${normalized}@c.us`;
    }
  }

  const digits = sanitizeDigits(cleaned);
  if (digits.length === 9 && digits.startsWith("9")) {
    return `51${digits}@c.us`;
  }
  if (digits.length === 11 && digits.startsWith("519")) {
    return `${digits}@c.us`;
  }

  // Soporte para otros países si viene con código de país completo (mínimo 10 dígitos)
  if (digits.length >= 10 && digits.length <= 15) {
    return `${digits}@c.us`;
  }

  return null;
}

/**
 * Formatea un número peruano para visualización legible (+51 9XX XXX XXX).
 */
export function formatPhoneReadable(raw: string | null | undefined): string {
  const digits = sanitizeDigits(raw);
  if (digits.length === 9) {
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("51")) {
    const local = digits.slice(2);
    return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return raw ?? "";
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/**
 * Formatea una clave YYYY-MM-DD a formato amigable en español (ej: "Miércoles, 20 de agosto de 2026").
 */
export function formatDateSpanish(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const diaSemana = DIAS[dt.getUTCDay()] ?? "";
  const mesNombre = MESES[m - 1] ?? "";
  return `${diaSemana}, ${d} de ${mesNombre} de ${y}`;
}
