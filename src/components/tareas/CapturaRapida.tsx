"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CAPTURA_INICIAL, type EstadoCaptura } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { interpretarCaptura } from "@/lib/captura";
import { etiquetaFecha, etiquetaHora, hoyLima } from "@/lib/fechas";
import { etiquetaRepetir } from "@/lib/repeticion";

type Props = {
  accion: (anterior: EstadoCaptura, formData: FormData) => Promise<EstadoCaptura>;
  listaId?: string;
  placeholder?: string;
  /** false = texto tal cual (subtareas): no busca fechas ni listas. */
  interpretar?: boolean;
  /** Fecha para lo que se escribe sin fecha (la Agenda usa el día seleccionado). */
  fechaDefecto?: string;
};

const PRIORIDAD = ["", "!", "!!", "!!!"];

/**
 * Barra de captura rápida. Mientras escribes muestra lo que entendió (fecha, hora, lista, prioridad),
 * calculado en el propio teléfono, sin IA. La fila de pistas tiene altura fija: nada salta al escribir.
 */
export function CapturaRapida({ accion, listaId, placeholder = "Agregar tarea…", interpretar = true, fechaDefecto }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, CAPTURA_INICIAL);
  const [texto, setTexto] = useState("");
  const [guardados, setGuardados] = useState(estado.n);
  const campo = useRef<HTMLInputElement>(null);

  // Tras guardar, el campo se vacía (ajuste durante el render, sin efecto en cascada)…
  if (estado.n !== guardados) {
    setGuardados(estado.n);
    setTexto("");
  }
  // …y vuelve a tener el foco para escribir la siguiente.
  useEffect(() => {
    if (estado.n > 0) campo.current?.focus();
  }, [estado.n]);

  const hoy = hoyLima();
  const c = interpretar && texto.trim() ? interpretarCaptura(texto, hoy, fechaDefecto) : null;
  const pistas = c
    ? [
        c.repetir && `↻ ${etiquetaRepetir(c.repetir, c.fecha)}`,
        c.fecha && !c.repetir && etiquetaFecha(c.fecha, hoy),
        c.hora && etiquetaHora(c.hora),
        c.lista && `#${c.lista}`,
        c.prioridad > 0 && `Prioridad ${PRIORIDAD[c.prioridad]}`,
      ].filter(Boolean)
    : [];

  return (
    <form action={enviar} className="flex flex-col gap-1.5">
      {listaId && <input type="hidden" name="lista_id" value={listaId} />}
      {fechaDefecto && <input type="hidden" name="fecha_defecto" value={fechaDefecto} />}
      <div className="flex items-center gap-2 rounded-[18px] bg-superficie py-1.5 pr-1.5 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-relleno/40">
        <label htmlFor="captura" className="sr-only">
          Captura rápida
        </label>
        <input
          ref={campo}
          id="captura"
          name={interpretar ? "texto" : "titulo"}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          maxLength={300}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent py-2 text-[17px] outline-none placeholder:text-texto-2"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          aria-label="Guardar"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-relleno text-white transition active:scale-95 disabled:opacity-40"
        >
          <Icono nombre="mas" className="size-5" />
        </button>
      </div>
      <p className="flex h-6 items-center gap-1.5 overflow-hidden px-1 text-[13px] text-texto-2" aria-live="polite">
        {estado.error ? (
          <span className="text-rojo">{estado.error}</span>
        ) : pistas.length > 0 ? (
          pistas.map((p) => (
            <span key={String(p)} className="shrink-0 rounded-full bg-indigo-relleno/12 px-2 py-0.5 font-semibold text-indigo">
              {p}
            </span>
          ))
        ) : interpretar ? (
          <span className="truncate">Prueba: “pagar luz el viernes 9am #casa !!”</span>
        ) : null}
      </p>
    </form>
  );
}
