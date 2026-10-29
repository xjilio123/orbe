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
  /** Tocar la lupa hasta ver la barra ⌘K lista para escribir (ms), CPU 4× más lenta. */
  barra: 300,
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
  { ruta: `${LISTA}?vista=tabla`, titulo: "Trabajo" },
  { ruta: "/vitrina/tareas/matriz", titulo: "Matriz" },
  { ruta: "/vitrina/tareas/revision", titulo: "Revisión semanal" },
  { ruta: "/vitrina/checklists", titulo: "Checklists" },
  { ruta: "/vitrina/checklists/00000000-0000-4000-8000-0000000000c5", titulo: "Mercado de la semana" },
  { ruta: "/vitrina/biblioteca", titulo: "Biblioteca" },
  { ruta: "/vitrina/apuntes", titulo: "Apuntes" },
  { ruta: "/vitrina/apuntes?vista=galeria", titulo: "Apuntes" },
  { ruta: "/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1", titulo: "SQL para Data Analytics" },
  { ruta: "/vitrina/apuntes/nueva", titulo: "Nueva página" },
  { ruta: "/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1/historial", titulo: "Historial" },
  { ruta: "/vitrina/papelera", titulo: "Papelera" },
  { ruta: "/vitrina/apuntes/mapa", titulo: "Mapa de notas" },
  { ruta: "/vitrina/estudio", titulo: "Modo estudio" },
  { ruta: "/vitrina/estudio/repaso", titulo: "Repasar: SQL para Data Analytics" },
  { ruta: "/vitrina/diario", titulo: "Diario" },
  { ruta: "/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1/imprimir", titulo: "SQL para Data Analytics" },
  { ruta: "/vitrina/preguntar", titulo: "Pregunta a tus notas" },
  { ruta: "/vitrina/progreso", titulo: "Progreso" },
  { ruta: "/vitrina/foco", titulo: "Modo foco" },
  { ruta: "/vitrina/agenda", titulo: "Agenda" },
  { ruta: "/vitrina/agenda?vista=semana", titulo: "Agenda" },
  { ruta: "/vitrina/agenda?vista=dia", titulo: "Agenda" },
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
      await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: destino, exact: true }).click();
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

test.describe("Fluidez en la Agenda (CPU 4× más lenta)", () => {
  test("tocar un día del mes muestra lo suyo al instante y la cuadrícula no se mueve", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/agenda");
    await medir(page);
    const cuadricula = page.getByRole("region", { name: "Días del mes" });
    const antes = (await cuadricula.boundingBox())!;
    const dia = page.getByRole("button", { name: /^miércoles 28 de octubre/ });
    const ms = await dia.evaluate(async (boton) => {
      const inicio = performance.now();
      (boton as HTMLButtonElement).click();
      // Espera al cuadro pintado con el día elegido y su lista.
      while (!document.getElementById("titulo-dia-elegido")?.textContent?.includes("28 de octubre")) {
        await new Promise((r) => requestAnimationFrame(r));
      }
      return performance.now() - inicio;
    });
    console.log(`día elegido en ${Math.round(ms)} ms`);
    await expect(page.getByText("Dentista")).toBeVisible();
    expect(ms, "tiempo hasta ver el día elegido").toBeLessThanOrEqual(PRESUPUESTO.check);
    const despues = (await cuadricula.boundingBox())!;
    expect([despues.y, despues.height], "la cuadrícula no se mueve ni cambia de alto").toEqual([antes.y, antes.height]);
  });

  test("pasar al mes siguiente no cambia el alto de la cuadrícula", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/agenda?vista=mes&dia=2026-10-27");
    await medir(page);
    const alto = async () => (await page.getByRole("region", { name: "Días del mes" }).boundingBox())!.height;
    const antes = await alto();
    const inicio = Date.now();
    await page.getByRole("link", { name: "Siguiente" }).click();
    await expect(page.getByText("noviembre 2026")).toBeVisible();
    const ms = Date.now() - inicio;
    console.log(`mes siguiente en ${ms} ms`);
    expect(ms, "cambio de mes").toBeLessThanOrEqual(PRESUPUESTO.cambioPestana);
    expect(await alto(), "6 semanas siempre").toBe(antes);
  });
});

