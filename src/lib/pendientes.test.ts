import { describe, expect, it } from "vitest";
import { agregarPendiente, enviarPendientes, leerPendientes, olvidarPendientes } from "./pendientes";

function almacen() {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  };
}

const base = { capturado_el: "2026-10-27" };

describe("capturas sin conexión", () => {
  it("guarda en orden y no acepta textos vacíos", () => {
    const a = almacen();
    expect(agregarPendiente({ ...base, texto: "pagar luz mañana" }, a)).toBe(true);
    expect(agregarPendiente({ ...base, texto: "   " }, a)).toBe(false);
    expect(agregarPendiente({ ...base, texto: "llamar a mamá", lista_id: "l1" }, a)).toBe(true);
    expect(leerPendientes(a).map((p) => p.texto)).toEqual(["pagar luz mañana", "llamar a mamá"]);
  });

  it("ignora datos dañados", () => {
    const a = almacen();
    a.setItem("orbe:pendientes", "{no es json");
    expect(leerPendientes(a)).toEqual([]);
    a.setItem("orbe:pendientes", JSON.stringify([{ id: 1 }, { id: "x", texto: "ok", capturado_el: "2026-10-27" }]));
    expect(leerPendientes(a)).toHaveLength(1);
  });

  it("al volver la conexión envía todo con la fecha en que se escribió", async () => {
    const a = almacen();
    agregarPendiente({ ...base, texto: "uno" }, a);
    agregarPendiente({ ...base, texto: "dos", fecha_defecto: "2026-11-02" }, a);
    const enviados: Record<string, string>[] = [];
    const n = await enviarPendientes(async (anterior, fd) => {
      enviados.push(Object.fromEntries(fd.entries()) as Record<string, string>);
      return { ok: true, n: anterior.n + 1 };
    }, a);
    expect(n).toBe(2);
    expect(enviados[1]).toEqual({ texto: "dos", capturado_el: "2026-10-27", fecha_defecto: "2026-11-02" });
    expect(leerPendientes(a)).toEqual([]);
  });

  it("si la red vuelve a fallar, guarda lo que falta", async () => {
    const a = almacen();
    agregarPendiente({ ...base, texto: "uno" }, a);
    agregarPendiente({ ...base, texto: "dos" }, a);
    let llamadas = 0;
    const n = await enviarPendientes(async (anterior) => {
      if (++llamadas === 2) throw new Error("Failed to fetch");
      return { ok: true, n: anterior.n + 1 };
    }, a);
    expect(n).toBe(1);
    expect(leerPendientes(a).map((p) => p.texto)).toEqual(["dos"]);
  });

  it("lo que el servidor rechaza no se reintenta sin fin", async () => {
    const a = almacen();
    agregarPendiente({ ...base, texto: "!!!" }, a);
    await enviarPendientes(async (anterior) => ({ ...anterior, ok: false, error: "Falta el título" }), a);
    expect(leerPendientes(a)).toEqual([]);
  });

  it("cerrar sesión borra lo pendiente", () => {
    const a = almacen();
    agregarPendiente({ ...base, texto: "privado" }, a);
    olvidarPendientes(a);
    expect(leerPendientes(a)).toEqual([]);
  });
});
