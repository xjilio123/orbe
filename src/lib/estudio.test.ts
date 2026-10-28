import { describe, expect, it } from "vitest";
import type { Bloque } from "./bloques";
import { celdasDelMes, esPaginaDeTarjetas, mezclar, moverMesDiario, nombreMesDiario, resumenAnimo, tarjetasDe, tituloDiario } from "./estudio";

let n = 0;
const b = (tipo: Bloque["tipo"], texto = ""): Bloque => ({ id: `bloque-${++n}`, tipo, texto });

describe("tarjetas de estudio", () => {
  it("lee el formato de la IA: título 3 = pregunta, el texto siguiente = respuesta", () => {
    const tarjetas = tarjetasDe(
      [
        b("aviso", "Tarjetas creadas con IA."),
        b("h3", "1. ¿Qué hace ROW_NUMBER?"),
        b("p", "Numera las filas de cada grupo."),
        b("separador"),
        b("h3", "2. ¿LAG o LEAD?"),
        b("p", "LAG mira la fila anterior."),
        b("lista", "LEAD mira la siguiente."),
        b("h3", "3. Pregunta sin respuesta"),
        b("separador"),
        b("p", "Texto suelto que no es tarjeta"),
      ],
      "SQL",
    );
    expect(tarjetas.map((t) => [t.pregunta, t.respuesta, t.pagina])).toEqual([
      ["¿Qué hace ROW_NUMBER?", "Numera las filas de cada grupo.", "SQL"],
      ["¿LAG o LEAD?", "LAG mira la fila anterior.\n• LEAD mira la siguiente.", "SQL"],
    ]);
  });

  it("reconoce páginas de tarjetas por su título", () => {
    expect(esPaginaDeTarjetas("Tarjetas: SQL")).toBe(true);
    expect(esPaginaDeTarjetas("tarjetas de inglés")).toBe(true);
    expect(esPaginaDeTarjetas("Mis tarjetas")).toBe(false);
  });

  it("mezcla siempre igual con la misma semilla y sin perder tarjetas", () => {
    const lista = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(mezclar(lista, 42)).toEqual(mezclar(lista, 42));
    expect([...mezclar(lista, 7)].sort()).toEqual(lista);
    expect(mezclar(lista, 7)).not.toEqual(lista);
  });
});

describe("diario con ánimo", () => {
  it("arma el mes de lunes a domingo con huecos", () => {
    const octubre = celdasDelMes("2026-10");
    // El 1 de octubre de 2026 es jueves: 3 huecos (lunes a miércoles).
    expect(octubre.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(octubre.filter(Boolean)).toHaveLength(31);
    expect(octubre.length % 7).toBe(0);
  });

  it("resume el ánimo del mes", () => {
    const r = resumenAnimo([
      { fecha: "2026-10-01", animo: 5, pagina_id: "p1" },
      { fecha: "2026-10-02", animo: 4, pagina_id: null },
      { fecha: "2026-10-03", animo: 4, pagina_id: null },
      { fecha: "2026-10-04", animo: null, pagina_id: "p2" },
    ]);
    expect(r).toMatchObject({ registrados: 3, escritos: 2, promedio: 4.3, emojiPromedio: "🙂", maximo: 2 });
    expect(r.conteo.map((c) => c.dias)).toEqual([0, 0, 0, 2, 1]);
    expect(resumenAnimo([]).promedio).toBeNull();
  });

  it("navega meses y nombra días", () => {
    expect(moverMesDiario("2026-01", -1)).toBe("2025-12");
    expect(moverMesDiario("2026-12", 1)).toBe("2027-01");
    expect(nombreMesDiario("2026-10")).toBe("octubre 2026");
    expect(tituloDiario("2026-10-28")).toBe("28 oct 2026 · miércoles");
  });
});