test.describe("Fluidez de la barra ⌘K (CPU 4× más lenta)", () => {
  test("la lupa abre la barra al instante, busca y no mueve la pantalla", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/hoy");
    await medir(page);
    const seccion = page.getByRole("heading", { name: "Para hoy" });
    const antes = (await seccion.boundingBox())!.y;
    const ms = await page.getByRole("button", { name: "Buscar", exact: true }).evaluate(async (boton) => {
      const inicio = performance.now();
      (boton as HTMLButtonElement).click();
      while (document.activeElement?.getAttribute("role") !== "combobox") await new Promise((r) => requestAnimationFrame(r));
      return performance.now() - inicio;
    });
    console.log(`barra ⌘K lista en ${Math.round(ms)} ms`);
    expect(ms, "tiempo hasta poder escribir en la barra").toBeLessThanOrEqual(PRESUPUESTO.barra);

    await page.keyboard.type("sql");
    await expect(page.getByRole("option", { name: /SQL para Data Analytics/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Buscar en Orbe" })).toBeHidden();
    expect((await seccion.boundingBox())!.y, "la pantalla no se movió").toBe(antes);
  });

  test("Ctrl+K, escribir y Enter lleva a la pantalla", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/tareas");
    await medir(page);
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox", { name: /Buscar/ }).fill("agen");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "Agenda" })).toBeVisible();
  });
});

test.describe("Sin conexión (service worker)", () => {
  test("se ven las pantallas guardadas y la captura espera a internet", async ({ page, context }) => {
    test.setTimeout(60_000);
    await page.goto("/vitrina/hoy");
    // El service worker toma el control y guarda las pantallas principales (con sus archivos).
    await page.evaluate(() => navigator.serviceWorker.ready);
    if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) await page.reload();
    await expect
      .poll(() => page.evaluate(async () => Boolean(await caches.match(`${location.origin}/vitrina/apuntes`))), { timeout: 20_000 })
      .toBe(true);

    await context.setOffline(true);
    await page.goto("/vitrina/apuntes");
    await expect(page.getByRole("heading", { level: 1, name: "Apuntes" })).toBeVisible();
    await expect(page.getByRole("status").getByText(/Sin conexión/)).toBeVisible();

    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Hoy", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Hoy" })).toBeVisible();
    await page.getByLabel("Captura rápida").fill("comprar pilas mañana");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Guardada sin conexión")).toBeVisible();
    await expect(page.getByRole("status").getByText(/1 por enviar/)).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByRole("status").getByText(/1 tarea enviada/)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("orbe:pendientes"))).toBeNull();
  });
});

test.describe("Fluidez de la IA (vitrina, sin Gemini)", () => {
  test("crear con IA desde la captura no mueve la pantalla", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/hoy");
    await medir(page);
    const seccion = page.getByRole("heading", { name: "Para hoy" });
    const antes = (await seccion.boundingBox())!.y;
    await page.getByLabel("Captura rápida").fill("mañana llamar al banco y pagar la luz el viernes");
    await page.getByRole("button", { name: "Crear con IA" }).click();
    await expect(page.getByText(/^Creé/)).toBeVisible();
    await expect(page.getByLabel("Captura rápida")).toHaveValue("");
    expect((await seccion.boundingBox())!.y, "la lista no se movió").toBe(antes);
  });

  test("mejorar una página con IA aplica los cambios y se puede deshacer", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1");
    await medir(page);
    const titulo = page.getByRole("textbox", { name: "Título 2" });
    const posicion = () => titulo.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const antes = await posicion();
    await page.getByRole("button", { name: "Mejorar redacción" }).click();
    await expect(page.getByText(/^Mejoré \d+ bloque/)).toBeVisible();
    await expect(page.getByText(/\(mejorado\)/).first()).toBeAttached();
    expect(await posicion(), "lo de arriba no se movió").toBe(antes);
    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByText("Listo, volvió a como estaba.")).toBeVisible();
    await expect(page.locator("textarea").filter({ hasText: "(mejorado)" })).toHaveCount(0);
  });
});

test.describe("Fluidez del plan del día con IA (vitrina)", () => {
  test("planificar el día responde y no mueve lo de arriba", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/hoy");
    await medir(page);
    // Posición dentro de la página: tocar el botón desplaza la pantalla hasta él, y eso no es un salto.
    const captura = page.getByLabel("Captura rápida");
    const posicion = () => captura.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const antes = await posicion();
    await expect(page.getByText("Repasar window functions de SQL").first()).toBeVisible();
    await page.getByRole("button", { name: "Replanificar" }).click();
    await expect(page.getByText("Listo, tu plan está arriba.")).toBeVisible();
    expect(await posicion(), "la captura no se movió").toBe(antes);
  });
});

