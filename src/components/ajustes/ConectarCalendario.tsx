"use client";

import { useActionState } from "react";
import type { AccionesAjustes } from "@/app/acciones/tipos";

type Props = {
  conectado: boolean;
  acciones: Pick<AccionesAjustes, "guardarCalendario" | "quitarCalendario">;
};

/** Google Calendar de solo lectura: se pega la "Dirección secreta en formato iCal". */
export function ConectarCalendario({ conectado, acciones }: Props) {
  const [estado, enviar, guardando] = useActionState(acciones.guardarCalendario, {});
  const error = estado.errores?.url;

  return (
    <section id="calendario" className="flex scroll-mt-6 flex-col gap-3 rounded-[22px] bg-superficie p-4" aria-labelledby="titulo-calendario">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-calendario" className="text-[17px] font-semibold">
          Google Calendar
        </h2>
        {conectado && <span className="rounded-full bg-verde-relleno/15 px-2.5 py-0.5 text-[13px] font-semibold text-verde">Conectado</span>}
      </div>

      {conectado ? (
        <>
          <p className="text-[15px] leading-5 text-texto-2">Tus eventos aparecen en la Agenda (solo lectura, se actualizan cada 10 minutos).</p>
          <form action={acciones.quitarCalendario}>
            <button type="submit" className="w-full rounded-[14px] bg-control py-2.5 text-[15px] font-semibold text-rojo active:scale-[0.98]">
              Desconectar
            </button>
          </form>
        </>
      ) : (
        <form action={enviar} className="flex flex-col gap-3">
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-[15px] leading-5 text-texto-2">
            <li>En una computadora, abre calendar.google.com → ⚙️ Configuración.</li>
            <li>Elige tu calendario → “Integrar el calendario”.</li>
            <li>Copia la “Dirección secreta en formato iCal” y pégala aquí.</li>
          </ol>
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Dirección secreta en formato iCal</span>
            <input
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              required
              maxLength={600}
              placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
              aria-invalid={Boolean(error)}
              className="w-full rounded-[12px] bg-control px-3 py-2.5 text-[16px] outline-none focus:ring-2 focus:ring-celeste-relleno/40"
            />
            {error && <span className="text-[13px] text-rojo">{error}</span>}
          </label>
          <p className="text-[13px] text-texto-2">Esa dirección es privada: Orbe solo la usa para leer tus eventos y nunca la muestra.</p>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-[14px] bg-celeste-relleno py-2.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {guardando ? "Conectando…" : "Conectar"}
          </button>
        </form>
      )}
    </section>
  );
}
