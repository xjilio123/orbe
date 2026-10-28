import { expect, test, type Page } from "@playwright/test";

/**
 * Prueba de fluidez: cada pantalla real (en la vitrina, con datos ficticios) se mide como en un iPhone
 * con la CPU 4 veces más lenta. Falla si algo salta al abrir (CLS), si tarda en mostrarse,
 * si bloquea la pantalla mucho tiempo o si el JavaScript crece de más.
 * Corre con ORBE_VITRINA=1 FLUIDEZ=1 (job "Fluidez" en GitHub Actions).
 */

const PRESUPUESTO = {
  /** Suma de saltos de diseño al abrir. 0 = nada se mueve; Google considera "bueno" hasta 0.1. */
  saltos: 0.01,
  /**
   * Máximo que se mueve cualquier bloque visible desde que aparece (px). Detecta el "tirón" aunque
   * Chrome no lo cuente como salto (por ejemplo, un aviso que aparece arriba después de cargar).
   */
  movimiento: 1,
  /** Primer contenido visible (ms), CPU 4× más lenta. */
  primerContenido: 1500,
  /** Tiempo total de bloqueo del hilo principal al abrir (ms), CPU 4× más lenta. */
  bloqueo: 600,
  /** Cambio de pestaña hasta ver el título nuevo (ms), CPU 4× más lenta. */
  cambioPestana: 800,
  /** JavaScript que descarga la primera pantalla (KB comprimidos). */
  javascriptKb: 260,
  /** Tocar el check de una tarea hasta verlo marcado (ms), CPU 4× más lenta. */
  check: 150,
  /** Lo más lento que tarda en responder una tecla en el editor (ms), CPU 4× más lenta. Google: "bueno" ≤ 200. */
  tecla: 120,
};

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const LISTA = "/vitrina/tareas/lista/00000000-0000-4000-8000-0000000000a2";
const PANTALLAS = [
  { ruta: "/vitrina/hoy", titulo: "Hoy" },
  { ruta: "/vitrina/tareas", titulo: "Tareas" },
  { ruta: "/vitrina/tareas/00000000-0000-4000-8000-000000000001", titulo: "Detalle" },
  { ruta: LISTA, titulo: "Trabajo" },
  { ruta: `${LISTA}?vista=tablero`, titulo: "Trabajo" },
  { ruta: "/vitrina/apuntes", titulo: "Apuntes" },
  { ruta: "/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1", titulo: "SQL para Data Analytics" },
  { ruta: "/vitrina/agenda", titulo: "Agenda" },
  { ruta: "/vitrina/ajustes", titulo: "Ajustes" },
  { ruta: "/login", titulo: "Orbe" },
];

test.use({ userAgent: IPHONE_SAFARI, viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });

type Medicion = { saltos: number; movimiento: number; primerContenido: number; bloqueo: number; javascriptKb: number };

async function prepararMedicion(page: Page) {
  // Observadores de rendimiento del navegador, instalados antes de que cargue la página.
  await page.addInitScript(() => {
    const w = window as unknown as { __saltos: number; __bloqueo: number; __movimiento: number };
    w.__saltos = 0;
    w.__bloqueo = 0;
    w.__movimiento = 0;
    // Posición de cada bloque de la pantalla en cada cuadro: si uno se corre después de aparecer, es un tirón.
    const primeraPosicion = new WeakMap<Element, number>();
    let cuadros = 0;
    const seguir = () => {
      for (const bloque of document.querySelectorAll("main > *, main h1")) {
        const caja = bloque.getBoundingClientRect();
        // Los elementos flotantes (avisos) entran con su propia animación y no empujan a nadie.
        if (caja.height === 0 || getComputedStyle(bloque).position === "fixed") continue;
        const antes = primeraPosicion.get(bloque);
        if (antes === undefined) primeraPosicion.set(bloque, caja.top);
        else w.__movimiento = Math.max(w.__movimiento, Math.abs(caja.top - antes));
      }
      if (++cuadros < 600) requestAnimationFrame(seguir);
    };
    requestAnimationFrame(seguir);
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) w.__saltos += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) w.__bloqueo += Math.max(0, e.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  });
  // Calienta el navegador con un archivo del mismo sitio: así no se mide el arranque del proceso
  // de Chromium (en Windows tarda ~1.7 s), sino solo lo que hace Orbe.
  await page.goto("/iconos/icono-192.png");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

async function medir(page: Page): Promise<Medicion> {
  // Espera a que terminen la hidratación y los avisos que aparecen después de cargar.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const w = window as unknown as { __saltos: number; __bloqueo: number; __movimiento: number };
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? Infinity;
    const js = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .filter((r) => r.initiatorType === "script" || r.name.endsWith(".js"))
      .reduce((total, r) => total + (r.encodedBodySize || r.transferSize), 0);
    return { saltos: w.__saltos, movimiento: w.__movimiento, primerContenido: fcp, bloqueo: w.__bloqueo, javascriptKb: js / 1024 };
  });
}

