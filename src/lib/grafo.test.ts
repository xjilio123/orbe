import { describe, expect, it } from "vitest";
import { MAX_NODOS, armarGrafo, distribuir, type Arista, type Nodo } from "./grafo";

const nodo = (id: string): Nodo => ({ id, titulo: `Página ${id}`, icono: "📄" });

describe("mapa de notas", () => {
  it("quita conexiones repetidas, sueltas o consigo misma", () => {
    const nodos = ["a", "b", "c"].map(nodo);
    const aristas: Arista[] = [
      { origen: "a", destino: "b", tipo: "enlace" },
      { origen: "b", destino: "a", tipo: "dentro" },
      { origen: "a", destino: "a", tipo: "enlace" },
      { origen: "a", destino: "zz", tipo: "enlace" },
      { origen: "b", destino: "c", tipo: "enlace" },
    ];
    const g = armarGrafo(nodos, aristas);
    expect(g.aristas).toHaveLength(2);
    expect(g.grado.get("b")).toBe(2);
  });

  it("si hay demasiadas páginas, se queda con las más conectadas", () => {
    const nodos = Array.from({ length: MAX_NODOS + 20 }, (_, i) => nodo(`n${String(i).padStart(3, "0")}`));
    const aristas: Arista[] = [{ origen: "n260", destino: "n261", tipo: "enlace" }];
    const g = armarGrafo(nodos, aristas);
    expect(g.nodos).toHaveLength(MAX_NODOS);
    expect(g.nodos.slice(0, 2).map((n) => n.id).sort()).toEqual(["n260", "n261"]);
    expect(g.aristas).toHaveLength(1);
  });

  it("ubica todo dentro del lienzo y siempre igual", () => {
    const nodos = ["a", "b", "c", "d", "e"].map(nodo);
    const aristas: Arista[] = [
      { origen: "a", destino: "b", tipo: "enlace" },
      { origen: "b", destino: "c", tipo: "enlace" },
      { origen: "c", destino: "a", tipo: "dentro" },
    ];
    const uno = distribuir(nodos, aristas, 400, 500);
    const dos = distribuir(nodos, aristas, 400, 500);
    expect(uno).toEqual(dos);
    for (const n of uno) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(400);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(500);
    }
    // Las conectadas quedan más cerca entre sí que de la que está sola.
    const p = Object.fromEntries(uno.map((n) => [n.id, n]));
    const dist = (a: string, b: string) => Math.hypot(p[a].x - p[b].x, p[a].y - p[b].y);
    expect(dist("a", "b")).toBeLessThan(dist("a", "e"));
    expect(distribuir([], [], 400, 500)).toEqual([]);
    expect(distribuir([nodo("x")], [], 400, 500)[0]).toMatchObject({ x: 200, y: 250 });
  });
});
