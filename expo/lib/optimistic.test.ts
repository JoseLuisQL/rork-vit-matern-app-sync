import { describe, expect, it } from "bun:test";
import {
  anemiaClassLocal,
  correctedHbLocal,
  fppKeyLocal,
  weeksLocal,
} from "./optimistic";

describe("Frontend Optimistic Calculations", () => {
  it("calculates corrected hemoglobin with local altitude factor", () => {
    expect(correctedHbLocal(13.8, -1.8)).toBe(12.0);
    expect(correctedHbLocal(11.0, -1.8)).toBe(9.2);
  });

  it("classifies anemia levels locally", () => {
    expect(anemiaClassLocal(11.5)).toBe("normal");
    expect(anemiaClassLocal(10.5)).toBe("leve");
    expect(anemiaClassLocal(8.5)).toBe("moderada");
    expect(anemiaClassLocal(6.5)).toBe("severa");
  });

  it("computes weeks of gestation from FUM", () => {
    expect(weeksLocal("2026-01-01", "2026-01-22")).toBe(3);
    expect(weeksLocal("2026-01-01", "2025-12-01")).toBe(0);
  });

  it("calculates FPP locally via Naegele rule", () => {
    expect(fppKeyLocal("2026-01-10")).toBe("2026-10-17");
  });
});
