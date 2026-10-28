import { describe, expect, it } from "vitest";
import { diaSemana, diasEntre, etiquetaFecha, etiquetaHora, fechaEncabezado, hoyLima, saludo, sumarDias } from "./fechas";

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

describe("cálculos con fechas AAAA-MM-DD", () => {
  it("hoyLima respeta la zona horaria", () => {
    expect(hoyLima(new Date("2026-10-28T03:00:00Z"))).toBe("2026-10-27");
  });

  it("suma días cruzando meses y años", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("calcula el día de la semana y la distancia entre fechas", () => {
    expect(diaSemana("2026-10-27")).toBe(2); // martes
    expect(diasEntre("2026-10-27", "2026-11-03")).toBe(7);
    expect(diasEntre("2026-10-27", "2026-10-26")).toBe(-1);
  });
});

describe("etiquetas", () => {
  const hoy = "2026-10-27";
  it("usa palabras cercanas y fecha corta para lo demás", () => {
    expect(etiquetaFecha("2026-10-27", hoy)).toBe("Hoy");
    expect(etiquetaFecha("2026-10-28", hoy)).toBe("Mañana");
    expect(etiquetaFecha("2026-10-26", hoy)).toBe("Ayer");
    expect(etiquetaFecha("2026-10-30", hoy)).toBe("vie 30 oct");
    expect(etiquetaFecha("2027-01-05", hoy)).toBe("mar 5 ene 2027");
  });

  it("muestra la hora en formato de 12 horas", () => {
    expect(etiquetaHora("09:05")).toBe("9:05 a. m.");
    expect(etiquetaHora("17:30")).toBe("5:30 p. m.");
    expect(etiquetaHora("00:00")).toBe("12:00 a. m.");
    expect(etiquetaHora("12:15")).toBe("12:15 p. m.");
  });
});
