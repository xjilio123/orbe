import { describe, expect, it } from "vitest";
import {
  bloquesDelDia,
  cuadriculaMes,
  diasDeSemana,
  fechaLarga,
  itemsPorDia,
  leerParametros,
  lunesDe,
  moverMes,
  nombreMes,
  puntosDelDia,
  rangoCorto,
  rangoDeVista,
  type Evento,
} from "./agenda";
import type { Tarea } from "./tareas";

const tarea = (datos: Partial<Tarea>): Tarea => ({
  id: "t1",
  titulo: "Tarea",
  notas: "",
  estado: "pendiente",
  prioridad: 0,
  fecha: null,
  hora: null,
  lista_id: null,
  padre_id: null,
  hecha_en: null,
  creado: "2026-10-01T00:00:00Z",
  repetir: null,
  aviso: 0,
  ...datos,
});

const evento = (datos: Partial<Evento>): Evento => ({ id: "e1", titulo: "Evento", fecha: "2026-10-27", inicio: null, fin: null, lugar: null, ...datos });

describe("fechas de la agenda", () => {
  it("la semana empieza el lunes", () => {
    expect(lunesDe("2026-10-27")).toBe("2026-10-26");
    expect(lunesDe("2026-11-01")).toBe("2026-10-26"); // domingo
    expect(diasDeSemana("2026-10-27")).toHaveLength(7);
  });

  it("la cuadrícula del mes siempre tiene 42 días y empieza en lunes", () => {
    const dias = cuadriculaMes("2026-11-15");
    expect(dias).toHaveLength(42);
    expect(dias[0]).toBe("2026-10-26");
    expect(dias).toContain("2026-11-30");
  });

  it("cambia de mes sin pasarse del último día", () => {
    expect(moverMes("2026-01-31", 1)).toBe("2026-02-28");
    expect(moverMes("2026-01-15", -1)).toBe("2025-12-15");
  });

  it("nombra meses, días y rangos en español", () => {
    expect(nombreMes("2026-11-02")).toBe("noviembre 2026");
    expect(fechaLarga("2026-10-27")).toBe("martes 27 de octubre");
    expect(rangoCorto("2026-10-26", "2026-11-01")).toBe("26 oct – 1 nov");
  });
});

describe("itemsPorDia", () => {
  it("pone tareas y eventos en su día, primero lo de todo el día y luego por hora", () => {
    const dias = itemsPorDia(
      [tarea({ id: "a", fecha: "2026-10-27", hora: "15:00" }), tarea({ id: "b", fecha: "2026-10-27" })],
      [evento({ id: "x", inicio: "09:00", fin: "10:00" }), evento({ id: "y" })],
      "2026-10-26",
      "2026-11-01",
    );
    expect(dias["2026-10-27"].map((i) => i.clave)).toEqual(["y:2026-10-27", "b", "x:2026-10-27", "a"]);
  });

  it("dibuja las próximas veces de una tarea que se repite, sin duplicar la actual", () => {
    const dias = itemsPorDia([tarea({ id: "g", fecha: "2026-10-26", repetir: "semanal" })], [], "2026-10-01", "2026-11-30");
    const veces = Object.entries(dias).flatMap(([f, items]) => items.map((i) => `${f}${i.tipo === "tarea" && i.proyectada ? "*" : ""}`));
    expect(veces).toEqual(["2026-10-26", "2026-11-02*", "2026-11-09*", "2026-11-16*", "2026-11-23*", "2026-11-30*"]);
  });

  it("no proyecta repeticiones de tareas ya hechas ni muestra subtareas", () => {
    const dias = itemsPorDia(
      [tarea({ id: "h", fecha: "2026-10-27", repetir: "diaria", estado: "hecha" }), tarea({ id: "s", fecha: "2026-10-27", padre_id: "h" })],
      [],
      "2026-10-27",
      "2026-10-30",
    );
    expect(Object.keys(dias)).toEqual(["2026-10-27"]);
    expect(dias["2026-10-27"]).toHaveLength(1);
  });

  it("los puntos del mes dicen qué tipo de cosas hay", () => {
    const dias = itemsPorDia([tarea({ fecha: "2026-10-27", estado: "hecha" })], [evento({})], "2026-10-27", "2026-10-27");
    expect(puntosDelDia(dias["2026-10-27"])).toEqual(["evento", "hecha"]);
    expect(puntosDelDia(undefined)).toEqual([]);
  });
});

describe("bloquesDelDia", () => {
  it("pone lado a lado lo que se cruza y a lo ancho lo que no", () => {
    const dias = itemsPorDia(
      [tarea({ id: "t", fecha: "2026-10-27", hora: "09:30" })],
      [evento({ id: "a", inicio: "09:00", fin: "10:00" }), evento({ id: "b", inicio: "11:00", fin: "12:00" })],
      "2026-10-27",
      "2026-10-27",
    );
    const bloques = bloquesDelDia(dias["2026-10-27"]);
    const de = (clave: string) => bloques.find((b) => b.item.clave.startsWith(clave))!;
    expect([de("a").columna, de("a").columnas]).toEqual([0, 2]);
    expect([de("t").columna, de("t").columnas]).toEqual([1, 2]);
    expect([de("b").columna, de("b").columnas]).toEqual([0, 1]);
    expect(de("t").fin - de("t").inicio).toBe(30);
  });
});

describe("parámetros de la Agenda", () => {
  it("lo que no es válido vuelve a mes y a hoy", () => {
    expect(leerParametros("semana", "2026-11-02", "2026-10-27")).toEqual({ vista: "semana", dia: "2026-11-02" });
    expect(leerParametros("año", "2026-02-30", "2026-10-27")).toEqual({ vista: "mes", dia: "2026-10-27" });
    expect(leerParametros(["dia"], "<script>", "2026-10-27")).toEqual({ vista: "mes", dia: "2026-10-27" });
    expect(leerParametros("dia", "9999-01-01", "2026-10-27").dia).toBe("2026-10-27");
  });

  it("cada vista pide solo sus días", () => {
    expect(rangoDeVista("dia", "2026-10-27")).toEqual(["2026-10-27", "2026-10-27"]);
    expect(rangoDeVista("semana", "2026-10-27")).toEqual(["2026-10-26", "2026-11-01"]);
    expect(rangoDeVista("mes", "2026-10-27")).toEqual(["2026-09-28", "2026-11-08"]);
  });
});
