import { describe, expect, it } from "vitest";
import { etiquetaRepetir, proximasVeces, siguienteFecha } from "./repeticion";

describe("siguienteFecha (igual que private.siguiente_fecha en la base)", () => {
  it("diaria hecha a tiempo pasa a mañana", () => {
    expect(siguienteFecha("2026-10-27", "diaria", "2026-10-27")).toBe("2026-10-28");
  });

  it("diaria atrasada salta a mañana, no a un día pasado", () => {
    expect(siguienteFecha("2026-10-20", "diaria", "2026-10-27")).toBe("2026-10-28");
  });

  it("laborables: el viernes pasa al lunes", () => {
    expect(siguienteFecha("2026-10-30", "laborables", "2026-10-30")).toBe("2026-11-02");
  });

  it("semanal mantiene el día de la semana", () => {
    expect(siguienteFecha("2026-10-26", "semanal", "2026-10-27")).toBe("2026-11-02");
  });

  it("mensual: el 31 de enero pasa al 28 de febrero y vuelve al 31 en marzo", () => {
    expect(siguienteFecha("2026-01-31", "mensual", "2026-02-01")).toBe("2026-02-28");
    expect(siguienteFecha("2026-01-31", "mensual", "2026-03-01")).toBe("2026-03-31");
  });

  it("anual: el 29 de febrero pasa al 28 en años no bisiestos", () => {
    expect(siguienteFecha("2028-02-29", "anual", "2028-02-29")).toBe("2029-02-28");
  });

  it("si se marca antes de tiempo, avanza desde su propia fecha", () => {
    expect(siguienteFecha("2026-10-29", "diaria", "2026-10-27")).toBe("2026-10-30");
  });
});

describe("proximasVeces", () => {
  it("lista las veces de una semana dentro del rango", () => {
    expect(proximasVeces("2026-10-26", "laborables", "2026-10-27", "2026-11-03")).toEqual([
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-11-02",
      "2026-11-03",
    ]);
  });

  it("no incluye la fecha original y respeta el máximo", () => {
    expect(proximasVeces("2026-10-27", "diaria", "2026-10-01", "2026-12-31", 3)).toEqual(["2026-10-28", "2026-10-29", "2026-10-30"]);
  });
});

describe("etiquetaRepetir", () => {
  it("dice el día de la semana o del mes", () => {
    expect(etiquetaRepetir("semanal", "2026-11-02")).toBe("Cada lunes");
    expect(etiquetaRepetir("mensual", "2026-11-15")).toBe("Cada mes, el día 15");
    expect(etiquetaRepetir("laborables", "2026-11-02")).toBe("De lunes a viernes");
  });
});
