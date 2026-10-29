import { describe, expect, it } from "vitest";
import { bloquesDe, enlaceSeguro, leerCompartido, notasDe, tituloDe } from "./compartir";

describe("compartir hacia Orbe", () => {
  it("separa el enlace del texto cuando la app lo manda junto", () => {
    const c = leerCompartido({ titulo: "", texto: "Mira este curso https://platzi.com/cursos/power-bi/ está bueno" });
    expect(c.url).toBe("https://platzi.com/cursos/power-bi/");
    expect(c.texto).toBe("Mira este curso  está bueno");
  });

  it("solo acepta enlaces http(s)", () => {
    expect(enlaceSeguro("javascript:alert(1)")).toBe("");
    expect(enlaceSeguro("https://ejemplo.com/a")).toBe("https://ejemplo.com/a");
    expect(leerCompartido({ url: "data:text/html,hola" }).url).toBe("");
  });

  it("elige un buen título y arma las notas y los bloques", () => {
    const conTitulo = leerCompartido({ titulo: "Artículo sobre SQL", texto: "Window functions explicadas", url: "https://ejemplo.com/sql" });
    expect(tituloDe(conTitulo)).toBe("Artículo sobre SQL");
    expect(notasDe(conTitulo)).toBe("Window functions explicadas\n\nhttps://ejemplo.com/sql");
    expect(bloquesDe(conTitulo).map((b) => b.texto)).toEqual(["Window functions explicadas", "🔗 https://ejemplo.com/sql"]);

    expect(tituloDe(leerCompartido({ texto: "Comprar pilas\nAA y AAA" }))).toBe("Comprar pilas");
    expect(tituloDe(leerCompartido({ url: "https://www.youtube.com/watch?v=x" }))).toBe("youtube.com");
    expect(tituloDe(leerCompartido({}))).toBe("Compartido");
  });
});
