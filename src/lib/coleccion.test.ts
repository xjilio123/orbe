import { describe, expect, it } from "vitest";
import { fraccionObra, ordenarItems, resumenAnio, textoProgreso, type Obra } from "./coleccion";

const obra = (datos: Partial<Obra>): Obra => ({
  id: "o1",
  titulo: "Storytelling with Data",
  autor: "Cole Nussbaumer",
  tipo: "libro",
  estado: "en_curso",
  progreso: 0,
  total: null,
  nota: null,
  resena: "",
  terminado_en: null,
  ...datos,
});

describe("checklists", () => {
  it("deja lo pendiente arriba en su orden y lo marcado abajo", () => {
    const items = ordenarItems([
      { id: "a", texto: "Pan", hecho: true, orden: 0 },
      { id: "b", texto: "Leche", hecho: false, orden: 2 },
      { id: "c", texto: "Huevos", hecho: false, orden: 1 },
    ]);
    expect(items.map((i) => i.texto)).toEqual(["Huevos", "Leche", "Pan"]);
  });
});

describe("biblioteca", () => {
  it("calcula el avance y lo describe con la unidad de cada tipo", () => {
    expect(fraccionObra(obra({ progreso: 130, total: 260 }))).toBe(0.5);
    expect(fraccionObra(obra({ progreso: 10 }))).toBe(0);
    expect(fraccionObra(obra({ estado: "terminado" }))).toBe(1);
    expect(textoProgreso(obra({ progreso: 120, total: 260 }))).toBe("120 de 260 páginas");
    expect(textoProgreso(obra({ tipo: "serie", progreso: 4 }))).toBe("Vas en 4 episodios");
    expect(textoProgreso(obra({ estado: "quiero" }))).toBe("Pendiente");
    expect(textoProgreso(obra({ estado: "terminado", terminado_en: "2026-10-12" }))).toBe("Terminado el 12 oct");
  });

  it("resume lo terminado en el año por tipo", () => {
    const r = resumenAnio(
      [
        obra({ id: "1", estado: "terminado", terminado_en: "2026-03-01" }),
        obra({ id: "2", estado: "terminado", terminado_en: "2026-05-01", tipo: "serie" }),
        obra({ id: "3", estado: "terminado", terminado_en: "2025-12-31" }),
        obra({ id: "4" }),
      ],
      2026,
    );
    expect(r.total).toBe(2);
    expect(r.porTipo.map((x) => [x.tipo, x.cantidad])).toEqual([
      ["libro", 1],
      ["serie", 1],
    ]);
  });
});
