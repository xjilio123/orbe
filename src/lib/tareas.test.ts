import { describe, expect, it } from "vitest";
import { agruparPorFecha, compararTareas, esInbox, progresoSubtareas, resumenDelDia, type Tarea } from "./tareas";

const HOY = "2026-10-27";
let n = 0;
const t = (datos: Partial<Tarea>): Tarea => ({
  id: `id-${++n}`,
  titulo: `Tarea ${n}`,
  notas: "",
  estado: "pendiente",
  prioridad: 0,
  fecha: null,
  hora: null,
  lista_id: null,
  padre_id: null,
  hecha_en: null,
  creado: `2026-10-0${(n % 9) + 1}T00:00:00Z`,
  repetir: null,
  aviso: 0,
  ...datos,
});

describe("esInbox", () => {
  it("solo lo pendiente sin lista ni fecha, y no las subtareas", () => {
    expect(esInbox(t({}))).toBe(true);
    expect(esInbox(t({ lista_id: "l1" }))).toBe(false);
    expect(esInbox(t({ fecha: HOY }))).toBe(false);
    expect(esInbox(t({ estado: "hecha" }))).toBe(false);
    expect(esInbox(t({ padre_id: "p" }))).toBe(false);
  });
});

describe("compararTareas", () => {
  it("ordena por fecha, luego prioridad, luego hora", () => {
    const a = t({ fecha: "2026-10-28" });
    const b = t({ fecha: HOY, prioridad: 0, hora: "18:00" });
    const c = t({ fecha: HOY, prioridad: 3 });
    const d = t({ fecha: HOY, prioridad: 0, hora: "09:00" });
    const e = t({});
    expect([a, b, c, d, e].sort(compararTareas).map((x) => x.id)).toEqual([c.id, d.id, b.id, a.id, e.id]);
  });
});

describe("agruparPorFecha", () => {
  it("separa vencidas, hoy, mañana, semana y después; ignora hechas y sin fecha", () => {
    const grupos = agruparPorFecha(
      [
        t({ fecha: "2026-10-20" }),
        t({ fecha: HOY }),
        t({ fecha: "2026-10-28" }),
        t({ fecha: "2026-11-03" }),
        t({ fecha: "2026-11-20" }),
        t({ fecha: HOY, estado: "hecha" }),
        t({}),
      ],
      HOY,
    );
    expect(grupos.map((g) => [g.clave, g.tareas.length])).toEqual([
      ["vencidas", 1],
      ["hoy", 1],
      ["manana", 1],
      ["semana", 1],
      ["despues", 1],
    ]);
    expect(grupos[0].alerta).toBe(true);
  });

  it("no muestra grupos vacíos", () => {
    expect(agruparPorFecha([t({ fecha: HOY })], HOY).map((g) => g.clave)).toEqual(["hoy"]);
  });
});

describe("resumenDelDia", () => {
  it("cuenta lo de hoy y lo vencido como pendiente y calcula el avance", () => {
    const tareas = [
      t({ fecha: "2026-10-25" }),
      t({ fecha: HOY }),
      t({ fecha: "2026-10-29" }),
      t({ estado: "hecha", hecha_en: "2026-10-27T15:00:00Z" }),
      t({ estado: "hecha", hecha_en: "2026-10-20T15:00:00Z" }),
    ];
    const r = resumenDelDia(tareas, HOY, (x) => x.hecha_en?.startsWith(HOY) ?? false);
    expect(r.pendientes).toHaveLength(2);
    expect(r.hechas).toBe(1);
    expect(r.total).toBe(3);
    expect(r.fraccion).toBeCloseTo(1 / 3);
  });

  it("sin nada para hoy el avance es 0", () => {
    expect(resumenDelDia([], HOY, () => false).fraccion).toBe(0);
  });
});

describe("progresoSubtareas", () => {
  it("cuenta las subtareas hechas", () => {
    expect(progresoSubtareas([t({ estado: "hecha" }), t({}), t({ estado: "hecha" })])).toEqual({ hechas: 2, total: 3 });
  });
});
