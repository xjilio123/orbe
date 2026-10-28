import { describe, expect, it } from "vitest";
import { preguntar } from "./preguntar";

const trozos = [
  { pagina_id: "p1", titulo: "SQL", icono: "📊", texto: "ROW_NUMBER numera filas." },
  { pagina_id: "p1", titulo: "SQL", icono: "📊", texto: "LAG compara con la fila anterior." },
  { pagina_id: "p2", titulo: "", icono: "", texto: "Notas sueltas." },
];

describe("pregunta a tus notas", () => {
  it("numera los fragmentos para que la IA los cite", () => {
    const texto = preguntar.contexto("¿Qué hace LAG?", trozos);
    expect(texto).toContain("Pregunta: ¿Qué hace LAG?");
    expect(texto).toContain("[2] (SQL) LAG compara con la fila anterior.");
    expect(texto).toContain("[3] (Sin título) Notas sueltas.");
  });

  it("las fuentes son páginas que existen, sin repetir", () => {
    const r = preguntar.limpiar({ respuesta: "LAG compara filas.", fuentes: [2, 1, 9, 0, 1.5, 3] }, trozos);
    expect(r.fuentes).toEqual([
      { id: "p1", titulo: "SQL", icono: "📊" },
      { id: "p2", titulo: "Sin título", icono: "" },
    ]);
  });
});
