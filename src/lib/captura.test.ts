import { describe, expect, it } from "vitest";
import { interpretarCaptura } from "./captura";

const HOY = "2026-10-27"; // martes
const c = (texto: string) => interpretarCaptura(texto, HOY);

describe("captura rápida", () => {
  it("deja el texto tal cual si no hay fechas ni marcas", () => {
    expect(c("comprar 3 panes")).toEqual({ titulo: "Comprar 3 panes", fecha: null, hora: null, prioridad: 0, lista: null });
  });

  it("entiende la frase completa del ejemplo", () => {
    expect(c("Pagar luz el viernes 9am #casa !!")).toEqual({
      titulo: "Pagar luz",
      fecha: "2026-10-30",
      hora: "09:00",
      prioridad: 2,
      lista: "casa",
    });
  });

  it("entiende hoy, mañana y pasado mañana", () => {
    expect(c("llamar al banco hoy").fecha).toBe("2026-10-27");
    expect(c("enviar informe mañana").fecha).toBe("2026-10-28");
    expect(c("Enviar informe mañana").titulo).toBe("Enviar informe");
    expect(c("examen pasado mañana").fecha).toBe("2026-10-29");
  });

  it("'en la mañana' es una parte del día, no mañana", () => {
    const r = c("correr en la mañana");
    expect(r.fecha).toBeNull();
  });

  it("los días de la semana apuntan al próximo (hoy martes → el martes de la otra semana)", () => {
    expect(c("reunión el lunes").fecha).toBe("2026-11-02");
    expect(c("gimnasio miércoles").fecha).toBe("2026-10-28");
    expect(c("clase el martes").fecha).toBe("2026-11-03");
    expect(c("clase el sábado").fecha).toBe("2026-10-31");
  });

  it("entiende fechas con número y mes", () => {
    expect(c("cumple de Diana 15 de noviembre").fecha).toBe("2026-11-15");
    expect(c("pagar tarjeta 5 nov").fecha).toBe("2026-11-05");
    expect(c("renovar DNI 20/12").fecha).toBe("2026-12-20");
    expect(c("viaje 10/01/2027").fecha).toBe("2027-01-10");
    // Si el día ya pasó este año, es el del próximo
    expect(c("aniversario 3 de marzo").fecha).toBe("2027-03-03");
  });

  it("'el 15' es el próximo día 15", () => {
    expect(c("pagar alquiler el 30").fecha).toBe("2026-10-30");
    expect(c("pagar alquiler el 5").fecha).toBe("2026-11-05");
  });

  it("rechaza fechas imposibles", () => {
    expect(c("algo 31/02").fecha).toBeNull();
  });

  it("entiende horas en varios formatos", () => {
    expect(c("llamar a las 5").hora).toBe("17:00");
    expect(c("desayuno a las 8").hora).toBe("08:00");
    expect(c("cita 17:30").hora).toBe("17:30");
    expect(c("clase 7am").hora).toBe("07:00");
    expect(c("cena 9 pm").hora).toBe("21:00");
    expect(c("partido a las 10 de la noche").hora).toBe("22:00");
    expect(c("café a las 12").hora).toBe("12:00");
  });

  it("una hora sin fecha es para hoy", () => {
    expect(c("llamar a mamá a las 6")).toMatchObject({ fecha: "2026-10-27", hora: "18:00", titulo: "Llamar a mamá" });
  });

  it("entiende prioridades con signos y palabras", () => {
    expect(c("algo !").prioridad).toBe(1);
    expect(c("algo !!!").prioridad).toBe(3);
    expect(c("revisar contrato urgente").prioridad).toBe(3);
    expect(c("¡Hola!").prioridad).toBe(0); // el signo pegado a una palabra no cuenta
  });

  it("entiende relativos en días y semanas", () => {
    expect(c("devolver libro en 3 días").fecha).toBe("2026-10-30");
    expect(c("revisar en una semana").fecha).toBe("2026-11-03");
  });

  it("no se rompe con textos raros o largos", () => {
    expect(c("   ").titulo).toBe("");
    expect(c("#").titulo).toBe("#");
    expect(c("x".repeat(500)).titulo.length).toBe(300);
    expect(c("a las 99").hora).toBeNull();
  });
});
