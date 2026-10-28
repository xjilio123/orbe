"use client";

import { useState } from "react";
import type { AccionesIa, EstadoCaptura } from "@/app/acciones/tipos";
import { ListaDelDia } from "@/components/agenda/ListaDelDia";
import { CapturaRapida } from "@/components/tareas/CapturaRapida";
import { INICIALES_SEMANA, fechaLarga, puntosDelDia, type ItemAgenda } from "@/lib/agenda";

type Props = {
  dias: string[];
  mes: string; // "AAAA-MM"
  inicial: string;
  hoy: string;
  base: string;
  porDia: Record<string, ItemAgenda[]>;
  capturar: (anterior: EstadoCaptura, formData: FormData) => Promise<EstadoCaptura>;
  alternar: (id: string, hecha: boolean) => Promise<void>;
  ia?: AccionesIa["captura"];
};

const COLOR_PUNTO = { evento: "bg-celeste-relleno", tarea: "bg-azul-relleno", hecha: "bg-verde-relleno" } as const;

/**
 * Mes al estilo del Calendario de iOS: tocar un día muestra lo que hay debajo, al instante y sin ir al servidor.
 * La cuadrícula siempre tiene 6 semanas, así nada de abajo se mueve al cambiar de mes.
 */
export function AgendaMes({ dias, mes, inicial, hoy, base, porDia, capturar, alternar, ia }: Props) {
  const [elegido, setElegido] = useState(inicial);

  function elegir(dia: string) {
    setElegido(dia);
    // Recordar el día en la dirección (al recargar o volver atrás), sin pedir nada al servidor.
    window.history.replaceState(null, "", `?vista=mes&dia=${dia}`);
  }

  const items = porDia[elegido] ?? [];
  const titulo = fechaLarga(elegido);

  return (
    <>
      <section aria-label="Días del mes" className="rounded-[22px] bg-superficie p-3">
        <div className="grid grid-cols-7 pb-1" aria-hidden="true">
          {INICIALES_SEMANA.map((d, i) => (
            <span key={i} className="text-center text-[12px] font-semibold text-texto-2">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {dias.map((dia) => {
            const puntos = puntosDelDia(porDia[dia]);
            const fuera = !dia.startsWith(mes);
            const esHoy = dia === hoy;
            const activo = dia === elegido;
            return (
              <button
                key={dia}
                type="button"
                onClick={() => elegir(dia)}
                aria-pressed={activo}
                aria-label={`${fechaLarga(dia)}${esHoy ? ", hoy" : ""}${porDia[dia]?.length ? `, ${porDia[dia].length} cosas` : ""}`}
                className="flex h-12 flex-col items-center justify-start gap-0.5 rounded-[12px] pt-1 active:bg-control"
              >
                <span
                  className={`grid size-8 place-items-center rounded-full text-[17px] tabular-nums ${
                    activo && esHoy
                      ? "bg-morado-relleno font-bold text-white"
                      : activo
                        ? "bg-texto font-bold text-superficie"
                        : esHoy
                          ? "font-bold text-morado"
                          : fuera
                            ? "text-texto-2/50"
                            : ""
                  }`}
                >
                  {Number(dia.slice(8))}
                </span>
                <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                  {puntos.map((p) => (
                    <span key={p} className={`size-1.5 rounded-full ${COLOR_PUNTO[p]} ${fuera ? "opacity-40" : ""}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-dia-elegido">
        <h2 id="titulo-dia-elegido" className="px-1 text-[20px] font-bold tracking-tight first-letter:uppercase">
          {elegido === hoy ? `Hoy · ${titulo}` : titulo}
        </h2>
        <CapturaRapida accion={capturar} fechaDefecto={elegido} placeholder="Agregar a este día…" ia={ia} />
        <ListaDelDia items={items} hoy={hoy} base={base} alternar={alternar} />
      </section>
    </>
  );
}