test.describe("Fluidez al abrir cada pantalla (iPhone, CPU 4× más lenta)", () => {
  for (const p of PANTALLAS) {
    test(`${p.ruta} abre sin saltos y rápido`, async ({ page }) => {
      await prepararMedicion(page);
      await page.goto(p.ruta);
      await expect(page.getByRole("heading", { level: 1, name: p.titulo })).toBeVisible();
      const m = await medir(page);
      console.log(
        `${p.ruta.padEnd(18)} saltos ${m.saltos.toFixed(3)} · movimiento ${Math.round(m.movimiento)} px · contenido ${Math.round(m.primerContenido)} ms · bloqueo ${Math.round(m.bloqueo)} ms · JS ${Math.round(m.javascriptKb)} KB`,
      );
      expect(m.saltos, "saltos de diseño").toBeLessThanOrEqual(PRESUPUESTO.saltos);
      expect(m.movimiento, "bloques que se corren al abrir (el 'tirón')").toBeLessThanOrEqual(PRESUPUESTO.movimiento);
      expect(m.primerContenido, "primer contenido visible").toBeLessThanOrEqual(PRESUPUESTO.primerContenido);
      expect(m.bloqueo, "bloqueo del hilo principal").toBeLessThanOrEqual(PRESUPUESTO.bloqueo);
      expect(m.javascriptKb, "JavaScript de la pantalla").toBeLessThanOrEqual(PRESUPUESTO.javascriptKb);
    });
  }
});

test.describe("Fluidez al cambiar de pestaña (CPU 4× más lenta)", () => {
  test("cada pestaña aparece rápido y sin saltos", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/hoy");
    await medir(page); // deja que se precarguen las demás pestañas, como en el uso real
    for (const destino of ["Tareas", "Apuntes", "Agenda", "Hoy"]) {
      const inicio = Date.now();
      await page.getByRole("link", { name: destino, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1, name: destino })).toBeVisible();
      const ms = Date.now() - inicio;
      console.log(`pestaña ${destino.padEnd(8)} ${ms} ms`);
      expect(ms, `cambio a ${destino}`).toBeLessThanOrEqual(PRESUPUESTO.cambioPestana);
    }
    const saltos = await page.evaluate(() => (window as unknown as { __saltos: number }).__saltos);
    expect(saltos, "saltos al navegar").toBeLessThanOrEqual(PRESUPUESTO.saltos);
  });
});

test.describe("Fluidez al usar las tareas (CPU 4× más lenta)", () => {
  test("el check responde al instante, sin esperar al servidor", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/tareas");
    await medir(page);
    const check = page.getByRole("checkbox", { name: /Marcar “Ideas para el diseño de Orbe” como hecha/ });
    const ms = await check.evaluate(async (boton) => {
      const inicio = performance.now();
      (boton as HTMLButtonElement).click();
      // Espera al siguiente cuadro pintado con el check marcado.
      while (boton.getAttribute("aria-checked") !== "true") await new Promise((r) => requestAnimationFrame(r));
      return performance.now() - inicio;
    });
    console.log(`check marcado en ${Math.round(ms)} ms`);
    expect(ms, "tiempo hasta ver el check marcado").toBeLessThanOrEqual(PRESUPUESTO.check);
  });

  test("escribir en la captura muestra lo que entendió sin mover la pantalla", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/hoy");
    await medir(page);
    const seccion = page.getByRole("heading", { name: "Para hoy" });
    const antes = (await seccion.boundingBox())!.y;
    await page.getByLabel("Captura rápida").pressSequentially("pagar luz el viernes 9am #casa !!");
    await expect(page.getByText("vie 30 oct")).toBeVisible();
    await expect(page.getByText("#casa")).toBeVisible();
    await expect(page.getByText("Prioridad !!")).toBeVisible();
    expect((await seccion.boundingBox())!.y, "la lista no se corre al escribir").toBe(antes);
  });
});

test.describe("Fluidez al escribir apuntes (CPU 4× más lenta)", () => {
  test("cada tecla responde rápido y Enter no mueve lo de arriba", async ({ page }) => {
    await prepararMedicion(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __teclaMax: number };
      w.__teclaMax = 0;
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) w.__teclaMax = Math.max(w.__teclaMax, e.duration);
      }).observe({ type: "event", durationThreshold: 16, buffered: true } as PerformanceObserverInit);
    });
    await page.goto("/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1");
    await medir(page);

    // Posición dentro de la página (no en pantalla): al tocar un bloque la página se desplaza hacia él, y eso no es un salto.
    const titulo = page.getByRole("textbox", { name: "Título 2" });
    const posicion = () => titulo.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const antes = await posicion();
    const ultimo = page.getByRole("textbox", { name: /Escribe, o usa #/ }).last();
    await ultimo.click();
    await ultimo.pressSequentially("Las funciones de ventana sirven para rankings y acumulados.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("- ");
    await page.keyboard.type("Nuevo punto de la lista");
    await expect(page.getByRole("textbox", { name: "Elemento de la lista" }).last()).toHaveValue("Nuevo punto de la lista");

    const teclaMax = await page.evaluate(() => (window as unknown as { __teclaMax: number }).__teclaMax);
    console.log(`tecla más lenta en el editor: ${Math.round(teclaMax)} ms`);
    expect(teclaMax, "respuesta de la tecla más lenta").toBeLessThanOrEqual(PRESUPUESTO.tecla);
    expect(await posicion(), "lo de arriba no se mueve al escribir").toBe(antes);
  });
});
