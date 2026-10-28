import { describe, expect, it } from "vitest";
import type { Bloque } from "./bloques";
import { completarEnlace, consultaEnlace, enlacesDe, normalizarTitulo, resolverEnlaces, sugerirPaginas } from "./enlaces";

const b = (tipo: Bloque["tipo"], texto: string): Bloque => ({ id: `b${texto.length}${tipo}`, tipo, texto });

const PAGINAS = [
  { id: "1", titulo: "SQL para Data Analytics", icono: "📊" },
  { id: "2", titulo: "Inglés", icono: "🇬🇧" },
  { id: "3", titulo: "Window functions", icono: "🪟" },
  { id: "4", titulo: "Ideas para Orbe", icono: "💡" },
];

describe("enlaces entre notas", () => {
  it("normaliza igual que la base", () => {
    expect(normalizarTitulo("  Window   Functions ")).toBe("window functions");
    expect(normalizarTitulo("Inglés Ñandú")).toBe("ingles nandu");
  });

  it("encuentra los [[enlaces]] sin repetir y sin mirar el código", () => {
    const bloques = [
      b("p", "Repasar [[Window functions]] y [[Inglés|mi curso]]."),
      b("lista", "Otra vez [[window  FUNCTIONS]] y [[]]"),
      b("codigo", "[[No cuenta]]"),
      b("h2", "[[SQL para Data Analytics]]"),
    ];
    expect(enlacesDe(bloques)).toEqual(["Window functions", "Inglés", "SQL para Data Analytics"]);
  });

  it("une cada enlace con su página, o lo deja para crear", () => {
    const r = resolverEnlaces(["window functions", "Ingles", "Página nueva", "Ideas para Orbe"], PAGINAS, "4");
    expect(r.map((x) => x.pagina?.id ?? null)).toEqual(["3", "2", null, null]);
  });

  it("detecta lo que se busca después de [[ según el cursor", () => {
    expect(consultaEnlace("Ver [[Win", 9)).toEqual({ consulta: "Win", desde: 4 });
    expect(consultaEnlace("Ver [[", 6)).toEqual({ consulta: "", desde: 4 });
    expect(consultaEnlace("Ver [[Win]] y", 13)).toBeNull();
    expect(consultaEnlace("Ver [Win", 8)).toBeNull();
  });

  it("completa el enlace sin duplicar el cierre", () => {
    expect(completarEnlace("Ver [[Win y más", 9, 4, "Window functions")).toEqual({ texto: "Ver [[Window functions]] y más", cursor: 24 });
    expect(completarEnlace("Ver [[Win]] y más", 9, 4, "Window functions")).toEqual({ texto: "Ver [[Window functions]] y más", cursor: 24 });
    expect(completarEnlace("[[", 2, 0, "Inglés")).toEqual({ texto: "[[Inglés]]", cursor: 10 });
  });

  it("sugiere primero las páginas que empiezan igual", () => {
    expect(sugerirPaginas("in", PAGINAS).map((p) => p.id)).toEqual(["2", "3"]);
    expect(sugerirPaginas("", PAGINAS, "1", 2).map((p) => p.id)).toEqual(["2", "3"]);
  });
});
