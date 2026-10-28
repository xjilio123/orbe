import { describe, expect, it } from "vitest";
import { COMANDOS, filtrarComandos } from "./comandos";

describe("filtrarComandos", () => {
  it("sin texto muestra todos", () => {
    expect(filtrarComandos("  ")).toEqual(COMANDOS);
  });

  it("encuentra por prefijo, sin tildes y por palabras clave", () => {
    expect(filtrarComandos("ag").map((c) => c.id)).toEqual(["agenda"]);
    expect(filtrarComandos("PÁGINA").map((c) => c.id)).toEqual(["nueva-pagina", "apuntes"]);
    expect(filtrarComandos("recuperar").map((c) => c.id)).toEqual(["papelera"]);
    expect(filtrarComandos("tema osc").map((c) => c.id)).toEqual(["ajustes"]);
  });

  it("si nada coincide no muestra nada", () => {
    expect(filtrarComandos("zzz")).toEqual([]);
  });
});
