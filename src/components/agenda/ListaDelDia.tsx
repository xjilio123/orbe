import Link from "next/link";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { enlace } from "@/components/ui";
import type { Evento, ItemAgenda } from "@/lib/agenda";
import { etiquetaHora } from "@/lib/fechas";
import { etiquetaRepetir } from "@/lib/repeticion";
import type { Tarea } from "@/lib/tareas";

/** "9:00 – 10:30 a. m." o "Todo el día". */
export function horarioEvento(e: Evento): string {
  if (!e.inicio) return "Todo el día";
  return e.fin ? `${etiquetaHora(e.inicio)} – ${etiquetaHora(e.fin)}` : etiquetaHora(e.inicio);
}

function FilaEvento({ evento }: { evento: Evento }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span aria-hidden="true" className="mt-1 h-9 w-1 shrink-0 rounded-full bg-celeste-relleno" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[17px] leading-snug">{evento.titulo}</span>
        <span className="flex flex-wrap gap-x-2 text-[13px] text-texto-2">
          <span>{horarioEvento(evento)}</span>
          {evento.lugar && <span className="truncate">{evento.lugar}</span>}
          <span className="text-celeste">Google</span>
        </span>
      </div>
    </li>
  );
}

/** Una vez futura de una tarea que se repite: todavía no existe, se crea al marcar la anterior. */
function FilaRepeticion({ tarea, base }: { tarea: Tarea; base: string }) {
  return (
    <li>
      <Link href={enlace(base, `/tareas/${tarea.id}`)} className="flex items-start gap-3 px-4 py-3 active:bg-control">
        <span aria-hidden="true" className="mt-0.5 size-[26px] shrink-0 rounded-full border-2 border-dashed border-texto-2/50" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] leading-snug text-texto-2">{tarea.titulo}</span>
          <span className="text-[13px] text-texto-2">
            ↻ {etiquetaRepetir(tarea.repetir!, tarea.fecha)}
            {tarea.hora && ` · ${etiquetaHora(tarea.hora)}`}
          </span>
        </span>
      </Link>
    </li>
  );
}

type Props = {
  items: ItemAgenda[];
  hoy: string;
  base: string;
  alternar: (id: string, hecha: boolean) => Promise<void>;
  vacio?: string;
};

/** Lo que hay en un día: eventos de Google, tareas (con su check) y repeticiones futuras. */
export function ListaDelDia({ items, hoy, base, alternar, vacio = "Nada para este día." }: Props) {
  if (items.length === 0) {
    return <p className="rounded-[22px] bg-superficie px-4 py-4 text-center text-[15px] text-texto-2">{vacio}</p>;
  }
  return (
    <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
      {items.map((i) =>
        i.tipo === "evento" ? (
          <FilaEvento key={i.clave} evento={i.evento} />
        ) : i.proyectada ? (
          <FilaRepeticion key={i.clave} tarea={i.tarea} base={base} />
        ) : (
          <FilaTarea key={i.clave} tarea={i.tarea} hoy={hoy} base={base} alternar={alternar} />
        ),
      )}
    </ul>
  );
}
