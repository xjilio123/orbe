import { describe, expect, it } from "vitest";
import { diasRestantes, grupo, limitePapelera, raices } from "./papelera";
import { PLANTILLAS, copiarComoPlantilla, desdePlantilla } from "./plantillas";

const A = "2026-10-20T10:00:00Z";
const B = "2026-10-25T10:00:00Z";
const items = [
  { id: "p", padre_id: null, borrado_en: A },
  { id: "h1", padre_id: "p", borrado_en: A },
  { id: "n1", padre_id: "h1", borrado_en: A },
  { id: "h2", padre_id: "p", borrado_en: B }, // se borró sola, otro día
  { id: "x", padre_id: "otra", borrado_en: B },
];

describe("papelera", () => {
  it("muestra solo lo que se borró a mano, lo más reciente primero", () => {
    expect(raices(items).map((i) => i.id)).toEqual(["h2", "x", "p"]);
  });

  it("restaura junto lo que se borró a la misma hora", () => {
    expect(grupo(items, "p")).toEqual(["p", "h1", "n1"]);
    expect(grupo(items, "h2")).toEqual(["h2"]);
    expect(grupo(items, "no-existe")).toEqual([]);
  });

  it("cuenta los días que quedan", () => {
    expect(diasRestantes(A, new Date("2026-10-20T11:00:00Z"))).toBe(30);
    expect(diasRestantes(A, new Date("2026-11-18T10:00:00Z"))).toBe(1);
    expect(diasRestantes(A, new Date("2026-12-30T10:00:00Z"))).toBe(0);
    expect(limitePapelera(new Date("2026-11-19T10:00:00Z"))).toBe("2026-10-20T10:00:00.000Z");
  });
});

describe("plantillas", () => {
  it("cada plantilla de Orbe crea una página válida con ids distintos", () => {
    for (const p of PLANTILLAS) {
      const pagina = desdePlantilla(p.id)!;
      expect(pagina.contenido.length).toBeGreaterThan(3);
      expect(new Set(pagina.contenido.map((b) => b.id)).size).toBe(pagina.contenido.length);
    }
    expect(desdePlantilla("inventada")).toBeNull();
  });

  it("copiar una página tuya no copia fotos ni PDF y deja las casillas sin marcar", () => {
    const copia = copiarComoPlantilla({
      titulo: "Viaje",
      icono: "✈️",
      contenido: [
        { id: "aaaaaa", tipo: "todo", texto: "Pasaporte", hecho: true },
        { id: "bbbbbb", tipo: "imagen", texto: "", adjunto: "00000000-0000-4000-8000-000000000001" },
        { id: "cccccc", tipo: "separador", texto: "" },
      ],
    });
    expect(copia.contenido.map((b) => b.tipo)).toEqual(["todo", "separador"]);
    expect(copia.contenido[0]).toMatchObject({ texto: "Pasaporte", hecho: false });
    expect(copia.contenido[0].id).not.toBe("aaaaaa");
  });
});
