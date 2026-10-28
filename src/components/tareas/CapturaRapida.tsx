"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CAPTURA_INICIAL, type AccionesIa, type EstadoCaptura } from "@/app/acciones/tipos";
import { Destello } from "@/components/ia/BotonIa";
import { Icono } from "@/components/Icono";
import { interpretarCaptura } from "@/lib/captura";
import { etiquetaFecha, etiquetaHora, hoyLima } from "@/lib/fechas";
import { agregarPendiente } from "@/lib/pendientes";
import { etiquetaRepetir } from "@/lib/repeticion";

type Props = {
  accion: (anterior: EstadoCaptura, formData: FormData) => Promise<EstadoCaptura>;
  listaId?: string;
  placeholder?: string;
  /** false = texto tal cual (subtareas): no busca fechas ni listas. */
  interpretar?: boolean;
  /** Fecha para lo que se escribe sin fecha (la Agenda usa el día seleccionado). */
  fechaDefecto?: string;
  /** Captura inteligente con IA (botón ✨): entiende frases largas y crea varias tareas. */
  ia?: AccionesIa["captura"];
};

const PRIORIDAD = ["", "!", "!!", "!!!"];

/**
 * Barra de captura rápida. Mientras escribes muestra lo que entendió (fecha, hora, lista, prioridad),
 * calculado en el propio teléfono, sin IA. La fila de pistas tiene altura fija: nada salta al escribir.
 */
export function CapturaRapida({ accion, listaId, placeholder = "Agregar tarea…", interpretar = true, fechaDefecto, ia }: Props) {
  const [pensando, iniciarIa] = useTransition();
  const [mensajeIa, setMensajeIa] = useState<{ texto: string; error: boolean } | null>(null);
  // Sin conexión (o si la red falla al enviar), la tarea se guarda en el teléfono y se envía sola después.
  const [estado, enviar, enviando] = useActionState(async (anterior: EstadoCaptura, datos: FormData): Promise<EstadoCaptura> => {
    if (navigator.onLine) {
      try {
        return await accion(anterior, datos);
      } catch {
        // la red falló: sigue abajo
      }
    }
    if (!interpretar) return { ...anterior, ok: false, error: "Sin conexión: inténtalo al volver internet." };
    const guardada = agregarPendiente({
      texto: String(datos.get("texto") ?? ""),
      lista_id: listaId,
      fecha_defecto: fechaDefecto,
      capturado_el: hoyLima(),
    });
    return guardada
      ? { ok: true, n: anterior.n + 1, sinConexion: true }
      : { ...anterior, ok: false, error: "No se pudo guardar en el teléfono." };
  }, CAPTURA_INICIAL);
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

  function usarIa() {
    const enviado = texto.trim();
    if (!ia || !enviado) return;
    setMensajeIa(null);
    iniciarIa(async () => {
      try {
        const r = await ia(enviado, { lista_id: listaId, fecha_defecto: fechaDefecto });
        if (r.ok) {
          setTexto("");
          const n = r.datos.titulos.length;
          setMensajeIa({ texto: n === 1 ? `Creé “${r.datos.titulos[0]}”` : `Creé ${n} tareas: ${r.datos.titulos.join(", ")}`, error: false });
        } else setMensajeIa({ texto: r.error, error: true });
      } catch {
        setMensajeIa({ texto: "Sin conexión: la IA necesita internet.", error: true });
      }
    });
  }

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
          onChange={(e) => {
            setTexto(e.target.value);
            setMensajeIa(null);
          }}
          placeholder={placeholder}
          maxLength={300}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent py-2 text-[17px] outline-none placeholder:text-texto-2"
        />
        {ia && (
          <button
            type="button"
            onClick={usarIa}
            disabled={pensando || texto.trim().length < 3}
            aria-label="Crear con IA"
            title="Crear con IA: entiende frases largas y crea varias tareas"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-morado-relleno/12 text-morado transition active:scale-95 disabled:opacity-40"
          >
            <Destello className={`size-[18px] ${pensando ? "motion-safe:animate-pulse" : ""}`} />
          </button>
        )}
        <button
          type="submit"
          disabled={enviando || pensando || !texto.trim()}
          aria-label="Guardar"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-relleno text-white transition active:scale-95 disabled:opacity-40"
        >
          <Icono nombre="mas" className="size-5" />
        </button>
      </div>
      <p className="flex h-6 items-center gap-1.5 overflow-hidden px-1 text-[13px] text-texto-2" aria-live="polite">
        {pensando ? (
          <span className="truncate font-semibold text-morado">La IA está creando tus tareas…</span>
        ) : mensajeIa ? (
          <span className={`truncate ${mensajeIa.error ? "text-rojo" : "font-semibold text-morado"}`}>{mensajeIa.texto}</span>
        ) : estado.error ? (
          <span className="text-rojo">{estado.error}</span>
        ) : estado.sinConexion && pistas.length === 0 ? (
          <span className="truncate font-semibold text-naranja">Guardada sin conexión · se enviará al volver internet</span>
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
