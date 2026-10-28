import { describe, expect, it } from "vitest";
import { detectarTipo, nombreSeguro, tamanoLegible } from "./archivos";

const bytes = (...valores: (number | string)[]) => {
  const lista = valores.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v]));
  return new Uint8Array([...lista, ...new Array(16).fill(0)]);
};

describe("detectarTipo", () => {
  it("reconoce fotos y PDF por su firma", () => {
    expect(detectarTipo(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe("image/webp");
    expect(detectarTipo(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectarTipo(bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectarTipo(bytes("%PDF-1.7"))).toBe("application/pdf");
  });

  it("rechaza lo demás aunque tenga un nombre engañoso", () => {
    expect(detectarTipo(bytes("<html><script>"))).toBeNull();
    expect(detectarTipo(bytes("<svg onload=x>"))).toBeNull();
    expect(detectarTipo(bytes("MZ", 0x90))).toBeNull(); // ejecutable de Windows
    expect(detectarTipo(new Uint8Array([0xff, 0xd8]))).toBeNull(); // demasiado corto
  });
});

describe("utilidades", () => {
  it("muestra tamaños legibles", () => {
    expect(tamanoLegible(300 * 1024)).toBe("300 KB");
    expect(tamanoLegible(1.25 * 1024 * 1024)).toBe("1.3 MB");
    expect(tamanoLegible(30 * 1024 * 1024)).toBe("30 MB");
    expect(tamanoLegible(10)).toBe("1 KB");
  });

  it("limpia nombres de archivo peligrosos", () => {
    expect(nombreSeguro("../../etc/passwd")).toBe("passwd");
    expect(nombreSeguro("C:\\Users\\x\\tesis.pdf")).toBe("tesis.pdf");
    expect(nombreSeguro('<img src=x onerror="a">.pdf')).toBe("img src=x onerror=a.pdf");
    expect(nombreSeguro("   ")).toBe("archivo");
  });
});
