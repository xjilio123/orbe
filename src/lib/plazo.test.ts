import { describe, expect, it } from "vitest";
import { etiquetaDias, etiquetaPlazo, finDe, limpiarPlazo, ocurreEn, rangoHoras, revisarPlazo, type Plazo } from "./plazo";

const HOY = "2026-11-02"; // lunes
const p = (x: Partial<Plazo>): Plazo => ({ fecha: null, hora: null, fecha_fin: null, hora_fin: null, ...x });

describe("finDe y ocurreEn", () => {
  it("sin fecha de fin, termina el mismo día", () => {
    expect(finDe(p({ fecha: HOY }))).toBe(HOY);
    expect(ocurreEn(p({ fecha: HOY }), HOY)).toBe(true);
    expect(ocurreEn(p({ fecha: HOY }), "2026-11-03")).toBe(false);
  });
  it("con fin, ocurre todos los días del rango", () => {
    const viaje = p({ fecha: "2026-11-02", fecha_fin: "2026-11-04" });
    expect(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"].map((d) => ocurreEn(viaje, d))).toEqual([false, true, true, true, false]);
  });
  it("sin fecha no ocurre nunca", () => {
    expect(ocurreEn(p({}), HOY)).toBe(false);
  });
});

describe("revisarPlazo", () => {
  it("acepta lo normal", () => {
    expect(revisarPlazo(p({ fecha: HOY, hora: "15:00", hora_fin: "17:00" }))).toBeNull();
    expect(revisarPlazo(p({ fecha: HOY, hora: "22:00", fecha_fin: "2026-11-03", hora_fin: "02:00" }))).toBeNull();
    expect(revisarPlazo(p({ fecha: HOY, fecha_fin: HOY }))).toBeNull();
  });
  it("explica cada error junto a su campo", () => {
    expect(revisarPlazo(p({ hora: "10:00" }))?.campo).toBe("hora");
    expect(revisarPlazo(p({ fecha_fin: HOY }))?.campo).toBe("fecha_fin");
    expect(revisarPlazo(p({ fecha: HOY, fecha_fin: "2026-11-01" }))).toEqual({ campo: "fecha_fin", mensaje: "La fecha de fin no puede ser antes del inicio" });
    expect(revisarPlazo(p({ fecha: HOY, hora_fin: "10:00" }))?.campo).toBe("hora_fin");
    expect(revisarPlazo(p({ fecha: HOY, hora: "15:00", hora_fin: "15:00" }))).toEqual({ campo: "hora_fin", mensaje: "La hora de fin debe ser después de la de inicio" });
    expect(revisarPlazo(p({ fecha: HOY, fecha_fin: HOY, hora: "15:00", hora_fin: "14:00" }))?.campo).toBe("hora_fin");
  });
});

describe("limpiarPlazo", () => {
  it("el fin igual al inicio queda vacío", () => {
    expect(limpiarPlazo(p({ fecha: HOY, fecha_fin: HOY, hora: "15:00", hora_fin: "17:00" }))).toEqual(p({ fecha: HOY, hora: "15:00", hora_fin: "17:00" }));
  });
  it("quita lo que no tiene sentido en vez de fallar", () => {
    expect(limpiarPlazo(p({ fecha: HOY, fecha_fin: "2026-10-30" }))).toEqual(p({ fecha: HOY }));
    expect(limpiarPlazo(p({ fecha: HOY, hora: "15:00", hora_fin: "14:00" }))).toEqual(p({ fecha: HOY, hora: "15:00" }));
    expect(limpiarPlazo(p({ hora: "15:00", fecha_fin: HOY, hora_fin: "16:00" }))).toEqual(p({}));
  });
  it("de un día a otro, la hora de fin puede ser menor", () => {
    const turno = p({ fecha: HOY, hora: "22:00", fecha_fin: "2026-11-03", hora_fin: "06:00" });
    expect(limpiarPlazo(turno)).toEqual(turno);
  });
});

describe("etiquetas", () => {
  it("rango de horas con el sufijo una sola vez", () => {
    expect(rangoHoras("15:00", "17:30")).toBe("3:00 – 5:30 p. m.");
    expect(rangoHoras("10:00", "13:00")).toBe("10:00 a. m. – 1:00 p. m.");
    expect(rangoHoras("09:00", null)).toBe("9:00 a. m.");
  });
  it("un solo día", () => {
    expect(etiquetaPlazo(p({ fecha: HOY }), HOY)).toBe("Hoy");
    expect(etiquetaPlazo(p({ fecha: HOY, hora: "15:00", hora_fin: "17:00" }), HOY)).toBe("Hoy · 3:00 – 5:00 p. m.");
  });
  it("varios días", () => {
    expect(etiquetaPlazo(p({ fecha: HOY, fecha_fin: "2026-11-05" }), HOY)).toBe("Hoy – jue 5 nov");
    expect(etiquetaPlazo(p({ fecha: HOY, hora: "22:00", fecha_fin: "2026-11-03", hora_fin: "08:00" }), HOY)).toBe("Hoy 10:00 p. m. – Mañana 8:00 a. m.");
    expect(etiquetaDias(p({ fecha: "2026-11-09", fecha_fin: "2026-11-13" }), HOY)).toBe("lun 9 nov – vie 13 nov");
  });
  it("sin fecha no muestra nada", () => {
    expect(etiquetaPlazo(p({}), HOY)).toBe("");
  });
});