test.describe("Pregunta a tus notas (vitrina, sin Gemini)", () => {
  test("responde con las páginas de donde sacó la respuesta", async ({ page }) => {
    await page.goto("/vitrina/preguntar");
    await page.getByRole("button", { name: "¿Qué anoté sobre window functions?" }).click();
    await page.getByRole("button", { name: "Preguntar" }).click();
    await expect(page.getByRole("region", { name: "Respuesta" })).toContainText("funciones de ventana");
    await expect(page.getByRole("link", { name: /SQL para Data Analytics/ })).toBeVisible();
  });
});

test.describe("Fluidez del progreso (CPU 4× más lenta)", () => {
  test("tocar el anillo de un hábito lo marca al instante y no mueve la pantalla", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/hoy");
    await medir(page);
    const seccion = page.getByRole("heading", { name: "Tu día con IA" });
    const posicion = () => seccion.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const antes = await posicion();
    const anillo = page.getByRole("button", { name: /^Gimnasio: marcar como hecho hoy/ });
    const ms = await anillo.evaluate(async (boton) => {
      const inicio = performance.now();
      (boton as HTMLButtonElement).click();
      while (boton.getAttribute("aria-pressed") !== "true") await new Promise((r) => requestAnimationFrame(r));
      return performance.now() - inicio;
    });
    console.log(`hábito marcado en ${Math.round(ms)} ms`);
    expect(ms, "tiempo hasta ver el hábito marcado").toBeLessThanOrEqual(PRESUPUESTO.check);
    expect(await posicion(), "lo de abajo no se movió").toBe(antes);
  });

  test("el modo foco cuenta hacia atrás, se pausa y se puede terminar", async ({ page }) => {
    await page.goto("/vitrina/foco");
    const reloj = page.getByRole("timer");
    await expect(reloj).toHaveText("25:00");
    await page.getByRole("button", { name: "50 min" }).click();
    await expect(reloj).toHaveText("50:00");
    await page.getByRole("button", { name: "Empezar" }).click();
    await expect(reloj).toHaveText(/^49:5\d$/);
    await page.getByRole("button", { name: "Pausar" }).click();
    const pausado = await reloj.textContent();
    await page.waitForTimeout(1200);
    await expect(reloj, "en pausa el reloj no avanza").toHaveText(pausado!);
    await page.getByRole("button", { name: "Terminar" }).click();
    await expect(reloj).toHaveText("50:00");
  });

  test("con la captura vacía, el ✨ y el + avisan qué falta en vez de verse apagados", async ({ page }) => {
    await page.goto("/vitrina/hoy");
    const ia = page.getByRole("button", { name: "Crear con IA" });
    await expect(ia).toBeEnabled();
    await ia.click();
    await expect(page.getByText("Escribe primero lo que quieres hacer.")).toBeVisible();
    await expect(page.getByLabel("Captura rápida")).toBeFocused();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Escribe primero lo que quieres hacer.")).toBeVisible();
  });
});

