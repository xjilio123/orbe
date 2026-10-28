"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { EstadoCaptura } from "@/app/acciones/tipos";
import { enlace } from "@/components/ui";
import { EVENTO_PENDIENTES, enviarPendientes, leerPendientes } from "@/lib/pendientes";

type Props = {
  base: string;
  capturar: (anterior: EstadoCaptura, formData: FormData) => Promise<EstadoCaptura>;
};

const suscribirRed = (avisar: () => void) => {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
};
const suscribirPendientes = (avisar: () => void) => {
  window.addEventListener(EVENTO_PENDIENTES, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_PENDIENTES, avisar);
    window.removeEventListener("storage", avisar);
  };
};

const DIEZ_MINUTOS = 10 * 60 * 1000;
const ultimaVez = new Map<string, number>();

/** Pide al service worker guardar estas pantallas para verlas sin conexión (cada una, máximo cada 10 min). */
function precalentar(rutas: string[]) {
  const sw = navigator.serviceWorker?.controller;
  if (!sw || !navigator.onLine) return;
  const ahora = Date.now();
  const nuevas = rutas.filter((r) => ahora - (ultimaVez.get(r) ?? 0) > DIEZ_MINUTOS);
  if (nuevas.length === 0) return;
  for (const r of nuevas) ultimaVez.set(r, ahora);
  sw.postMessage({ tipo: "precalentar", rutas: nuevas });
}

/**
 * Modo sin conexión:
 * - Muestra un aviso flotante (no mueve nada) cuando no hay internet.
 * - Al volver, envía las tareas capturadas sin conexión.
 * - Con internet, guarda en el teléfono las pantallas principales y la que estás viendo.
 */
export function ModoSinConexion({ base, capturar }: Props) {
  const enLinea = useSyncExternalStore(suscribirRed, () => navigator.onLine, () => true);
  const pendientes = useSyncExternalStore(suscribirPendientes, () => leerPendientes().length, () => 0);
  const ruta = usePathname();
  const [enviadas, setEnviadas] = useState(0);

  useEffect(() => {
    if (!enLinea || leerPendientes().length === 0) return;
    enviarPendientes(capturar).then((n) => {
      if (n > 0) setEnviadas(n);
    });
  }, [enLinea, capturar]);

  useEffect(() => {
    if (enviadas === 0) return;
    const t = setTimeout(() => setEnviadas(0), 4000);
    return () => clearTimeout(t);
  }, [enviadas]);

  useEffect(() => {
    if (!enLinea) return;
    const principales = ["/", "/tareas", "/apuntes", "/agenda"].map((r) => enlace(base, r));
    const t = setTimeout(() => precalentar([...principales, ruta]), 2500);
    return () => clearTimeout(t);
  }, [enLinea, base, ruta]);

  const mensaje = !enLinea
    ? `Sin conexión · ves lo último guardado${pendientes > 0 ? ` · ${pendientes} por enviar` : ""}`
    : enviadas > 0
      ? `Conexión de vuelta · ${enviadas} ${enviadas === 1 ? "tarea enviada" : "tareas enviadas"}`
      : null;

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),8px)] z-30 flex justify-center px-5">
      {mensaje && (
        <span className="rounded-full bg-texto px-3.5 py-1.5 text-[13px] font-semibold text-superficie shadow-lg motion-safe:animate-[entrar-desde-arriba_0.2s_ease-out]">
          {mensaje}
        </span>
      )}
    </div>
  );
}
