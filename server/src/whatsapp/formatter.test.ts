import { describe, expect, it } from "bun:test";
import {
  formatDateSpanish,
  formatPeruPhoneToJid,
  formatPhoneReadable,
  isValidPeruPhone,
  sanitizeDigits,
} from "./formatter";

describe("WhatsApp Formatter — Phone Sanitization & Validation", () => {
  it("sanitizes phone numbers keeping only digits", () => {
    expect(sanitizeDigits("+51 (987) 654-321")).toBe("51987654321");
    expect(sanitizeDigits("987 654 321")).toBe("987654321");
    expect(sanitizeDigits("")).toBe("");
    expect(sanitizeDigits(null)).toBe("");
  });

  it("validates Peruvian mobile numbers correctly", () => {
    expect(isValidPeruPhone("987654321")).toBe(true);
    expect(isValidPeruPhone("+51 987 654 321")).toBe(true);
    expect(isValidPeruPhone("51987654321")).toBe(true);

    // Invalid numbers
    expect(isValidPeruPhone("887654321")).toBe(false); // Does not start with 9
    expect(isValidPeruPhone("98765432")).toBe(false); // 8 digits
    expect(isValidPeruPhone("9876543210")).toBe(false); // 10 digits without 51
    expect(isValidPeruPhone("")).toBe(false);
    expect(isValidPeruPhone(undefined)).toBe(false);
  });

  it("formats Peruvian phones to Open-WA JID format (519XXXXXXXX@c.us)", () => {
    expect(formatPeruPhoneToJid("987654321")).toBe("51987654321@c.us");
    expect(formatPeruPhoneToJid("+51 987 654 321")).toBe("51987654321@c.us");
    expect(formatPeruPhoneToJid("51987654321")).toBe("51987654321@c.us");
    expect(formatPeruPhoneToJid("51987654321@c.us")).toBe("51987654321@c.us");

    // Invalid numbers return null
    expect(formatPeruPhoneToJid("12345")).toBeNull();
    expect(formatPeruPhoneToJid("")).toBeNull();
    expect(formatPeruPhoneToJid(null)).toBeNull();
  });

  it("formats phones for readable display (+51 9XX XXX XXX)", () => {
    expect(formatPhoneReadable("987654321")).toBe("+51 987 654 321");
    expect(formatPhoneReadable("51987654321")).toBe("+51 987 654 321");
  });

  it("formats dates into friendly Spanish strings", () => {
    const formatted = formatDateSpanish("2026-08-20");
    expect(formatted).toContain("20 de agosto de 2026");
    expect(formatted).toContain("Jueves");
  });
});
