import { describe, expect, it } from "vitest";
import {
  alternarHabito,
  formatoHoras,
  formatoMinutos,
  formatoReloj,
  fraccionHabito,
  fraccionMeta,
  frecuenciaHabito,
  proximasFechas,
  resumenEstadisticas,
  semanaDeHabito,
  textoFaltan,
  textoMeta,
  textoRacha,
  type FechaImportante,
  type Habito,
  type Meta,
} from "./progreso";

// Miércoles 28 oct 2026: la semana empieza el lunes 26.
const HOY = "2026-10-28";

const habito = (datos: Partial<Habito>): Habito => ({
  id: "h1",
  nombre: "Leer",
  icono: "📚",
  color: "verde",
  dias_semana: 7,
  hecho_hoy: false,
  marcas_semana: [],
  racha: 0,
  ...datos,
});

const meta = (datos: Partial<Meta>): Meta => ({
  id: "m1",
  titulo: "Leer 12 libros",
  tipo: "numero",
  lista_id: null,
  lista: null,
  objetivo: 12,
  actual: 3,
  unidad: "libros",
  color: "verde",
  ...datos,
});

describe("hábitos", () => {
  it("el anillo de un hábito diario se llena solo si lo hiciste hoy", () => {
    expect(fraccionHabito(habito({ hecho_hoy: false }))).toBe(0);
    expect(fraccionHabito(habito({ hecho_hoy: true }))).toBe(1);
  });

  it("el anillo de un hábito semanal muestra lo que llevas de la semana", () => {
    expect(fraccionHabito(habito({ dias_semana: 3, marcas_semana: ["2026-10-26"] }))).toBeCloseTo(1 / 3);
    expect(fraccionHabito(habito({ dias_semana: 2, marcas_semana: ["2026-10-26", "2026-10-27", "2026-10-28"] }))).toBe(1);
  });

  it("describe la frecuencia y la racha en español", () => {
    expect(frecuenciaHabito(7)).toBe("Todos los días");
    expect(frecuenciaHabito(1)).toBe("1 día por semana");
    expect(frecuenciaHabito(3)).toBe("3 días por semana");
    expect(textoRacha(habito({ racha: 0 }))).toBe("Empieza hoy");
    expect(textoRacha(habito({ racha: 1 }))).toBe("1 día seguido");
    expect(textoRacha(habito({ racha: 12 }))).toBe("12 días seguidos");
    expect(textoRacha(habito({ dias_semana: 3, racha: 0, marcas_semana: ["2026-10-26"] }))).toBe("1 de 3 esta semana");
    expect(textoRacha(habito({ dias_semana: 3, racha: 1 }))).toBe("1 semana seguida");
    expect(textoRacha(habito({ dias_semana: 3, racha: 4 }))).toBe("4 semanas seguidas");
  });

  it("marcar y desmarcar un hábito diario sube y baja la racha", () => {
    const marcado = alternarHabito(habito({ racha: 3, marcas_semana: ["2026-10-26", "2026-10-27"] }), HOY);
    expect(marcado).toMatchObject({ hecho_hoy: true, racha: 4, marcas_semana: ["2026-10-26", "2026-10-27", HOY] });
    const desmarcado = alternarHabito(marcado, HOY);
    expect(desmarcado).toMatchObject({ hecho_hoy: false, racha: 3, marcas_semana: ["2026-10-26", "2026-10-27"] });
    expect(alternarHabito(habito({ hecho_hoy: true, racha: 0, marcas_semana: [HOY] }), HOY).racha).toBe(0);
  });

  it("en un hábito semanal la racha cambia solo al cruzar la meta de la semana", () => {
    const h = habito({ dias_semana: 2, racha: 5, marcas_semana: ["2026-10-26"] });
    const cumplida = alternarHabito(h, HOY);
    expect(cumplida.racha).toBe(6);
    expect(alternarHabito(cumplida, HOY).racha).toBe(5);
    const yaCumplida = habito({ dias_semana: 1, racha: 2, marcas_semana: ["2026-10-26"] });
    expect(alternarHabito(yaCumplida, HOY).racha).toBe(2);
  });

  it("arma la semana de lunes a domingo con hechos, pendientes y días futuros", () => {
    const semana = semanaDeHabito(habito({ marcas_semana: ["2026-10-26", HOY] }), HOY);
    expect(semana.map((d) => d.fecha)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
    expect(semana.map((d) => d.estado)).toEqual(["hecho", "pendiente", "hecho", "futuro", "futuro", "futuro", "futuro"]);
  });
});

describe("metas", () => {
  it("calcula el avance sin pasar de 100 %", () => {
    expect(fraccionMeta(meta({ actual: 3, objetivo: 12 }))).toBe(0.25);
    expect(fraccionMeta(meta({ actual: 20, objetivo: 12 }))).toBe(1);
    expect(fraccionMeta(meta({ tipo: "lista", objetivo: 0, actual: 0 }))).toBe(0);
  });

  it("describe el avance con su unidad o con las tareas de la lista", () => {
    expect(textoMeta(meta({}))).toBe("3 de 12 libros");
    expect(textoMeta(meta({ actual: 2.5, objetivo: 10, unidad: "km" }))).toBe("2,5 de 10 km");
    expect(textoMeta(meta({ tipo: "lista", lista_id: "l1", lista: "Inglés", objetivo: 8, actual: 5 }))).toBe("5 de 8 tareas hechas");
    expect(textoMeta(meta({ tipo: "lista", lista_id: "l1", lista: "Inglés", objetivo: 0, actual: 0 }))).toBe("Aún no hay tareas en Inglés");
    expect(textoMeta(meta({ tipo: "lista", lista_id: null }))).toBe("Su lista se borró");
  });
});

describe("fechas importantes", () => {
  it("dice cuánto falta o cuánto pasó", () => {
    expect(textoFaltan(HOY, HOY)).toBe("Es hoy");
    expect(textoFaltan("2026-10-29", HOY)).toBe("Mañana");
    expect(textoFaltan("2026-11-15", HOY)).toBe("Faltan 18 días");
    expect(textoFaltan("2026-10-27", HOY)).toBe("Fue ayer");
    expect(textoFaltan("2026-10-20", HOY)).toBe("Fue hace 8 días");
  });

  it("muestra solo las próximas, de la más cercana a la más lejana", () => {
    const f = (titulo: string, fecha: string): FechaImportante => ({ id: titulo, titulo, fecha, icono: "📅", color: "naranja" });
    const lista = [f("Viaje", "2026-12-20"), f("Pasado", "2026-10-01"), f("Examen", "2026-11-10"), f("Hoy", HOY), f("Lejos", "2027-05-01")];
    expect(proximasFechas(lista, HOY).map((x) => x.titulo)).toEqual(["Hoy", "Examen", "Viaje"]);
  });
});

describe("foco y estadísticas", () => {
  it("formatea el reloj y los minutos", () => {
    expect(formatoReloj(25 * 60_000)).toBe("25:00");
    expect(formatoReloj(61_001)).toBe("01:02");
    expect(formatoReloj(-5)).toBe("00:00");
    expect(formatoReloj(3_600_000 + 5_000)).toBe("1:00:05");
    expect(formatoMinutos(0)).toBe("0 min");
    expect(formatoMinutos(45)).toBe("45 min");
    expect(formatoMinutos(120)).toBe("2 h");
    expect(formatoMinutos(85)).toBe("1 h 25 min");
    expect(formatoHoras(45)).toBe("45 min");
    expect(formatoHoras(120)).toBe("2 h");
    expect(formatoHoras(1075)).toBe("17,9 h");
  });

  it("compara la semana actual con el promedio de las anteriores", () => {
    const r = resumenEstadisticas([
      { semana: "2026-10-12", tareas: 4, minutos: 50 },
      { semana: "2026-10-19", tareas: 6, minutos: 0 },
      { semana: "2026-10-26", tareas: 3, minutos: 25 },
    ]);
    expect(r).toMatchObject({ tareasSemana: 3, minutosSemana: 25, promedioTareas: 5, totalTareas: 13, totalMinutos: 75, maximoTareas: 6, maximoMinutos: 50 });
    expect(resumenEstadisticas([]).maximoTareas).toBe(1);
  });
});
