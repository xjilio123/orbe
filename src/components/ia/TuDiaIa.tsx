import type { AccionesIa } from "@/app/acciones/tipos";
import { BotonPlan, BotonSemana, Destello } from "@/components/ia/BotonIa";
import { etiquetaHora } from "@/lib/fechas";
import type { Plan, ResumenSemana } from "@/lib/ia/contenido";

type Props = {
  plan: Plan | null;
  semana: ResumenSemana | null;
  ia: Pick<AccionesIa, "plan" | "semana">;
};

const COLOR = { tarea: "bg-azul-relleno", evento: "bg-celeste-relleno", pausa: "bg-texto-2/40" } as const;

/** Pantalla Hoy: el plan del día y el resumen semanal hechos con IA (se guardan; abrir Hoy no gasta usos). */
export function TuDiaIa({ plan, semana, ia }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4" aria-labelledby="titulo-tu-dia">
      <h2 id="titulo-tu-dia" className="flex items-center gap-2 text-[17px] font-semibold">
        <Destello className="size-4 text-morado" />
        Tu día con IA
      </h2>

      {plan && (
        <div className="flex flex-col gap-2">
          <ol className="flex flex-col gap-1.5">
            {plan.bloques.map((b, i) => (
              <li key={`${b.hora}-${i}`} className="flex items-start gap-3">
                <span className="w-[74px] shrink-0 pt-0.5 text-right text-[13px] tabular-nums text-texto-2">{etiquetaHora(b.hora)}</span>
                <span aria-hidden="true" className={`mt-1 h-4 w-1 shrink-0 rounded-full ${COLOR[b.tipo]}`} />
                <span className={`flex-1 text-[15px] leading-snug ${b.tipo === "pausa" ? "text-texto-2" : ""}`}>
                  {b.titulo}
                  <span className="text-[13px] text-texto-2"> · {b.minutos} min</span>
                </span>
              </li>
            ))}
          </ol>
          {plan.consejo && <p className="text-[13px] text-texto-2 italic">{plan.consejo}</p>}
        </div>
      )}

      {semana && (
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-superficie-2 p-3">
          <p className="text-[13px] font-semibold text-morado">Tu semana</p>
          <p className="text-[15px] leading-snug">{semana.resumen}</p>
          {semana.logros.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-[14px]">
              {semana.logros.map((l) => (
                <li key={l} className="flex gap-1.5">
                  <span className="text-verde" aria-hidden="true">
                    ✓
                  </span>
                  {l}
                </li>
              ))}
            </ul>
          )}
          {semana.pendientes.length > 0 && <p className="text-[13px] text-texto-2">Pendiente: {semana.pendientes.join(" · ")}</p>}
          {semana.sugerencia && <p className="text-[13px] text-texto-2 italic">{semana.sugerencia}</p>}
        </div>
      )}

      <div className="flex gap-2">
        <BotonPlan accion={ia.plan} rehacer={Boolean(plan)} />
        {!semana && <BotonSemana accion={ia.semana} />}
      </div>
    </section>
  );
}
