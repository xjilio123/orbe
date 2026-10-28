// Service worker de Orbe.
// Privacidad: NO guarda páginas ni notas en el teléfono. Solo cachea archivos estáticos
// (JS/CSS con hash, íconos) y una pantalla "sin conexión". El modo offline con datos llega en la Fase 3.
// Avisos push: muestra el aviso que manda Orbe y, al tocarlo, abre la tarea dentro de la app.
const VERSION = "orbe-v2";
const PRECACHE = ["/offline", "/iconos/icono-192.png"];

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
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

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

  // Navegación: siempre a la red (datos frescos y privados). Sin conexión: pantalla "offline".
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
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