test.describe("Enlaces entre notas (CPU 4× más lenta)", () => {
  test("al escribir [[ la barra sugiere páginas sin moverse y completa el enlace", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1");
    await medir(page);
    const barra = page.getByRole("button", { name: "Título 1" }).locator("xpath=..");
    const altoAntes = (await barra.boundingBox())!.height;
    const ultimo = page.getByRole("textbox", { name: /Escribe, o usa #/ }).last();
    await ultimo.click();
    await ultimo.pressSequentially("Repasar [[Win");
    const sugerencia = page.getByRole("option", { name: /Window functions/ });
    await expect(sugerencia).toBeVisible();
    expect((await page.getByRole("listbox", { name: "Enlazar una página" }).locator("xpath=..").boundingBox())!.height, "la barra no cambia de alto").toBe(altoAntes);
    await sugerencia.click();
    await expect(ultimo).toHaveValue("Repasar [[Window functions]]");
    await expect(page.getByRole("listbox", { name: "Enlazar una página" })).toHaveCount(0);
  });

  test("la página muestra a cuáles enlaza, cuáles faltan crear y quién la menciona", async ({ page }) => {
    await page.goto("/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1");
    const conexiones = page.locator("section", { has: page.getByRole("heading", { name: "Conexiones" }) });
    await expect(conexiones.getByRole("link", { name: /Window functions/ })).toBeVisible();
    await expect(conexiones.getByText("Funciones de agregación")).toBeVisible();
    await expect(conexiones.getByRole("button", { name: "Crear" })).toBeVisible();
    await expect(conexiones.getByRole("link", { name: /Ideas para Orbe/ })).toBeVisible();
  });

  test("el mapa de notas dibuja las páginas como enlaces", async ({ page }) => {
    await page.goto("/vitrina/apuntes/mapa");
    const mapa = page.getByRole("img", { name: /Mapa con 4 páginas/ });
    await expect(mapa).toBeVisible();
    await expect(page.getByRole("link", { name: /^SQL para Data Analytics: 2 conexiones/ })).toBeVisible();
  });
});

test.describe("Modo estudio y diario (CPU 4× más lenta)", () => {
  test("el repaso muestra la respuesta, reencola las que fallas y termina", async ({ page }) => {
    await page.goto("/vitrina/estudio/repaso");
    await expect(page.getByText("0/4")).toBeVisible();
    const botones = page.locator("div.grid.h-14");
    const altoBotones = (await botones.boundingBox())!.y;
    await page.getByRole("button", { name: "Mostrar respuesta" }).click();
    await expect(page.getByText("Respuesta", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Otra vez" }).click();
    await expect(page.getByText("0/4")).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Mostrar respuesta" }).click();
      await page.getByRole("button", { name: "La sabía" }).click();
    }
    await expect(page.getByText("¡Terminaste!")).toBeVisible();
    await expect(page.getByText("Sabías 4 de 4 a la primera.")).toBeVisible();
    expect((await botones.boundingBox())!.y, "los botones no se movieron").toBe(altoBotones);
  });

  test("elegir el ánimo de hoy responde al instante", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/diario");
    await medir(page);
    const bien = page.getByRole("radio", { name: "Bien", exact: true });
    const ms = await bien.evaluate(async (boton) => {
      const inicio = performance.now();
      (boton as HTMLButtonElement).click();
      while (boton.getAttribute("aria-checked") !== "true") await new Promise((r) => requestAnimationFrame(r));
      return performance.now() - inicio;
    });
    console.log(`ánimo marcado en ${Math.round(ms)} ms`);
    expect(ms, "tiempo hasta ver el ánimo marcado").toBeLessThanOrEqual(PRESUPUESTO.check);
    await expect(page.getByRole("button", { name: /diario de hoy/ })).toBeVisible();
  });

  test("una página se puede marcar como curso y repasar sus tarjetas desde Modo estudio", async ({ page }) => {
    await page.goto("/vitrina/apuntes/00000000-0000-4000-8000-0000000000b1");
    await expect(page.getByRole("button", { name: "Es un curso" })).toBeVisible();
    await page.goto("/vitrina/estudio");
    await expect(page.getByText("Examen final de SQL").first()).toBeVisible();
    await page.getByRole("link", { name: /Repasar/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: /^Repasar/ })).toBeVisible();
  });
});

test.describe("Organización (CPU 4× más lenta)", () => {
  test("mover una tarea en la matriz la cambia de cuadrante al instante", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/tareas/matriz");
    await medir(page);
    const hacerYa = page.locator("section", { has: page.getByRole("heading", { name: /^Hacer ya/ }) });
    const tarea = hacerYa.getByRole("button", { name: /Enviar informe de ventas a Prediqt/ });
    await expect(tarea).toBeVisible();
    await tarea.click();
    const dialogo = page.getByRole("dialog");
    await expect(dialogo.getByRole("heading", { name: "Enviar informe de ventas a Prediqt" })).toBeVisible();
    const ms = await dialogo.getByRole("button", { name: /^Soltar/ }).evaluate(async (boton) => {
      const inicio = performance.now();
      (boton as HTMLButtonElement).click();
      // Espera al cuadro en que la tarea ya aparece en "Soltar".
      const enSoltar = () =>
        [...document.querySelectorAll("section")].some(
          (s) => s.querySelector("h2")?.textContent?.startsWith("Soltar") && s.textContent?.includes("Enviar informe de ventas a Prediqt"),
        );
      while (!enSoltar()) await new Promise((r) => requestAnimationFrame(r));
      return performance.now() - inicio;
    });
    console.log(`tarea movida de cuadrante en ${Math.round(ms)} ms`);
    expect(ms, "tiempo hasta ver la tarea en su nuevo cuadrante").toBeLessThanOrEqual(PRESUPUESTO.check);
  });

  test("la tabla filtra y ordena, y las vistas guardadas se abren con un toque", async ({ page }) => {
    await page.goto(`${LISTA}?vista=tabla`);
    const tabla = page.getByRole("table");
    await expect(tabla).toBeVisible();
    const filas = () => tabla.locator("tbody tr");
    const antes = await filas().count();
    const prioridad = page.getByRole("combobox", { name: "Prioridad", exact: true });
    await prioridad.selectOption("3");
    await expect(filas()).toHaveCount(1);
    await expect(filas().first()).toContainText("Enviar informe de ventas a Prediqt");
    await prioridad.selectOption("0");
    await expect(filas()).toHaveCount(antes);
    await page.getByRole("link", { name: "Urgentes" }).click();
    await expect(page).toHaveURL(/orden=prioridad/);
    await expect(page.getByLabel("Ordenar por")).toHaveValue("prioridad");
  });

  test("la revisión semanal muestra lo atrasado y los hábitos", async ({ page }) => {
    await page.goto("/vitrina/tareas/revision");
    await expect(page.getByRole("heading", { name: "1. Atrasadas" })).toBeVisible();
    await expect(page.getByText("Pagar la tarjeta BBVA").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "5. Hábitos de la semana" })).toBeVisible();
  });
});

