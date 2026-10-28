import { expect, test } from "@playwright/test";

// /vitrina (datos ficticios) solo existe con ORBE_VITRINA=1 fuera de Vercel: en una compilación normal es privada.
const UUID = "00000000-0000-0000-0000-000000000000";
const RUTAS_PRIVADAS = [
  "/",
  "/tareas",
  `/tareas/${UUID}`,
  `/tareas/lista/${UUID}`,
  `/tareas/lista/${UUID}?vista=tablero`,
  "/apuntes",
  `/apuntes/${UUID}`,
  "/agenda",
  "/agenda?vista=dia&dia=2026-10-27",
  "/ajustes",
  "/papelera",
  "/apuntes/nueva",
  `/apuntes/${UUID}/historial`,
  "/ruta-que-no-existe",
  "/vitrina/hoy",
  "/vitrina/tareas",
  "/vitrina/agenda",
];

test.describe("Sin sesión no se ve nada privado", () => {
  for (const ruta of RUTAS_PRIVADAS) {
    test(`${ruta} redirige al login`, async ({ request }) => {
      const respuesta = await request.get(ruta, { maxRedirects: 0 });
      expect(respuesta.status()).toBe(307);
      expect(new URL(respuesta.headers().location!, "http://localhost").pathname).toBe("/login");
    });
  }

  test("el callback sin código vuelve al login con error", async ({ request }) => {
    const respuesta = await request.get("/auth/callback", { maxRedirects: 0 });
    expect(respuesta.status()).toBe(307);
    const destino = new URL(respuesta.headers().location!, "http://localhost");
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("error")).toBe("1");
  });

  test("el callback ignora destinos externos (sin open redirect)", async ({ request }) => {
    const respuesta = await request.get("/auth/callback?next=https://malicioso.example", { maxRedirects: 0 });
    expect(new URL(respuesta.headers().location!, "http://localhost").host).toBe("localhost:3000");
  });
});

test.describe("Cabeceras de seguridad", () => {
  test("el login envía CSP estricta y cabeceras de protección", async ({ request }) => {
    const respuesta = await request.get("/login");
    const h = respuesta.headers();
    const csp = h["content-security-policy"] ?? "";

    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age=63072000");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("cada request recibe un nonce distinto", async ({ request }) => {
    const nonce = async () =>
      (await request.get("/login")).headers()["content-security-policy"]?.match(/nonce-([^']+)/)?.[1];
    expect(await nonce()).not.toBe(await nonce());
  });

  test("todos los scripts de la página llevan nonce y no hay errores de CSP", async ({ page }) => {
    const errores: string[] = [];
    page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
    await page.goto("/login");

    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    const sinNonce = await page.locator("script:not([nonce])").count();
    expect(sinNonce).toBe(0);
    expect(errores).toEqual([]);
  });
});

test.describe("Tema claro / oscuro", () => {
  test("la cookie del tema fija la apariencia", async ({ page, context }) => {
    await context.addCookies([{ name: "tema", value: "oscuro", url: "http://localhost:3000" }]);
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("data-tema", "oscuro");
  });

  test("un valor manipulado se ignora y no se inyecta en la página", async ({ page, context }) => {
    await context.addCookies([{ name: "tema", value: 'oscuro"><img/src=x/onerror=alert(1)>', url: "http://localhost:3000" }]);
    await page.goto("/login");
    await expect(page.locator("html")).not.toHaveAttribute("data-tema", /.*/);
    expect(await page.locator("img[src=x]").count()).toBe(0);
  });
});
