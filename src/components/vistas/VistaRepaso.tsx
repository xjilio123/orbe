"use client";

import Link from "next/link";
import { useState } from "react";
import { Icono } from "@/components/Icono";
import { Pantalla, enlace } from "@/components/ui";
import { mezclar, type Tarjeta } from "@/lib/estudio";

type Props = { titulo: string; tarjetas: Tarjeta[]; volver: { href: string; texto: string }; base: string };

/**
 * Repaso con tarjetas: lees la pregunta, piensas la respuesta y recién después la miras.
 * "Otra vez" la manda al final de la fila; "La sabía" la saca.
 */
export function VistaRepaso({ titulo, tarjetas, volver, base }: Props) {
  const [fila, setFila] = useState(() => tarjetas.map((t) => t.id));
  const [visto, setVisto] = useState(false);
  const [sabidas, setSabidas] = useState(0);
  const [vueltas, setVueltas] = useState(0);
  const porId = new Map(tarjetas.map((t) => [t.id, t]));
  const actual = fila.length ? porId.get(fila[0]) : undefined;
  const hechas = tarjetas.length - fila.length;

  function responder(sabia: boolean) {
    setVisto(false);
    if (sabia) {
      setSabidas((n) => n + 1);
      setFila((f) => f.slice(1));
    } else setFila((f) => [...f.slice(1), f[0]]);
  }

  function reiniciar() {
    const semilla = vueltas + 1;
    setVueltas(semilla);
    setFila(mezclar(tarjetas, semilla * 7919).map((t) => t.id));
    setSabidas(0);
    setVisto(false);
  }

  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, volver.href)} className="flex w-fit items-center gap-1 text-[17px] text-azul">
          <Icono nombre="atras" className="size-5" /> {volver.texto}
        </Link>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Repasar: {titulo}</h1>
      </header>

      {tarjetas.length === 0 ? (
        <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
          Aquí no hay tarjetas. Créalas con IA desde una página (“Tarjetas de estudio”) o escribe cada pregunta como Título 3 y su respuesta debajo.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3" aria-label={`${hechas} de ${tarjetas.length} tarjetas`}>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-control">
              <div className="h-full origin-left rounded-full bg-azul-relleno transition-transform duration-300" style={{ transform: `scaleX(${hechas / tarjetas.length})` }} />
            </div>
            <span className="text-[13px] font-semibold text-texto-2 tabular-nums">
              {hechas}/{tarjetas.length}
            </span>
          </div>

          {actual ? (
            <section aria-live="polite" className="flex min-h-80 flex-col gap-4 rounded-[28px] bg-superficie p-6 shadow-sm">
              <p className="text-[13px] font-semibold tracking-wide text-texto-2 uppercase">Pregunta</p>
              <p className="text-[22px] leading-snug font-bold">{actual.pregunta}</p>
              <div className="flex-1">
                {visto ? (
                  <>
                    <p className="mb-1 text-[13px] font-semibold tracking-wide text-azul uppercase">Respuesta</p>
                    <p className="text-[18px] leading-relaxed whitespace-pre-line">{actual.respuesta}</p>
                  </>
                ) : (
                  <p className="text-[15px] text-texto-2">Piensa tu respuesta antes de mirarla.</p>
                )}
              </div>
              {actual.pagina && <p className="truncate text-[12px] text-texto-2">De: {actual.pagina}</p>}
            </section>
          ) : (
            <section className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-[28px] bg-superficie p-6 text-center">
              <p className="text-[48px]" aria-hidden="true">
                🎉
              </p>
              <p className="text-[22px] font-bold">¡Terminaste!</p>
              <p className="text-[15px] text-texto-2">
                Sabías {sabidas} de {tarjetas.length} a la primera.
              </p>
            </section>
          )}

          <div className="grid h-14 grid-cols-2 gap-3">
            {actual && !visto && (
              <button type="button" onClick={() => setVisto(true)} className="col-span-2 rounded-[18px] bg-azul-relleno text-[17px] font-bold text-white active:scale-[0.98]">
                Mostrar respuesta
              </button>
            )}
            {actual && visto && (
              <>
                <button type="button" onClick={() => responder(false)} className="rounded-[18px] bg-superficie text-[17px] font-semibold text-naranja active:scale-[0.98]">
                  Otra vez
                </button>
                <button type="button" onClick={() => responder(true)} className="rounded-[18px] bg-verde-relleno text-[17px] font-bold text-white active:scale-[0.98]">
                  La sabía
                </button>
              </>
            )}
            {!actual && (
              <button type="button" onClick={reiniciar} className="col-span-2 rounded-[18px] bg-azul-relleno text-[17px] font-bold text-white active:scale-[0.98]">
                Repasar de nuevo (otro orden)
              </button>
            )}
          </div>
        </>
      )}
    </Pantalla>
  );
}
