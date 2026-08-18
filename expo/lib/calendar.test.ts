import { describe, expect, it } from "bun:test";
import {
  calculateFumPreview,
  generateMonthGrid,
  getCalendarPresets,
} from "./calendar";

describe("Calendar Logic Utilities", () => {
  it("generates a complete 7-column grid starting on Monday for August 2026", () => {
    // Agosto 2026: 1 de agosto es Sábado
    // Offset desde Lunes: 5 días previos (27, 28, 29, 30, 31 de Julio)
    const grid = generateMonthGrid(2026, 7, "2026-08-17", "2026-08-17");

    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(35);

    // Primer día del grid debe ser 27 de julio
    expect(grid[0].dayNumber).toBe(27);
    expect(grid[0].isCurrentMonth).toBe(false);
    expect(grid[0].dateKey).toBe("2026-07-27");

    // 1 de agosto debe ser el 6to elemento (índice 5, Sábado)
    expect(grid[5].dayNumber).toBe(1);
    expect(grid[5].isCurrentMonth).toBe(true);
    expect(grid[5].dateKey).toBe("2026-08-01");

    // 17 de agosto debe estar seleccionado y marcado como hoy
    const cell17 = grid.find((c) => c.dateKey === "2026-08-17");
    expect(cell17).toBeDefined();
    expect(cell17?.isSelected).toBe(true);
    expect(cell17?.isToday).toBe(true);
    expect(cell17?.isCurrentMonth).toBe(true);
  });

  it("handles February in a leap year (2024 has 29 days)", () => {
    const grid = generateMonthGrid(2024, 1, "2024-02-29", "2026-08-17");
    const febDays = grid.filter((c) => c.isCurrentMonth);
    expect(febDays.length).toBe(29);
    expect(febDays[28].dateKey).toBe("2024-02-29");
  });

  it("correctly disables dates outside minDate and maxDate bounds", () => {
    const grid = generateMonthGrid(
      2026,
      7,
      null,
      "2026-08-17",
      "2026-08-10",
      "2026-08-20",
    );

    const cell5 = grid.find((c) => c.dateKey === "2026-08-05");
    expect(cell5?.isDisabled).toBe(true);

    const cell15 = grid.find((c) => c.dateKey === "2026-08-15");
    expect(cell15?.isDisabled).toBe(false);

    const cell25 = grid.find((c) => c.dateKey === "2026-08-25");
    expect(cell25?.isDisabled).toBe(true);
  });

  it("calculates FUM gestational preview accurately", () => {
    // Today: 2026-08-17, FUM: 2026-05-18 (exactly 13 weeks = 91 days)
    const preview = calculateFumPreview("2026-05-18", "2026-08-17");
    expect(preview).not.toBeNull();
    expect(preview?.weeks).toBe(13);
    expect(preview?.extraDays).toBe(0);
    expect(preview?.trimester).toBe("1er trimestre");
    expect(preview?.fpp).toBe("2027-02-25");
  });

  it("calculates FUM for 2nd and 3rd trimester", () => {
    // 20 weeks ago
    const preview2 = calculateFumPreview("2026-03-30", "2026-08-17");
    expect(preview2?.weeks).toBe(20);
    expect(preview2?.trimester).toBe("2do trimestre");

    // 32 weeks ago
    const preview3 = calculateFumPreview("2026-01-05", "2026-08-17");
    expect(preview3?.weeks).toBe(32);
    expect(preview3?.trimester).toBe("3er trimestre");
  });

  it("returns null for future FUM dates", () => {
    const future = calculateFumPreview("2026-09-01", "2026-08-17");
    expect(future).toBeNull();
  });

  it("filters presets based on minDate and maxDate", () => {
    const presets = getCalendarPresets(true, "2026-08-17", "2026-06-01", "2026-08-17");
    expect(presets.length).toBeGreaterThan(0);
    // Should not include "Hace 6 m" because that is before 2026-06-01
    expect(presets.some((p) => p.label === "Hace 6 m")).toBe(false);
  });
});
