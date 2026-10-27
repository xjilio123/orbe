import { describe, expect, it } from "vitest";
import { fechaEncabezado, saludo } from "./fechas";

describe("fechaEncabezado", () => {
  it("usa la fecha de Lima aunque en UTC ya sea el día siguiente", () => {
    // 28 oct 03:00 UTC = 27 oct 22:00 en Lima
    expect(fechaEncabezado(new Date("2026-10-28T03:00:00Z"))).toBe("martes 27 oct");
  });
});

describe("saludo", () => {
  it("cambia según la hora de Lima", () => {
    expect(saludo(new Date("2026-10-27T13:00:00Z"))).toBe("Buenos días"); // 8:00 en Lima
    expect(saludo(new Date("2026-10-27T20:00:00Z"))).toBe("Buenas tardes"); // 15:00
    expect(saludo(new Date("2026-10-28T02:00:00Z"))).toBe("Buenas noches"); // 21:00
  });
});
