"use client";

import { useEffect, useState, useTransition } from "react";
import type { AccionesAjustes } from "@/app/acciones/tipos";
import { esAndroid, esIOS, estaInstalada } from "@/lib/dispositivo";

type Estado = "revisando" | "sin-soporte" | "instalar" | "bloqueado" | "inactivo" | "activo";

const TEXTOS: Record<Estado, { etiqueta: string; texto: string }> = {
  revisando: { etiqueta: "", texto: "Revisando si este dispositivo puede recibir avisos…" },
  "sin-soporte": { etiqueta: "No disponible", texto: "Este navegador no puede recibir avisos. Prueba con Safari en iPhone o Chrome en Android." },
  instalar: {
    etiqueta: "Falta instalar",
    texto: "En iPhone, los avisos funcionan con Orbe instalado: Compartir → Agregar a inicio, y ábrelo desde ese ícono.",
  },
  bloqueado: { etiqueta: "Bloqueados", texto: "Los bloqueaste para Orbe. Actívalos en los ajustes del teléfono → Notificaciones → Orbe." },
  inactivo: { etiqueta: "Apagados", texto: "Recibe un aviso a la hora de tus tareas, aunque Orbe esté cerrado." },
  activo: { etiqueta: "Activos", texto: "Llegan a este dispositivo a la hora de cada tarea (o antes, si lo eliges en la tarea)." },
};

/** La clave pública VAPID viene en base64url; el navegador la pide en bytes. */
function aBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=");
  const binario = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

const soportado = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function nombreDispositivo(): string {
  if (esIOS()) return /iPad/.test(navigator.userAgent) ? "iPad" : "iPhone";
  if (esAndroid()) return "Android";
  return /Mac/.test(navigator.userAgent) ? "Mac" : /Windows/.test(navigator.userAgent) ? "Windows" : "Navegador";
}

type Props = {
  clavePublica: string | null;
  dispositivos: number;
  acciones: Pick<AccionesAjustes, "guardarSuscripcion" | "quitarSuscripcion" | "probarAvisos">;
};

/**
 * Activar avisos push en este dispositivo. La tarjeta tiene siempre la misma altura:
 * al descubrir el estado (después de cargar) solo cambia el texto, nada se mueve.
 */
export function ActivarAvisos({ clavePublica, dispositivos, acciones }: Props) {
  const [estado, setEstado] = useState<Estado>("revisando");
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
  const [ocupado, iniciar] = useTransition();

  useEffect(() => {
    let vivo = true;
    async function revisar(): Promise<Estado> {
      if (!soportado()) return esIOS() && !estaInstalada() ? "instalar" : "sin-soporte";
      if (Notification.permission === "denied") return "bloqueado";
      const registro = await navigator.serviceWorker.getRegistration("/");
      const suscripcion = await registro?.pushManager.getSubscription();
      return suscripcion && Notification.permission === "granted" ? "activo" : "inactivo";
    }
    revisar()
      .catch((): Estado => "sin-soporte")
      .then((e) => vivo && setEstado(e));
    return () => {
      vivo = false;
    };
  }, []);

  function activar() {
    setMensaje(null);
    iniciar(async () => {
      try {
        if (!clavePublica) throw new Error("sin clave");
        // Debe pedirse justo al tocar el botón (iPhone lo exige).
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") {
          setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
          return;
        }
        const registro = await navigator.serviceWorker.ready;
        const suscripcion =
          (await registro.pushManager.getSubscription()) ??
          (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clavePublica) }));
        const datos = suscripcion.toJSON();
        const r = await acciones.guardarSuscripcion({
          endpoint: datos.endpoint,
          p256dh: datos.keys?.p256dh,
          auth: datos.keys?.auth,
          dispositivo: nombreDispositivo(),
        });
        if (!r.ok) {
          await suscripcion.unsubscribe();
          setMensaje({ texto: r.error ?? "No se pudo activar.", error: true });
          return;
        }
        setEstado("activo");
        setMensaje({ texto: "Listo. Envía una prueba para comprobarlo.", error: false });
      } catch {
        setMensaje({ texto: "No se pudo activar en este dispositivo.", error: true });
      }
    });
  }

  function desactivar() {
    setMensaje(null);
    iniciar(async () => {
      const registro = await navigator.serviceWorker.getRegistration("/");
      const suscripcion = await registro?.pushManager.getSubscription();
      if (suscripcion) {
        await acciones.quitarSuscripcion(suscripcion.endpoint);
        await suscripcion.unsubscribe();
      }
      setEstado("inactivo");
    });
  }

  function probar() {
    setMensaje(null);
    iniciar(async () => {
      const r = await acciones.probarAvisos();
      setMensaje(r.ok ? { texto: "Enviado. Debería llegar en unos segundos.", error: false } : { texto: r.error ?? "No se pudo.", error: true });
    });
  }

  const { etiqueta, texto } = TEXTOS[estado];
  const boton = "rounded-[14px] px-4 py-2.5 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-50";

  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4" aria-labelledby="titulo-avisos">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-avisos" className="text-[17px] font-semibold">
          Avisos
        </h2>
        <span
          className={`h-6 rounded-full px-2.5 text-[13px] leading-6 font-semibold ${
            estado === "activo" ? "bg-verde-relleno/15 text-verde" : etiqueta ? "bg-control text-texto-2" : ""
          }`}
        >
          {etiqueta}
        </span>
      </div>
      {/* Tres líneas reservadas: el texto cambia sin mover lo de abajo. */}
      <p className="line-clamp-3 min-h-[60px] text-[15px] leading-5 text-texto-2" aria-live="polite">
        {mensaje ? <span className={mensaje.error ? "text-rojo" : "text-verde"}>{mensaje.texto}</span> : texto}
      </p>
      <div className="flex h-11 items-center gap-2">
        {estado === "activo" ? (
          <>
            <button type="button" onClick={probar} disabled={ocupado} className={`${boton} flex-1 bg-rojo-relleno text-white`}>
              Enviar prueba
            </button>
            <button type="button" onClick={desactivar} disabled={ocupado} className={`${boton} bg-control`}>
              Desactivar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={activar}
            disabled={ocupado || estado !== "inactivo" || !clavePublica}
            className={`${boton} flex-1 bg-rojo-relleno text-white ${estado === "inactivo" || estado === "revisando" ? "" : "invisible"}`}
          >
            {ocupado ? "Activando…" : "Activar en este dispositivo"}
          </button>
        )}
      </div>
      <p className="text-[13px] text-texto-2">
        {dispositivos === 0 ? "Ningún dispositivo con avisos." : `${dispositivos} ${dispositivos === 1 ? "dispositivo" : "dispositivos"} con avisos activos.`}
      </p>
    </section>
  );
}
