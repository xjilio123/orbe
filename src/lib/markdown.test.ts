import { describe, expect, it } from "vitest";
import type { Bloque } from "./bloques";
import { aMarkdown, deMarkdown, nombreArchivo, tituloDeArchivo } from "./markdown";
import { crc32, crearZip } from "./zip";

const b = (tipo: Bloque["tipo"], texto: string, hecho?: boolean): Bloque => ({ id: `id${Math.random().toString(36).slice(2, 10)}`, tipo, texto, ...(hecho !== undefined ? { hecho } : {}) });

describe("exportar a Markdown", () => {
  it("convierte cada tipo de bloque", () => {
    const md = aMarkdown("SQL", [
      b("h1", "Funciones"),
      b("p", "Ver [[Window functions]]."),
      b("lista", "uno"),
      b("lista", "dos"),
      b("num", "primero"),
      b("num", "segundo"),
      b("todo", "hecho", true),
      b("todo", "pendiente", false),
      b("cita", "una cita"),
      b("codigo", "select 1;"),
      b("aviso", "ojo"),
      b("separador", ""),
      b("imagen", "pizarra"),
    ]);
    expect(md).toBe(
      [
        "# SQL",
        "",
        "## Funciones",
        "",
        "Ver [[Window functions]].",
        "",
        "- uno",
        "- dos",
        "",
        "1. primero",
        "2. segundo",
        "",
        "- [x] hecho",
        "- [ ] pendiente",
        "",
        "> una cita",
        "",
        "```",
        "select 1;",
        "```",
        "",
        "> [!note] ojo",
        "",
        "---",
        "",
        "*(Foto: pizarra)*",
        "",
      ].join("\n"),
    );
  });
});

describe("importar Markdown de Obsidian", () => {
  it("entiende el título, listas, casillas, avisos, código y quita el YAML", () => {
    const { titulo, bloques } = deMarkdown(
      [
        "---",
        "tipo: apunte",
        "tags: [sql]",
        "---",
        "# Window functions",
        "",
        "Calculan sobre grupos de filas.",
        "Sin colapsarlas.",
        "",
        "## Ejemplos",
        "- ROW_NUMBER",
        "* LAG",
        "1. Primero",
        "- [x] Repasado",
        "- [ ] Practicar",
        "> [!tip] Importante",
        "> Ver [[SQL para Data Analytics]]",
        "> Cita normal",
        "```sql",
        "select row_number() over ();",
        "```",
        "***",
        "![[pizarra.png]]",
      ].join("\r\n"),
    );
    expect(titulo).toBe("Window functions");
    expect(bloques.map((x) => [x.tipo, x.texto, x.hecho])).toEqual([
      ["p", "Calculan sobre grupos de filas.\nSin colapsarlas.", undefined],
      ["h1", "Ejemplos", undefined],
      ["lista", "ROW_NUMBER", undefined],
      ["lista", "LAG", undefined],
      ["num", "Primero", undefined],
      ["todo", "Repasado", true],
      ["todo", "Practicar", false],
      ["aviso", "Importante\nVer [[SQL para Data Analytics]]\nCita normal", undefined],
      ["codigo", "select row_number() over ();", undefined],
      ["separador", "", undefined],
      ["p", "📎 pizarra.png", undefined],
    ]);
  });

  it("ida y vuelta: exportar e importar deja los mismos bloques", () => {
    const originales = [b("h2", "Tema"), b("p", "Texto con [[enlace]]"), b("todo", "tarea", true), b("codigo", "x = 1")];
    const { titulo, bloques } = deMarkdown(aMarkdown("Mi nota", originales));
    expect(titulo).toBe("Mi nota");
    expect(bloques.map((x) => [x.tipo, x.texto])).toEqual(originales.map((x) => [x.tipo, x.texto]));
  });

  it("arma títulos y nombres de archivo seguros", () => {
    expect(tituloDeArchivo("Estudios/SQL/Window functions.md")).toBe("Window functions");
    expect(nombreArchivo('¿Qué es SQL? / "Notas"')).toBe("¿Qué es SQL- - -Notas-");
    expect(nombreArchivo("")).toBe("Sin título");
  });
});

describe("zip", () => {
  it("calcula el CRC32 estándar", () => {
    expect(crc32(new TextEncoder().encode("123456789")).toString(16)).toBe("cbf43926");
  });

  it("arma un zip con cabeceras, directorio y fin", () => {
    const zip = crearZip([
      { nombre: "Apuntes/Inglés.md", contenido: "# Inglés\n" },
      { nombre: "SQL.md", contenido: "# SQL\n" },
    ]);
    const vista = new DataView(zip.buffer);
    expect(vista.getUint32(0, true)).toBe(0x04034b50);
    const fin = zip.length - 22;
    expect(vista.getUint32(fin, true)).toBe(0x06054b50);
    expect(vista.getUint16(fin + 10, true)).toBe(2);
    const inicioCentral = vista.getUint32(fin + 16, true);
    expect(vista.getUint32(inicioCentral, true)).toBe(0x02014b50);
  });
});
