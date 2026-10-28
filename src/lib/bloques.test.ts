import { describe, expect, it } from "vitest";
import { adjuntosDe, atajo, esquemaPagina, nuevoBloque, nuevoId, numeracion, resumen, tipoSiguiente, type Bloque } from "./bloques";

const b = (tipo: Bloque["tipo"], texto = "", extra: Partial<Bloque> = {}): Bloque => ({ ...nuevoBloque(tipo, texto), ...extra });

describe("atajos al escribir", () => {
  it("convierte los atajos de Markdown al inicio de un párrafo", () => {
    expect(atajo("# ", "p")).toBe("h1");
    expect(atajo("## ", "p")).toBe("h2");
    expect(atajo("### ", "p")).toBe("h3");
    expect(atajo("- ", "p")).toBe("lista");
    expect(atajo("* ", "p")).toBe("lista");
    expect(atajo("1. ", "p")).toBe("num");
    expect(atajo("[] ", "p")).toBe("todo");
    expect(atajo("[ ] ", "p")).toBe("todo");
    expect(atajo("> ", "p")).toBe("cita");
    expect(atajo("```", "p")).toBe("codigo");
    expect(atajo("---", "p")).toBe("separador");
  });

  it("no cambia nada en medio de un texto ni fuera de un párrafo", () => {
    expect(atajo("hola # ", "p")).toBeNull();
    expect(atajo("#hola", "p")).toBeNull();
    expect(atajo("- ", "h1")).toBeNull();
  });
});

describe("Enter y numeración", () => {
  it("las listas continúan y los títulos vuelven a texto", () => {
    expect(tipoSiguiente("lista")).toBe("lista");
    expect(tipoSiguiente("todo")).toBe("todo");
    expect(tipoSiguiente("h1")).toBe("p");
    expect(tipoSiguiente("cita")).toBe("p");
  });

  it("numera cada lista por separado", () => {
    const bloques = [b("num"), b("num"), b("p"), b("num")];
    const n = numeracion(bloques);
    expect(bloques.map((x) => n.get(x.id) ?? null)).toEqual([1, 2, null, 1]);
  });
});

describe("esquemaPagina", () => {
  it("acepta una página válida y limpia el título", () => {
    const r = esquemaPagina.parse({ titulo: "  Mis   notas ", icono: "📘", contenido: [b("h1", "Hola"), b("todo", "x", { hecho: true })] });
    expect(r.titulo).toBe("Mis notas");
    expect(r.contenido).toHaveLength(2);
  });

  it("rechaza bloques manipulados", () => {
    const base = { titulo: "", icono: "" };
    expect(esquemaPagina.safeParse({ ...base, contenido: [{ id: "abcdefgh", tipo: "script", texto: "" }] }).success).toBe(false);
    expect(esquemaPagina.safeParse({ ...base, contenido: [{ id: "<img onerror>", tipo: "p", texto: "" }] }).success).toBe(false);
    expect(esquemaPagina.safeParse({ ...base, contenido: [{ id: "abcdefgh", tipo: "p", texto: "x".repeat(10_001) }] }).success).toBe(false);
    expect(esquemaPagina.safeParse({ ...base, contenido: [{ id: "abcdefgh", tipo: "imagen", texto: "", adjunto: "../../etc" }] }).success).toBe(false);
    expect(esquemaPagina.safeParse({ ...base, contenido: Array.from({ length: 2001 }, () => b("p")) }).success).toBe(false);
  });
});

describe("utilidades", () => {
  it("los ids son cortos, válidos y distintos", () => {
    const id = nuevoId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(nuevoId()).not.toBe(id);
  });

  it("lista los adjuntos sin repetir", () => {
    const a = "00000000-0000-4000-8000-000000000001";
    expect(adjuntosDe([b("imagen", "", { adjunto: a }), b("p", "x"), b("archivo", "", { adjunto: a })])).toEqual([a]);
  });

  it("arma un resumen del texto", () => {
    expect(resumen([b("h1", "Plan"), b("separador"), b("p", "  comprar pan  ")])).toBe("Plan · comprar pan");
    expect(resumen([b("p", "x".repeat(200))], 10)).toBe(`${"x".repeat(9)}…`);
  });
});
