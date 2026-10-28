import { describe, expect, it } from "vitest";
import { aParametros, aplicarTabla, cuadranteDe, leerConfig, matriz, revisionSemanal } from "./organizacion";
import type { Tarea } from "./tareas";

const HOY = "2026-10-28";
let n = 0;
const t = (datos: Partial<Tarea> & { cuadrante?: number | null }): Tarea => ({
  id: `id-${String(++n).padStart(3, "0")}`,
  titulo: `Tarea ${n}`,
  notas: "",
  estado: "pendiente",
  prioridad: 0,
  fecha: null,
  hora: null,
  lista_id: null,
  padre_id: null,
  hecha_en: null,
  creado: "2026-10-20T15:00:00Z",
  repetir: null,
  aviso: null,
  ...datos,
});

describe("matriz urgente / importante", () => {
  it("ubica cada tarea por prioridad (!! o más) y fecha (hasta 2 días o atrasada)", () => {
    expect(cuadranteDe(t({ prioridad: 3, fecha: HOY }), HOY)).toBe(1);
    expect(cuadranteDe(t({ prioridad: 2, fecha: "2026-10-20" }), HOY)).toBe(1);
    expect(cuadranteDe(t({ prioridad: 2, fecha: "2026-11-15" }), HOY)).toBe(2);
    expect(cuadranteDe(t({ prioridad: 2 }), HOY)).toBe(2);
    expect(cuadranteDe(t({ prioridad: 1, fecha: "2026-10-30" }), HOY)).toBe(3);
    expect(cuadranteDe(t({ prioridad: 0, fecha: "2026-10-31" }), HOY)).toBe(4);
    expect(cuadranteDe(t({}), HOY)).toBe(4);
  });

  it("respeta el cuadrante elegido a mano", () => {
    expect(cuadranteDe(t({ prioridad: 3, fecha: HOY, cuadrante: 4 }), HOY)).toBe(4);
  });

  it("reparte solo lo pendiente y sin subtareas", () => {
    const m = matriz(
      [t({ prioridad: 3, fecha: HOY }), t({ prioridad: 3, fecha: HOY, estado: "hecha" }), t({ prioridad: 3, fecha: HOY, padre_id: "x" }), t({})],
      HOY,
    );
    expect([m[1].length, m[2].length, m[3].length, m[4].length]).toEqual([1, 0, 0, 1]);
  });
});

describe("revisión semanal", () => {
  it("separa atrasadas, estancadas, próximas e inbox", () => {
    const r = revisionSemanal(
      [
        t({ titulo: "Atrasada", fecha: "2026-10-25", lista_id: "l" }),
        t({ titulo: "Estancada", creado: "2026-10-01T10:00:00Z" }),
        t({ titulo: "Nueva en inbox", creado: "2026-10-27T10:00:00Z" }),
        t({ titulo: "Próxima", fecha: "2026-11-02" }),
        t({ titulo: "Lejana", fecha: "2026-12-01" }),
      ],
      [t({ titulo: "Hecha", estado: "hecha", hecha_en: "2026-10-27T15:00:00Z" })],
      HOY,
    );
    expect(r.lunes).toBe("2026-10-26");
    expect(r.atrasadas.map((x) => x.titulo)).toEqual(["Atrasada"]);
    expect(r.estancadas.map((x) => x.titulo)).toEqual(["Estancada"]);
    expect(r.proximas.map((x) => x.titulo)).toEqual(["Próxima"]);
    expect(r.inbox).toBe(2);
    expect(r.hechas).toHaveLength(1);
  });
});

describe("vista de tabla", () => {
  const tareas = [
    t({ titulo: "Bravo", prioridad: 1, fecha: "2026-11-01" }),
    t({ titulo: "Alfa", prioridad: 3 }),
    t({ titulo: "Charlie", prioridad: 2, fecha: "2026-10-29", estado: "hecha" }),
    t({ titulo: "Delta", prioridad: 0, fecha: "2026-10-29", estado: "en_curso" }),
  ];

  it("filtra por estado y prioridad mínima, y ordena", () => {
    expect(aplicarTabla(tareas, leerConfig({})).map((x) => x.titulo)).toEqual(["Delta", "Bravo", "Alfa"]);
    expect(aplicarTabla(tareas, leerConfig({ orden: "prioridad", estado: "todas" })).map((x) => x.titulo)).toEqual(["Alfa", "Charlie", "Bravo", "Delta"]);
    expect(aplicarTabla(tareas, leerConfig({ orden: "titulo", prioridad: 2 })).map((x) => x.titulo)).toEqual(["Alfa"]);
    expect(aplicarTabla(tareas, leerConfig({ estado: "hechas" })).map((x) => x.titulo)).toEqual(["Charlie"]);
  });

  it("valida la configuración y la pasa a la URL", () => {
    expect(leerConfig({ orden: "hack", estado: "x", prioridad: 9 })).toEqual({ orden: "fecha", estado: "pendientes", prioridad: 0 });
    expect(aParametros({ orden: "prioridad", estado: "todas", prioridad: 2 })).toBe("vista=tabla&orden=prioridad&estado=todas&prioridad=2");
    expect(aParametros(leerConfig({}))).toBe("vista=tabla");
  });
});
