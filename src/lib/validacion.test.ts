import { describe, expect, it } from "vitest";
import { esquemaCaptura, esquemaLista, esquemaTarea, erroresDe } from "./validacion";

const base = { titulo: "Pagar luz", notas: "", estado: "pendiente", prioridad: "2", fecha: "", hora: "", lista_id: "" };

describe("esquemaTarea", () => {
  it("acepta una tarea válida y convierte los vacíos en null", () => {
    const r = esquemaTarea.parse({ ...base, fecha: "2026-10-30", hora: "09:00:00" });
    expect(r).toMatchObject({ titulo: "Pagar luz", prioridad: 2, fecha: "2026-10-30", hora: "09:00", lista_id: null });
  });

  it("limpia espacios y rechaza títulos vacíos", () => {
    expect(esquemaTarea.parse({ ...base, titulo: "  hola   mundo " }).titulo).toBe("hola mundo");
    expect(esquemaTarea.safeParse({ ...base, titulo: "   " }).success).toBe(false);
  });

  it("no acepta hora sin fecha", () => {
    const r = esquemaTarea.safeParse({ ...base, hora: "10:00" });
    expect(r.success).toBe(false);
    if (!r.success) expect(erroresDe(r.error).hora).toContain("fecha");
  });

  it("rechaza valores manipulados", () => {
    expect(esquemaTarea.safeParse({ ...base, estado: "borrada" }).success).toBe(false);
    expect(esquemaTarea.safeParse({ ...base, prioridad: "9" }).success).toBe(false);
    expect(esquemaTarea.safeParse({ ...base, fecha: "2026-13-40" }).success).toBe(false);
    expect(esquemaTarea.safeParse({ ...base, hora: "25:00" }).success).toBe(false);
    expect(esquemaTarea.safeParse({ ...base, lista_id: "' OR 1=1 --" }).success).toBe(false);
    expect(esquemaTarea.safeParse({ ...base, titulo: "x".repeat(201) }).success).toBe(false);
    expect(esquemaTarea.safeParse({ ...base, notas: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("esquemaCaptura y esquemaLista", () => {
  it("la captura necesita texto", () => {
    expect(esquemaCaptura.safeParse({ texto: "  " }).success).toBe(false);
    expect(esquemaCaptura.parse({ texto: " comprar pan " }).texto).toBe("comprar pan");
  });

  it("la lista necesita nombre y un color del sistema", () => {
    expect(esquemaLista.parse({ nombre: "Casa", color: "verde" })).toEqual({ nombre: "Casa", color: "verde" });
    expect(esquemaLista.safeParse({ nombre: "Casa", color: "#ff0000" }).success).toBe(false);
    expect(esquemaLista.safeParse({ nombre: "", color: "verde" }).success).toBe(false);
  });
});
