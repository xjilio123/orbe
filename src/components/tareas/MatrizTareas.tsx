"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import type { AccionesOrganizacion } from "@/app/acciones/tipos";
import { enlace } from "@/components/ui";
import { etiquetaFecha } from "@/lib/fechas";
import { CUADRANTES, matriz } from "@/lib/organizacion";
import type { Tarea } from "@/lib/tareas";

type Props = { tareas: Tarea[]; hoy: string; base: string; mover: AccionesOrganizacion["moverCuadrante"] };

const MAX_VISIBLES = 8;

/**
 * Matriz de Eisenhower. Cada tarea cae sola en su cuadrante (prioridad y fecha); al tocarla
 * eliges a dónde moverla. El cambio se ve al instante y la base lo confirma después.
 */
export function MatrizTareas({ tareas, hoy, base, mover }: Props) {
  const [lista, cambiar] = useOptimistic(tareas, (actual: Tarea[], c: { id: string; cuadrante: number | null }) =>
    actual.map((t) => (t.id === c.id ? { ...t, cuadrante: c.cuadrante } : t)),
  );
  const [, iniciar] = useTransition();
  const [elegida, setElegida] = useState<Tarea | null>(null);
  const [abiertos, setAbiertos] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const grupos = matriz(lista, hoy);

  function moverA(t: Tarea, cuadrante: number | null) {
    setElegida(null);
    setError(null);
    iniciar(async () => {
      cambiar({ id: t.id, cuadrante });
      try {
        const r = await mover(t.id, cuadrante);
        if (!r.ok) setError(r.error ?? "No se pudo mover.");
      } catch {
        setError("Sin conexión: no se movió.");
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {CUADRANTES.map((c) => {
          const todas = grupos[c.n];
          const visibles = abiertos.has(c.n) ? todas : todas.slice(0, MAX_VISIBLES);
          return (
            <section key={c.n} aria-labelledby={`cuadrante-${c.n}`} className={`flex min-h-44 flex-col gap-1.5 rounded-[20px] p-2.5 ${c.clase}`}>
              <header className="px-1">
                <h2 id={`cuadrante-${c.n}`} className={`flex items-baseline justify-between text-[15px] font-bold ${c.texto}`}>
                  {c.nombre} <span className="text-[13px] font-semibold opacity-80">{todas.length}</span>
                </h2>
                <p className="text-[11px] text-texto-2">{c.accion}</p>
              </header>
              <ul className="flex flex-col gap-1">
                {visibles.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setElegida(t)}
                      className="w-full rounded-[12px] bg-superficie px-2.5 py-2 text-left shadow-sm active:scale-[0.98]"
                    >
                      <span className="line-clamp-2 text-[14px] leading-snug font-medium">
                        {t.prioridad > 0 && <span className="mr-0.5 font-bold text-rojo">{"!".repeat(t.prioridad)}</span>}
                        {t.titulo}
                      </span>
                      {t.fecha && (
                        <span className={`block text-[11px] ${t.fecha < hoy ? "text-rojo" : "text-texto-2"}`}>
                          {etiquetaFecha(t.fecha, hoy)}
                          {t.cuadrante ? " · a mano" : ""}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {todas.length > MAX_VISIBLES && !abiertos.has(c.n) && (
                <button type="button" onClick={() => setAbiertos((s) => new Set(s).add(c.n))} className="px-1 text-left text-[13px] font-semibold text-azul">
                  Ver {todas.length - MAX_VISIBLES} más
                </button>
              )}
              {todas.length === 0 && <p className="px-1 py-2 text-[12px] text-texto-2">Nada aquí.</p>}
            </section>
          );
        })}
      </div>
      <p className="h-5 px-1 text-[13px] text-rojo" aria-live="polite">
        {error}
      </p>

      {elegida && (
        <div role="dialog" aria-modal="true" aria-labelledby="mover-titulo" className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={() => setElegida(null)}>
          <div
            className="mx-auto flex w-full max-w-md flex-col gap-2 rounded-t-[24px] bg-superficie p-4 pb-[max(env(safe-area-inset-bottom),16px)] motion-safe:animate-[entrar-desde-abajo_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[13px] font-semibold text-texto-2">Mover a…</p>
            <h2 id="mover-titulo" className="line-clamp-2 text-[19px] font-bold">
              {elegida.titulo}
            </h2>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {CUADRANTES.map((c) => (
                <button
                  key={c.n}
                  type="button"
                  onClick={() => moverA(elegida, c.n)}
                  aria-pressed={matriz([elegida], hoy)[c.n].length > 0}
                  className={`flex flex-col items-start rounded-[16px] px-3 py-2.5 text-left active:scale-[0.98] aria-pressed:ring-2 aria-pressed:ring-texto ${c.clase}`}
                >
                  <span className={`text-[15px] font-bold ${c.texto}`}>{c.nombre}</span>
                  <span className="text-[11px] text-texto-2">{c.accion}</span>
                </button>
              ))}
            </div>
            <div className="mt-1 flex gap-2">
              {elegida.cuadrante ? (
                <button type="button" onClick={() => moverA(elegida, null)} className="flex-1 rounded-[14px] bg-control py-3 text-[15px] font-semibold">
                  Que Orbe lo decida
                </button>
              ) : null}
              <Link href={enlace(base, `/tareas/${elegida.id}`)} className="flex-1 rounded-[14px] bg-control py-3 text-center text-[15px] font-semibold text-azul">
                Abrir tarea
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

