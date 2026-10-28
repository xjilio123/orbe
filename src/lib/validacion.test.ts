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

describe("esquemaTarea: repetición y aviso", () => {
  const base = { titulo: "Gimnasio", notas: "", estado: "pendiente", prioridad: "0", fecha: "2026-11-02", hora: "07:00", lista_id: "" };

  it("acepta repetición y aviso válidos y los vacíos como ninguno", () => {
    expect(esquemaTarea.parse({ ...base, repetir: "semanal", aviso: "15" })).toMatchObject({ repetir: "semanal", aviso: 15 });
    expect(esquemaTarea.parse({ ...base, repetir: "", aviso: "" })).toMatchObject({ repetir: null, aviso: null });
    expect(esquemaTarea.parse(base)).toMatchObject({ repetir: null, aviso: null });
  });

  it("rechaza valores inventados", () => {
    expect(esquemaTarea.safeParse({ ...base, repetir: "cada-hora" }).success).toBe(false);
    expect(esquemaTarea.safeParse({ ...base, aviso: "7" }).success).toBe(false);
  });

  it("para repetir hace falta una fecha", () => {
    const r = esquemaTarea.safeParse({ ...base, fecha: "", hora: "", repetir: "diaria" });
    expect(r.success).toBe(false);
    if (!r.success) expect(erroresDe(r.error).repetir).toContain("primera vez");
  });
});
