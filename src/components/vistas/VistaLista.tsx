import Link from "next/link";
import type { AccionesTareas } from "@/app/acciones/tipos";
import { ConfirmarEliminar } from "@/components/ConfirmarEliminar";
import { Icono } from "@/components/Icono";
import { CapturaRapida } from "@/components/tareas/CapturaRapida";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { FormularioLista } from "@/components/tareas/FormularioLista";
import { MoverTarea } from "@/components/tareas/MoverTarea";
import { Pantalla, TEXTO_COLOR, TituloSeccion, enlace } from "@/components/ui";
import { etiquetaFecha } from "@/lib/fechas";
import { ESTADOS, NOMBRE_ESTADO, compararTareas, type Lista, type Tarea } from "@/lib/tareas";

type Props = {
  lista: Lista;
  tareas: Tarea[];
  vista: "lista" | "tablero";
  hoy: string;
  base: string;
  subtareas: Record<string, { hechas: number; total: number }>;
  acciones: Pick<AccionesTareas, "capturar" | "alternar" | "mover" | "guardarLista" | "eliminarLista">;
};

export function VistaLista({ lista, tareas, vista, hoy, base, subtareas, acciones }: Props) {
  const ordenadas = [...tareas].sort(compararTareas);
  const abiertas = ordenadas.filter((t) => t.estado !== "hecha");
  const hechas = ordenadas.filter((t) => t.estado === "hecha");
  const ruta = enlace(base, `/tareas/lista/${lista.id}`);

  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/tareas")} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> Tareas
        </Link>
        <div className="flex items-end justify-between gap-3">
          <h1 className={`truncate text-[34px] font-bold leading-tight tracking-tight ${TEXTO_COLOR[lista.color]}`}>{lista.nombre}</h1>
          <nav aria-label="Vista" className="flex shrink-0 rounded-[12px] bg-control p-1">
            {(["lista", "tablero"] as const).map((v) => (
              <Link
                key={v}
                href={v === "lista" ? ruta : `${ruta}?vista=tablero`}
                aria-current={vista === v ? "page" : undefined}
                aria-label={v === "lista" ? "Ver como lista" : "Ver como tablero"}
                className={`grid size-9 place-items-center rounded-[9px] ${vista === v ? "bg-superficie shadow-sm" : "text-texto-2"}`}
              >
                <Icono nombre={v} className="size-5" />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <CapturaRapida accion={acciones.capturar} listaId={lista.id} placeholder={`Agregar a ${lista.nombre}…`} />

      {vista === "lista" ? (
        <>
          <section className="flex flex-col gap-2" aria-labelledby="titulo-abiertas">
            <TituloSeccion id="titulo-abiertas" titulo="Pendientes" extra={abiertas.length || undefined} />
            {abiertas.length > 0 ? (
              <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
                {abiertas.map((t) => (
                  <FilaTarea key={t.id} tarea={t} hoy={hoy} base={base} alternar={acciones.alternar} subtareas={subtareas[t.id]} />
                ))}
              </ul>
            ) : (
              <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] text-texto-2">Todo al día en esta lista.</p>
            )}
          </section>
          {hechas.length > 0 && (
            <section className="flex flex-col gap-2" aria-labelledby="titulo-hechas">
              <TituloSeccion id="titulo-hechas" titulo="Hechas esta semana" extra={hechas.length} />
              <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
                {hechas.map((t) => (
                  <FilaTarea key={t.id} tarea={t} hoy={hoy} base={base} alternar={acciones.alternar} />
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2" aria-label="Tablero">
          {ESTADOS.map((estado) => {
            const columna = ordenadas.filter((t) => t.estado === estado);
            return (
              <section key={estado} className="flex w-[78%] shrink-0 snap-start flex-col gap-2 rounded-[22px] bg-superficie-2/70 p-3" aria-label={NOMBRE_ESTADO[estado]}>
                <h2 className="flex items-baseline justify-between px-1 text-[17px] font-bold">
                  {NOMBRE_ESTADO[estado]} <span className="text-[15px] font-normal text-texto-2">{columna.length}</span>
                </h2>
                {columna.map((t) => (
                  <article key={t.id} className="flex flex-col gap-2 rounded-[16px] bg-superficie p-3 shadow-sm">
                    <Link href={enlace(base, `/tareas/${t.id}`)} className="text-[16px] leading-snug font-medium">
                      {t.prioridad > 0 && <span className="mr-1 font-bold text-rojo">{"!".repeat(t.prioridad)}</span>}
                      {t.titulo}
                    </Link>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] ${t.fecha && t.fecha < hoy && t.estado !== "hecha" ? "text-rojo" : "text-texto-2"}`}>
                        {t.fecha ? etiquetaFecha(t.fecha, hoy) : ""}
                      </span>
                      <MoverTarea id={t.id} estado={t.estado} mover={acciones.mover} />
                    </div>
                  </article>
                ))}
                {columna.length === 0 && <p className="px-1 py-3 text-center text-[13px] text-texto-2">Vacío</p>}
              </section>
            );
          })}
        </div>
      )}

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-1 py-2 text-[17px] font-semibold text-indigo [&::-webkit-details-marker]:hidden">
          <Icono nombre="ajustes" className="size-5" />
          Editar lista
        </summary>
        <div className="flex flex-col gap-3">
          <FormularioLista accion={acciones.guardarLista.bind(null, lista.id)} nombre={lista.nombre} color={lista.color} boton="Guardar lista" />
          <ConfirmarEliminar
            texto="Eliminar lista"
            pregunta={`¿Eliminar “${lista.nombre}”?`}
            detalle="Sus tareas no se borran: vuelven al Inbox."
            accion={acciones.eliminarLista.bind(null, lista.id)}
          />
        </div>
      </details>
    </Pantalla>
  );
}
