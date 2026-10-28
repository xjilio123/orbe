import { expect, test } from "@playwright/test";

test.describe("PWA instalable", () => {
  test("el manifest describe la app para instalarla", async ({ request }) => {
    const respuesta = await request.get("/manifest.webmanifest", { maxRedirects: 0 });
    expect(respuesta.status()).toBe(200);
    const manifest = await respuesta.json();
    expect(manifest).toMatchObject({ name: "Orbe", display: "standalone", start_url: "/" });
    expect(manifest.icons).toHaveLength(3);
  });

  test("el service worker se sirve sin caché y sin pasar por el login", async ({ request }) => {
    const respuesta = await request.get("/sw.js", { maxRedirects: 0 });
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("javascript");
    expect(respuesta.headers()["cache-control"]).toContain("no-store");
    // Privacidad del modo sin conexión: nunca guarda el login ni la autenticación, y borra las copias al cerrar sesión.
    const codigo = await respuesta.text();
    expect(codigo).toContain('const NUNCA_GUARDAR = ["/login", "/auth/"');
    expect(codigo).toContain('if (datos.tipo === "olvidar")');
    expect(codigo).toContain("caches.delete(PANTALLAS)");
  });

  test("los íconos están disponibles", async ({ request }) => {
    for (const ruta of ["/iconos/icono-192.png", "/iconos/icono-512.png", "/iconos/icono-maskable-512.png", "/apple-icon.png"]) {
      const respuesta = await request.get(ruta, { maxRedirects: 0 });
      expect(respuesta.status(), ruta).toBe(200);
      expect(respuesta.headers()["content-type"]).toBe("image/png");
    }
  });

  test("la pantalla sin conexión es pública y no tiene datos", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.getByRole("heading", { name: "Sin conexión" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reintentar" })).toHaveAttribute("href", "/");
  });
});