/**
 * Toca un botón y espera a que la página muestre `texto` (lo detecta en cuanto aparece, aunque
 * dure poco: en la vitrina nada se guarda y el cambio instantáneo vuelve atrás tras el "guardado").
 */
async function tocarYVer(boton: import("@playwright/test").Locator, texto: string): Promise<boolean> {
  return boton.evaluate(
    (b, buscado) =>
      new Promise<boolean>((listo) => {
        const cumple = () => document.body.innerText.includes(buscado);
        const observador = new MutationObserver(() => {
          if (cumple()) {
            observador.disconnect();
            listo(true);
          }
        });
        observador.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
        setTimeout(() => {
          observador.disconnect();
          listo(cumple());
        }, 2000);
        (b as HTMLButtonElement).click();
      }),
    texto,
  );
}

test.describe("Checklists y biblioteca (CPU 4× más lenta)", () => {
  test("marcar un ítem es instantáneo y 'Desmarcar todo' deja la lista lista para reusar", async ({ page }) => {
    await prepararMedicion(page);
    await page.goto("/vitrina/checklists/00000000-0000-4000-8000-0000000000c5");
    await medir(page);
    await expect(page.getByText("3 de 9 marcados")).toBeVisible();
    const inicio = Date.now();
    expect(await tocarYVer(page.getByRole("checkbox", { name: /^Palta/ }), "4 de 9 marcados"), "el ítem se marca al instante").toBe(true);
    console.log(`ítem marcado (con ida y vuelta de Playwright) en ${Date.now() - inicio} ms`);
    expect(await tocarYVer(page.getByRole("button", { name: "Desmarcar todo" }), "0 de 9 marcados"), "desmarcar todo es instantáneo").toBe(true);
    await page.getByLabel("Agregar a la lista").fill("Yogur");
    expect(await tocarYVer(page.getByRole("button", { name: "Agregar", exact: true }), "Yogur"), "el ítem nuevo aparece al instante").toBe(true);
  });

  test("la biblioteca suma avance y pone estrellas a lo terminado", async ({ page }) => {
    await page.goto("/vitrina/biblioteca");
    await expect(page.getByText("142 de 260 páginas")).toBeVisible();
    expect(await tocarYVer(page.getByRole("button", { name: "Sumar 1 a Storytelling with Data" }), "143 de 260 páginas"), "el avance sube al instante").toBe(true);
    await page.getByRole("link", { name: /Terminados/ }).click();
    await expect(page.getByText("Atomic Habits", { exact: true })).toBeVisible();
    const estrellas = page.getByRole("radiogroup", { name: "Nota de Atomic Habits" });
    await expect(estrellas.getByRole("radio", { name: "5 estrellas" })).toHaveAttribute("aria-checked", "true");
    const tres = estrellas.getByRole("radio", { name: "3 estrellas" });
    const marcada = await tres.evaluate(
      (b) =>
        new Promise<boolean>((listo) => {
          const observador = new MutationObserver(() => {
            if (b.getAttribute("aria-checked") === "true") {
              observador.disconnect();
              listo(true);
            }
          });
          observador.observe(b, { attributes: true });
          setTimeout(() => {
            observador.disconnect();
            listo(b.getAttribute("aria-checked") === "true");
          }, 2000);
          (b as HTMLButtonElement).click();
        }),
    );
    expect(marcada, "la nota cambia al instante").toBe(true);
  });
});
