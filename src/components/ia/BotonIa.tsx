"use client";

import { useState, useTransition } from "react";
import type { ResultadoIa } from "@/app/acciones/tipos";

type Props<T> = {
  etiqueta: string;
  accion: () => Promise<ResultadoIa<T>>;
  exito: (datos: T) => string;
  className?: string;
};

/** Destello de IA (dibujado a mano, como los demás íconos). */
export function Destello({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.1 6.3 6.4 2.2-6.4 2.2L12 19.5l-2.1-6.3L3.5 11l6.4-2.2ZM19 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z" />
    </svg>
  );
}

/**
 * Botón de IA: solo actúa cuando lo tocas. Muestra "Pensando…", luego el resultado o el error
 * en una línea de alto fijo (nada se mueve). Los topes los decide la base.
 */
export function BotonIa<T>({ etiqueta, accion, exito, className = "" }: Props<T>) {
  const [ocupado, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  function usar() {
    setMensaje(null);
    iniciar(async () => {
      try {
        const r = await accion();
        setMensaje(r.ok ? { texto: exito(r.datos), error: false } : { texto: r.error, error: true });
      } catch {
        setMensaje({ texto: "Sin conexión: la IA necesita internet.", error: true });
      }
    });
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={usar}
        disabled={ocupado}
        className="flex items-center justify-center gap-2 rounded-[14px] bg-morado-relleno/12 px-3 py-2.5 text-[15px] font-semibold whitespace-nowrap text-morado transition active:scale-[0.98] disabled:opacity-60"
      >
        <Destello className={`size-4 ${ocupado ? "motion-safe:animate-pulse" : ""}`} />
        {ocupado ? "Pensando…" : etiqueta}
      </button>
      <p className={`h-5 truncate px-1 text-[13px] ${mensaje?.error ? "text-rojo" : "text-texto-2"}`} aria-live="polite">
        {mensaje?.texto}
      </p>
    </div>
  );
}

/** "Ordenar Inbox con IA" (se usa desde pantallas del servidor: recibe solo la acción). */
export function BotonOrdenarInbox({ accion }: { accion: () => Promise<ResultadoIa<{ ordenadas: number }>> }) {
  return (
    <BotonIa
      etiqueta="Ordenar Inbox con IA"
      accion={accion}
      exito={(d) => (d.ordenadas === 0 ? "La IA no encontró una lista que encaje." : `Ordené ${d.ordenadas} ${d.ordenadas === 1 ? "tarea" : "tareas"} en tus listas.`)}
    />
  );
}

/** "Dividir en pasos con IA" para una tarea. */
export function BotonDividir({ tareaId, accion }: { tareaId: string; accion: (id: string) => Promise<ResultadoIa<{ pasos: number }>> }) {
  return <BotonIa etiqueta="Dividir en pasos con IA" accion={() => accion(tareaId)} exito={(d) => `Agregué ${d.pasos} pasos como subtareas.`} />;
}

/** "Planificar mi día" (1 al día). El plan aparece arriba del botón al terminar. */
export function BotonPlan({ accion, rehacer }: { accion: () => Promise<ResultadoIa<unknown>>; rehacer: boolean }) {
  return <BotonIa etiqueta={rehacer ? "Replanificar" : "Planificar mi día"} accion={accion} exito={() => "Listo, tu plan está arriba."} className="min-w-0 flex-1" />;
}

/** "Resumen de la semana" (1 por semana). */
export function BotonSemana({ accion }: { accion: () => Promise<ResultadoIa<unknown>> }) {
  return <BotonIa etiqueta="Mi semana" accion={accion} exito={() => "Listo, tu resumen está arriba."} className="min-w-0 flex-1" />;
}
