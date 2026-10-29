"use client";

import { useState, useTransition } from "react";
import type { ResultadoClave } from "@/app/acciones/atajo";
import { BotonQuitar } from "@/components/progreso/BotonQuitar";

/** `uso` llega ya escrito desde el servidor ("Usada hace 2 h"), así no cambia al hidratar. */
export type ClaveAtajo = { id: string; nombre: string; pista: string; uso: string };

type Props = {
  claves: ClaveAtajo[];
  /** Dirección de Orbe (para armar la URL del atajo). */
  origen: string;
  acciones: { crear: (nombre: string) => Promise<ResultadoClave>; revocar: (id: string) => Promise<void> };
};

/**
 * Atajo de Siri "Anota en Orbe": una clave personal que solo crea tareas en tu Inbox.
 * La clave se muestra una sola vez; la base guarda solo su huella.
 */
export function AtajoSiri({ claves, origen, acciones }: Props) {
  const [nueva, setNueva] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
  const [creando, iniciar] = useTransition();
  const url = `${origen}/api/atajo`;

  function crear() {
    setMensaje(null);
    iniciar(async () => {
      try {
        const r = await acciones.crear("iPhone");
        if (r.ok) setNueva(r.clave);
        else setMensaje({ texto: r.error, error: true });
      } catch {
        setMensaje({ texto: "Sin conexión: no se creó la clave.", error: true });
      }
    });
  }

  async function copiar(texto: string, que: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setMensaje({ texto: `${que} copiada.`, error: false });
    } catch {
      setMensaje({ texto: "No se pudo copiar: mantén presionado el texto para copiarlo.", error: true });
    }
  }

  return (
    <section id="atajo" className="flex scroll-mt-6 flex-col gap-3 rounded-[22px] bg-superficie p-4" aria-labelledby="titulo-atajo">
      <div className="flex flex-col gap-1">
        <h2 id="titulo-atajo" className="text-[17px] font-semibold">
          Atajo de Siri
        </h2>
        <p className="text-[15px] leading-5 text-texto-2">
          Di “Oye Siri, anota en Orbe” y lo que dictes llega a tu Inbox sin abrir la app. Entiende fechas, horas, #listas y prioridad.
        </p>
      </div>

      {nueva && (
        <div className="flex flex-col gap-2 rounded-[16px] bg-naranja-relleno/12 p-3">
          <p className="text-[13px] font-semibold text-naranja">Tu clave (cópiala ahora: no la volverás a ver)</p>
          <code className="break-all rounded-[10px] bg-superficie px-3 py-2 font-mono text-[13px] select-all">{nueva}</code>
          <button type="button" onClick={() => copiar(`Bearer ${nueva}`, "Clave")} className="rounded-[12px] bg-naranja-relleno py-2.5 text-[15px] font-bold text-[#1d1d1f] active:scale-[0.98]">
            Copiar “Bearer …” para el atajo
          </button>
        </div>
      )}

      {claves.length > 0 && (
        <ul className="divide-y divide-separador/60 overflow-hidden rounded-[16px] bg-control/50">
          {claves.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-1.5 pr-1 pl-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold">
                  {c.nombre} <span className="font-mono text-texto-2">····{c.pista}</span>
                </span>
                <span className="text-[12px] text-texto-2">{c.uso}</span>
              </div>
              <BotonQuitar id={c.id} nombre={`la clave ${c.nombre} ····${c.pista}`} accion={acciones.revocar} />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={crear}
        disabled={creando || claves.length >= 5}
        className="rounded-[14px] bg-control py-2.5 text-[15px] font-semibold text-azul active:scale-[0.98] disabled:opacity-50"
      >
        {creando ? "Creando…" : claves.length ? "Crear otra clave" : "Crear clave para el atajo"}
      </button>

      <details className="group">
        <summary className="cursor-pointer list-none text-[15px] font-semibold text-azul [&::-webkit-details-marker]:hidden">Cómo crear el atajo en el iPhone</summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-5 text-texto-2">
          <li>Abre la app Atajos → toca “+”.</li>
          <li>Agrega la acción “Dictar texto”.</li>
          <li>
            Agrega “Obtener contenido de URL” con esta dirección:{" "}
            <button type="button" onClick={() => copiar(url, "Dirección")} className="font-mono text-[13px] break-all text-azul underline">
              {url}
            </button>
          </li>
          <li>Toca la flecha de esa acción: Método “POST”; en Encabezados agrega “Authorization” y pega tu clave (“Bearer …”).</li>
          <li>En “Cuerpo de la solicitud” elige JSON, agrega el campo “texto” y elige la variable “Texto dictado”.</li>
          <li>Agrega “Mostrar resultado” para escuchar la confirmación.</li>
          <li>Ponle de nombre “Anota en Orbe”. Listo: “Oye Siri, anota en Orbe”.</li>
        </ol>
        <p className="mt-2 text-[13px] leading-5 text-texto-2">
          La clave solo sirve para crear tareas en tu Inbox (hasta 30 por hora). Si pierdes el teléfono, revócala aquí.
        </p>
      </details>

      <p className={`min-h-5 text-[13px] ${mensaje?.error ? "text-rojo" : "text-verde"}`} aria-live="polite">
        {mensaje?.texto}
      </p>
    </section>
  );
}
