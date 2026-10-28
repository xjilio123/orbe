"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { AccionesIa } from "@/app/acciones/tipos";
import { Destello } from "@/components/ia/BotonIa";
import { Icono } from "@/components/Icono";
import { Encabezado, Pantalla, enlace } from "@/components/ui";
import type { Respuesta } from "@/lib/ia/preguntar";

type Props = {
  base: string;
  inicial?: string;
  preguntar: AccionesIa["preguntar"];
};

const EJEMPLOS = ["¿Qué anoté sobre window functions?", "¿Qué ideas tengo para Orbe?", "¿Qué tengo pendiente de inglés?"];

/** Pregunta a tus notas: la IA responde solo con lo que ya escribiste y te dice de qué páginas lo sacó. */
export function VistaPreguntar({ base, inicial = "", preguntar }: Props) {
  const [texto, setTexto] = useState(inicial);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pensando, iniciar] = useTransition();

  function enviar(pregunta: string) {
    setError(null);
    setRespuesta(null);
    iniciar(async () => {
      try {
        const r = await preguntar(pregunta);
        if (r.ok) setRespuesta(r.datos);
        else setError(r.error);
      } catch {
        setError("Sin conexión: la IA necesita internet.");
      }
    });
  }

  return (
    <Pantalla>
      <Encabezado titulo="Pregunta a tus notas" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim().length >= 5) enviar(texto.trim());
        }}
        className="flex flex-col gap-2 rounded-[22px] bg-superficie p-3 shadow-sm"
      >
        <label htmlFor="pregunta" className="sr-only">
          Tu pregunta
        </label>
        <textarea
          id="pregunta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Pregunta algo sobre lo que escribiste…"
          className="resize-none bg-transparent px-1 text-[17px] leading-snug outline-none placeholder:text-texto-2"
        />
        <button
          type="submit"
          disabled={pensando || texto.trim().length < 5}
          className="flex items-center justify-center gap-2 rounded-[14px] bg-morado-relleno py-2.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-50"
        >
          <Destello className={`size-4 ${pensando ? "motion-safe:animate-pulse" : ""}`} />
          {pensando ? "Buscando en tus notas…" : "Preguntar"}
        </button>
      </form>

      {error && <p className="rounded-[18px] bg-rojo-relleno/10 px-4 py-3 text-[15px] text-rojo">{error}</p>}

      {respuesta && (
        <section aria-label="Respuesta" className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4">
          <p className="text-[17px] leading-relaxed whitespace-pre-line">{respuesta.respuesta}</p>
          {respuesta.fuentes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] font-semibold text-texto-2">Sacado de</p>
              <ul className="flex flex-col gap-1">
                {respuesta.fuentes.map((f) => (
                  <li key={f.id}>
                    <Link href={enlace(base, `/apuntes/${f.id}`)} className="flex items-center gap-2 rounded-[12px] bg-superficie-2 px-3 py-2 active:bg-control">
                      <span aria-hidden="true">{f.icono || "📄"}</span>
                      <span className="flex-1 truncate text-[15px]">{f.titulo}</span>
                      <Icono nombre="adelante" className="size-4 text-texto-2" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {!respuesta && !error && !pensando && (
        <section aria-label="Ejemplos" className="flex flex-col gap-2">
          <p className="px-1 text-[13px] font-semibold text-texto-2">Prueba con</p>
          {EJEMPLOS.map((e) => (
            <button key={e} type="button" onClick={() => setTexto(e)} className="rounded-[16px] bg-superficie px-4 py-3 text-left text-[15px] active:bg-control">
              {e}
            </button>
          ))}
          <p className="px-1 text-[13px] leading-5 text-texto-2">
            Orbe busca por significado en tus páginas (sin salir de Supabase) y solo los fragmentos más parecidos van a Gemini. Usa 1 de tus 5 preguntas del día.
          </p>
        </section>
      )}
    </Pantalla>
  );
}
