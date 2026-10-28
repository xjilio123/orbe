import { afterEach, describe, expect, it, vi } from "vitest";
import { vitrinaActiva } from "./vitrina";

afterEach(() => vi.unstubAllEnvs());

describe("vitrinaActiva", () => {
  it("está apagada por defecto", () => {
    vi.stubEnv("ORBE_VITRINA", "");
    expect(vitrinaActiva()).toBe(false);
  });

  it("se activa solo con ORBE_VITRINA=1 fuera de Vercel", () => {
    vi.stubEnv("ORBE_VITRINA", "1");
    vi.stubEnv("VERCEL", "");
    expect(vitrinaActiva()).toBe(true);
  });

  it("nunca existe en Vercel aunque alguien ponga la variable", () => {
    vi.stubEnv("ORBE_VITRINA", "1");
    vi.stubEnv("VERCEL", "1");
    expect(vitrinaActiva()).toBe(false);
  });
});
