import Link from "next/link";
import type { AccionesTareas } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { IconoModulo, Pantalla, TituloSeccion, enlace } from "@/components/ui";
import { fechaCorta, frecuenciaHabito, type Habito } from "@/lib/progreso";
import type { revisionSemanal } from "@/lib/organizacion";
import type { Tarea } from "@/lib/tareas";

type Props = {
  hoy: string;
  base: string;
  revision: ReturnType<typeof revisionSemanal>;
  habitos: Habito[];
  acciones: Pick<AccionesTareas, "alternar">;
};

function Lista({ tareas, hoy, base, alternar, vacio }: { tareas: Tarea[]; hoy: string; base: string; alternar: AccionesTareas["alternar"]; vacio: string }) {
  if (tareas.length === 0) return <p className="rounded-[22px] bg-superficie px-4 py-4 text-center text-[15px] text-texto-2">{vacio}</p>;
  return (
    <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
      {tareas.slice(0, 30).map((t) => (
        <FilaTarea key={t.id} tarea={t} hoy={hoy} base={base} alternar={alternar} />
      ))}
    </ul>
  );
}

/** Revisión semanal: qué terminaste, qué se atrasó o estancó, qué viene y cómo van tus hábitos. */
export function VistaRevision({ hoy, base, revision: r, habitos, acciones }: Props) {
  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/tareas")} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> Tareas
        </Link>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold tracking-wide text-texto-2 uppercase">Semana del {fechaCorta(r.lunes)}</p>
          <h1 className="text-[34px] leading-tight font-bold tracking-tight">Revisión semanal</h1>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-2 rounded-[22px] bg-superficie p-4 text-center">
        <div className="flex flex-col gap-0.5">
          <dt className="order-2 text-[12px] text-texto-2">terminadas</dt>
          <dd className="text-[28px] font-bold text-verde tabular-nums">{r.hechas.length}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="order-2 text-[12px] text-texto-2">atrasadas</dt>
          <dd className={`text-[28px] font-bold tabular-nums ${r.atrasadas.length ? "text-rojo" : ""}`}>{r.atrasadas.length}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="order-2 text-[12px] text-texto-2">en el Inbox</dt>
          <dd className="text-[28px] font-bold tabular-nums">{r.inbox}</dd>
        </div>
      </dl>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-r-atrasadas">
        <TituloSeccion id="titulo-r-atrasadas" titulo="1. Atrasadas" extra={r.atrasadas.length || undefined} alerta={r.atrasadas.length > 0} />
        <p className="-mt-1 px-1 text-[13px] text-texto-2">Hazlas, cámbiales la fecha o suéltalas.</p>
        <Lista tareas={r.atrasadas} hoy={hoy} base={base} alternar={acciones.alternar} vacio="Nada atrasado. 👏" />
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-r-estancadas">
        <TituloSeccion id="titulo-r-estancadas" titulo="2. Estancadas" extra={r.estancadas.length || undefined} />
        <p className="-mt-1 px-1 text-[13px] text-texto-2">Sin fecha desde hace 2 semanas o más. ¿Siguen siendo importantes?</p>
        <Lista tareas={r.estancadas} hoy={hoy} base={base} alternar={acciones.alternar} vacio="Nada estancado." />
      </section>

      <Link href={enlace(base, "/tareas#inbox")} className="flex items-center gap-3 rounded-[22px] bg-superficie px-4 py-3 active:scale-[0.99]">
        <IconoModulo nombre="inbox" color="celeste" />
        <span className="flex-1 text-[17px] font-semibold">3. Vaciar el Inbox</span>
        <span className="text-[15px] text-texto-2">{r.inbox === 0 ? "Vacío" : `${r.inbox} sin ordenar`}</span>
        <Icono nombre="adelante" className="size-4 text-texto-2" />
      </Link>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-r-proximas">
        <TituloSeccion id="titulo-r-proximas" titulo="4. Próximos 7 días" extra={r.proximas.length || undefined} />
        <Lista tareas={r.proximas} hoy={hoy} base={base} alternar={acciones.alternar} vacio="Nada con fecha esta semana." />
      </section>

      {habitos.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-r-habitos">
          <TituloSeccion id="titulo-r-habitos" titulo="5. Hábitos de la semana" />
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {habitos.map((h) => {
              const meta = Math.min(7, h.dias_semana);
              const cumplido = h.marcas_semana.length >= meta;
              return (
                <li key={h.id} className="flex items-center gap-3 px-4 py-3">
                  <span aria-hidden="true" className="w-7 text-center text-[20px]">
                    {h.icono}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[17px] font-semibold">{h.nombre}</span>
                    <span className="text-[13px] text-texto-2">{frecuenciaHabito(h.dias_semana)}</span>
                  </span>
                  <span className={`text-[15px] font-semibold tabular-nums ${cumplido ? "text-verde" : "text-texto-2"}`}>
                    {h.marcas_semana.length}/{meta}
                    {cumplido ? " ✓" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="titulo-r-hechas">
        <TituloSeccion id="titulo-r-hechas" titulo="Lo que terminaste" extra={r.hechas.length || undefined} />
        <Lista tareas={r.hechas} hoy={hoy} base={base} alternar={acciones.alternar} vacio="Aún nada esta semana. ¡A por la primera!" />
      </section>
    </Pantalla>
  );
}
