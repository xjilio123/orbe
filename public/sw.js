// Service worker de Orbe.
// Sin conexión: guarda en el teléfono las últimas pantallas que visitaste (máximo 40) para poder verlas
// sin internet. Siempre intenta primero la red (datos frescos); la copia solo se usa si no hay conexión.
// Al cerrar sesión (o al abrir la pantalla de login) esas copias se borran.
// Avisos push: muestra el aviso que manda Orbe y, al tocarlo, abre la tarea dentro de la app.
const VERSION = "orbe-v3";
const PANTALLAS = "orbe-pantallas-v1";
const MAX_PANTALLAS = 40;
const PRECACHE = ["/offline", "/iconos/icono-192.png"];
const NUNCA_GUARDAR = ["/login", "/auth/", "/offline", "/sw.js", "/api/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION && c !== PANTALLAS).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

const sePuedeGuardar = (url) => url.origin === self.location.origin && !NUNCA_GUARDAR.some((r) => url.pathname.startsWith(r));

/** Guarda una pantalla (solo HTML propio, sin redirecciones) y deja las 40 más recientes. */
async function guardarPantalla(clave, respuesta) {
  if (!respuesta.ok || respuesta.redirected || respuesta.type !== "basic") return;
  if (!(respuesta.headers.get("content-type") || "").includes("text/html")) return;
  // También sus archivos JS y CSS (con hash, no cambian): así la pantalla funciona completa sin conexión.
  const html = await respuesta.clone().text();
  const recursos = [...new Set(html.match(/\/_next\/static\/[\w./-]+?\.(?:js|css)/g) || [])].slice(0, 80);
  const estaticos = await caches.open(VERSION);
  await Promise.all(
    recursos.map(async (r) => {
      if (await estaticos.match(r)) return;
      try {
        const archivo = await fetch(r);
        if (archivo.ok) await estaticos.put(r, archivo);
      } catch {
        // sin conexión: queda para la próxima
      }
    }),
  );
  const cache = await caches.open(PANTALLAS);
  await cache.delete(clave); // al volver a guardarla pasa a ser la más reciente
  await cache.put(clave, respuesta);
  const claves = await cache.keys();
  await Promise.all(claves.slice(0, Math.max(0, claves.length - MAX_PANTALLAS)).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Archivos estáticos con hash en el nombre: nunca cambian, se sirven desde la caché.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/iconos/")) {
    event.respondWith(
      caches.match(request).then(
        (guardado) =>
          guardado ||
          fetch(request).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copia));
            }
            return respuesta;
          }),
      ),
    );
    return;
  }

  if (request.mode !== "navigate") return;

  // Pantalla de login: la sesión terminó, se borran las copias guardadas.
  if (url.pathname === "/login") {
    event.waitUntil(caches.delete(PANTALLAS));
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  // Navegación: primero la red; sin conexión, la última copia de esa pantalla o la pantalla "offline".
  event.respondWith(
    fetch(request)
      .then((respuesta) => {
        if (sePuedeGuardar(url)) event.waitUntil(guardarPantalla(url.href, respuesta.clone()));
        return respuesta;
      })
      .catch(
        async () =>
          (await caches.match(url.href, { cacheName: PANTALLAS })) ||
          (await caches.match(url.origin + url.pathname, { cacheName: PANTALLAS })) ||
          caches.match("/offline"),
      ),
  );
});

// La app pide guardar las pantallas principales (y la que estás viendo) para tenerlas sin conexión,
// o borrar todo al cerrar sesión.
self.addEventListener("message", (event) => {
  const datos = event.data || {};
  if (datos.tipo === "olvidar") {
    event.waitUntil(caches.delete(PANTALLAS));
    return;
  }
  if (datos.tipo === "precalentar" && Array.isArray(datos.rutas)) {
    event.waitUntil(
      Promise.all(
        datos.rutas.slice(0, 8).map(async (ruta) => {
          const url = new URL(String(ruta), self.location.origin);
          if (!sePuedeGuardar(url)) return;
          try {
            const respuesta = await fetch(url.href, { credentials: "same-origin", headers: { Accept: "text/html" } });
            await guardarPantalla(url.href, respuesta);
          } catch {
            // sin conexión: se intenta la próxima vez
          }
        }),
      ),
    );
  }
});

// ---------- Avisos push ----------
const texto = (valor, max) => (typeof valor === "string" ? valor.slice(0, max) : "");

/** Solo rutas internas de Orbe: un aviso nunca abre otro sitio. */
function rutaSegura(valor) {
  try {
    const url = new URL(typeof valor === "string" ? valor : "/", self.location.origin);
    return url.origin === self.location.origin ? url.pathname + url.search : "/";
  } catch {
    return "/";
  }
}

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = {};
  }
  event.waitUntil(
    self.registration.showNotification(texto(datos.titulo, 120) || "Orbe", {
      body: texto(datos.cuerpo, 240),
      icon: "/iconos/icono-192.png",
      badge: "/iconos/icono-192.png",
      tag: texto(datos.etiqueta, 80) || undefined,
      data: { url: rutaSegura(datos.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = rutaSegura(event.notification.data && event.notification.data.url);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if (new URL(ventana.url).origin === self.location.origin && "focus" in ventana) {
          return ventana.focus().then((v) => (v && "navigate" in v ? v.navigate(destino) : v));
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
