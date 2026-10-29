import { describe, expect, it } from "vitest";
import { leerClave, textoUso } from "./atajoClave";

describe("atajo de Siri", () => {
  it("lee la clave con o sin 'Bearer' y rechaza formatos raros", () => {
    const clave = "orbe_abcdefghijklmnopqrstuvwxyz012345";
    expect(leerClave(`Bearer ${clave}`)).toBe(clave);
    expect(leerClave(`bearer   ${clave} `)).toBe(clave);
    expect(leerClave(clave)).toBe(clave);
    expect(leerClave("Bearer otra_cosa_que_no_es_una_clave_de_orbe")).toBeNull();
    expect(leerClave("Bearer orbe_corta")).toBeNull();
    expect(leerClave(`Bearer ${clave}' or 1=1`)).toBeNull();
    expect(leerClave(null)).toBeNull();
  });

  it("describe el último uso", () => {
    const ahora = Date.parse("2026-10-28T20:00:00Z");
    expect(textoUso(null, ahora)).toBe("Aún sin usar");
    expect(textoUso("2026-10-28T19:59:30Z", ahora)).toBe("Usada recién");
    expect(textoUso("2026-10-28T19:15:00Z", ahora)).toBe("Usada hace 45 min");
    expect(textoUso("2026-10-28T15:00:00Z", ahora)).toBe("Usada hace 5 h");
    expect(textoUso("2026-10-24T20:00:00Z", ahora)).toBe("Usada hace 4 días");
  });
});
