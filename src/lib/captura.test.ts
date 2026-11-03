import { describe, expect, it } from "vitest";
import { interpretarCaptura } from "./captura";

const HOY = "2026-10-27"; // martes
const c = (texto: string) => interpretarCaptura(texto, HOY);

describe("captura rápida", () => {
  it("deja el texto tal cual si no hay fechas ni marcas", () => {
    expect(c("comprar 3 panes")).toEqual({ titulo: "Comprar 3 panes", fecha: null, hora: null, fecha_fin: null, hora_fin: null, prioridad: 0, lista: null, repetir: null });
  });

  it("entiende la frase completa del ejemplo", () => {
    expect(c("Pagar luz el viernes 9am #casa !!")).toEqual({
      titulo: "Pagar luz",
      fecha: "2026-10-30",
      hora: "09:00",
      fecha_fin: null,
      hora_fin: null,
      prioridad: 2,
      lista: "casa",
      repetir: null,
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

  it("entiende tareas que se repiten", () => {
    expect(c("gimnasio todos los lunes 7am")).toMatchObject({ titulo: "Gimnasio", repetir: "semanal", fecha: "2026-11-02", hora: "07:00" });
    expect(c("regar plantas cada martes")).toMatchObject({ titulo: "Regar plantas", repetir: "semanal", fecha: HOY }); // hoy martes cuenta
    expect(c("tomar vitaminas todos los días")).toMatchObject({ titulo: "Tomar vitaminas", repetir: "diaria", fecha: HOY });
    expect(c("revisar correo de lunes a viernes 9am")).toMatchObject({ titulo: "Revisar correo", repetir: "laborables", hora: "09:00" });
    expect(c("pagar alquiler cada mes el 30")).toMatchObject({ titulo: "Pagar alquiler", repetir: "mensual", fecha: "2026-10-30" });
    expect(c("renovar seguro cada año")).toMatchObject({ titulo: "Renovar seguro", repetir: "anual" });
  });

  it("de lunes a viernes en fin de semana empieza el lunes", () => {
    expect(interpretarCaptura("reporte diario de lunes a viernes", "2026-10-31")).toMatchObject({ repetir: "laborables", fecha: "2026-11-02" });
  });
});

describe("captura con inicio y fin", () => {
  it("entiende rangos de horas", () => {
    expect(c("clase mañana de 3 a 5 pm")).toMatchObject({ titulo: "Clase", fecha: "2026-10-28", hora: "15:00", hora_fin: "17:00", fecha_fin: null });
    expect(c("reunión de 3 a 5")).toMatchObject({ titulo: "Reunión", hora: "15:00", hora_fin: "17:00" });
    expect(c("estudiar de 9 a 11")).toMatchObject({ hora: "09:00", hora_fin: "11:00" });
    expect(c("taller de 10 a 12")).toMatchObject({ hora: "10:00", hora_fin: "12:00" });
    expect(c("almuerzo de 11 a 1 pm")).toMatchObject({ hora: "11:00", hora_fin: "13:00" });
    expect(c("cine de 8 a 10 pm")).toMatchObject({ hora: "20:00", hora_fin: "22:00" });
    expect(c("turno desde las 9 hasta las 6 de la tarde")).toMatchObject({ hora: "09:00", hora_fin: "18:00" });
    expect(c("examen el viernes de 15:00 a 17:30")).toMatchObject({ titulo: "Examen", fecha: "2026-10-30", hora: "15:00", hora_fin: "17:30" });
    expect(c("partido 3-5pm")).toMatchObject({ titulo: "Partido", hora: "15:00", hora_fin: "17:00" });
    expect(c("yoga entre las 7 y las 8 am")).toMatchObject({ hora: "07:00", hora_fin: "08:00" });
  });

  it("un rango que pasa la medianoche termina al día siguiente", () => {
    expect(c("fiesta el sábado de 10 pm a 2 am")).toMatchObject({ fecha: "2026-10-31", hora: "22:00", fecha_fin: "2026-11-01", hora_fin: "02:00" });
  });

  it("entiende rangos de días", () => {
    expect(c("viaje del 10 al 15 de noviembre")).toMatchObject({ titulo: "Viaje", fecha: "2026-11-10", fecha_fin: "2026-11-15" });
    expect(c("congreso del lunes al miércoles")).toMatchObject({ titulo: "Congreso", fecha: "2026-11-02", fecha_fin: "2026-11-04" });
    expect(c("vacaciones del 28 de diciembre al 3 de enero")).toMatchObject({ fecha: "2026-12-28", fecha_fin: "2027-01-03" });
    expect(c("feria del 30 al 2 de noviembre")).toMatchObject({ fecha: "2026-10-30", fecha_fin: "2026-11-02" });
    expect(c("curso del 5/11 al 7/11")).toMatchObject({ fecha: "2026-11-05", fecha_fin: "2026-11-07" });
    expect(c("trabajo desde hoy hasta el viernes")).toMatchObject({ titulo: "Trabajo", fecha: HOY, fecha_fin: "2026-10-30" });
  });

  it("'hasta el viernes' empieza hoy", () => {
    expect(c("entregar avance hasta el viernes")).toMatchObject({ titulo: "Entregar avance", fecha: HOY, fecha_fin: "2026-10-30" });
    expect(c("leer libro hasta el 15 de noviembre")).toMatchObject({ fecha: HOY, fecha_fin: "2026-11-15" });
  });

  it("junta días y horas", () => {
    expect(c("congreso del lunes al miércoles de 9 a 6 pm #trabajo")).toMatchObject({
      titulo: "Congreso",
      fecha: "2026-11-02",
      fecha_fin: "2026-11-04",
      hora: "09:00",
      hora_fin: "18:00",
      lista: "trabajo",
    });
  });

  it("no confunde fechas ni cantidades con rangos", () => {
    expect(c("algo el 3-5").hora).toBeNull(); // 3 de mayo
    expect(c("comprar 3 panes").hora_fin).toBeNull();
    expect(c("esperar hasta 5").fecha_fin).toBeNull();
    expect(c("reporte diario de lunes a viernes")).toMatchObject({ repetir: "laborables", fecha_fin: null });
  });
});

describe("captura en la Agenda", () => {
  it("lo que no tiene fecha va al día que estás mirando", () => {
    expect(interpretarCaptura("reunión 3pm", HOY, "2026-11-06")).toMatchObject({ fecha: "2026-11-06", hora: "15:00" });
    expect(interpretarCaptura("comprar pan", HOY, "2026-11-06").fecha).toBe("2026-11-06");
    expect(interpretarCaptura("comprar pan mañana", HOY, "2026-11-06").fecha).toBe("2026-10-28");
  });
});
