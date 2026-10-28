"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { AccionesProgreso } from "@/app/acciones/tipos";
import { Anillo } from "@/components/Anillo";
import { Icono } from "@/components/Icono";
import { alternarHabito, fraccionHabito, textoRacha, type Habito } from "@/lib/progreso";
import type { ColorLista } from "@/lib/tareas";

/** Color del anillo de cada hábito (clases literales para que Tailwind las encuentre). */
export const ANILLO_COLOR: Record<ColorLista, string> = {
  indigo: "text-indigo-relleno",
  azul: "text-azul-relleno",
  rojo: "text-rojo-relleno",
  morado: "text-morado-relleno",
  naranja: "text-naranja-relleno",
  verde: "text-verde-relleno",
  celeste: "text-celeste-relleno",
};

type Props = { habitos: Habito[]; hoy: string; marcar: AccionesProgreso["marcarHabito"] };

/**
 * Anillos de hábitos al estilo Actividad: un toque marca o desmarca el día.
 * El anillo cambia al instante (optimista) y la base confirma después.
 */
export function AnillosHabitos({ habitos, hoy, marcar }: Props) {
  const [lista, cambiar] = useOptimistic(habitos, (actual: Habito[], id: string) => actual.map((h) => (h.id === id ? alternarHabito(h, hoy) : h)));
  const [, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function tocar(h: Habito) {
    setError(null);
    iniciar(async () => {
      cambiar(h.id);
      try {
        const r = await marcar(h.id, hoy, !h.hecho_hoy);
        if (!r.ok) setError(r.error ?? "No se pudo guardar.");
      } catch {
        setError("Sin conexión: el hábito no se guardó.");
      }
    });
  }

  return (
    <div className="relative">
      <ul className="grid grid-cols-4 gap-x-2 gap-y-3 rounded-[22px] bg-superficie px-2 py-4">
        {lista.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => tocar(h)}
              aria-pressed={h.hecho_hoy}
              aria-label={`${h.nombre}: ${h.hecho_hoy ? "hecho hoy" : "marcar como hecho hoy"}. ${textoRacha(h)}`}
              className="flex w-full flex-col items-center gap-1 rounded-[16px] py-1 transition active:scale-95"
            >
              <span className="relative grid place-items-center">
                <Anillo fraccion={fraccionHabito(h)} clase={ANILLO_COLOR[h.color]} tamano="size-[60px]" />
                <span aria-hidden="true" className={`absolute text-[22px] leading-none ${h.hecho_hoy ? "" : "opacity-70 grayscale-[40%]"}`}>
                  {h.icono}
                </span>
              </span>
              <span className="w-full truncate px-0.5 text-center text-[13px] font-semibold">{h.nombre}</span>
              <span className="flex h-4 items-center gap-0.5 text-[12px] text-texto-2" aria-hidden="true">
                <Icono nombre="llama" className={`size-3.5 ${h.racha > 0 ? "text-naranja" : ""}`} />
                {h.racha}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {/* Debajo del recuadro, sin ocupar lugar: si aparece un error, nada se mueve. */}
      <p className="absolute inset-x-0 top-full mt-0.5 truncate px-1 text-[13px] text-rojo" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
