import Link from "next/link";
import type { AccionesPapelera } from "@/app/acciones/tipos";
import { ConfirmarEliminar } from "@/components/ConfirmarEliminar";
import { Icono } from "@/components/Icono";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import { DIAS_PAPELERA, diasRestantes } from "@/lib/papelera";

type Item = { id: string; titulo: string; icono?: string; borrado_en: string };

type Props = {
  tareas: Item[];
  paginas: Item[];
  base: string;
  /** Para calcular los días que quedan (la vitrina usa una fecha fija). */
  ahora: string;
  acciones: AccionesPapelera;
};

function Fila({ item, tipo, ahora, acciones }: { item: Item; tipo: "tarea" | "pagina"; ahora: string; acciones: AccionesPapelera }) {
  const dias = diasRestantes(item.borrado_en, new Date(ahora));
  const nombre = item.titulo || "Sin título";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span aria-hidden="true" className="w-6 shrink-0 text-center text-[20px]">
        {tipo === "pagina" ? item.icono || "📄" : <Icono nombre="tareas" className="mx-auto size-5 text-texto-2" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[17px]">{nombre}</span>
        <span className={`text-[13px] ${dias <= 3 ? "text-rojo" : "text-texto-2"}`}>
          {dias === 0 ? "Se borra hoy" : `Se borra en ${dias} ${dias === 1 ? "día" : "días"}`}
        </span>
      </span>
      <form action={acciones.restaurar.bind(null, tipo, item.id)}>
        <button type="submit" aria-label={`Restaurar “${nombre}”`} className="rounded-full bg-azul-relleno/12 px-3 py-1.5 text-[15px] font-semibold text-azul active:scale-95">
          Restaurar
        </button>
      </form>
      <form action={acciones.eliminar.bind(null, tipo, item.id)}>
        <button type="submit" aria-label={`Borrar para siempre “${nombre}”`} className="grid size-9 place-items-center rounded-full text-rojo active:bg-control">
          <Icono nombre="basura" className="size-5" />
        </button>
      </form>
    </li>
  );
}

/** Papelera: lo borrado se guarda 30 días; se puede restaurar o borrar para siempre. */
export function VistaPapelera({ tareas, paginas, base, ahora, acciones }: Props) {
  const total = tareas.length + paginas.length;
  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/ajustes")} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> Ajustes
        </Link>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Papelera</h1>
        <p className="text-[15px] text-texto-2">Lo que borras queda aquí {DIAS_PAPELERA} días. Después se borra para siempre, con sus fotos y PDF.</p>
      </header>

      {total === 0 ? (
        <p className="rounded-[22px] bg-superficie px-4 py-6 text-center text-[15px] text-texto-2">La papelera está vacía.</p>
      ) : (
        <>
          {paginas.length > 0 && (
            <section className="flex flex-col gap-2" aria-labelledby="titulo-paginas-borradas">
              <TituloSeccion id="titulo-paginas-borradas" titulo="Páginas" extra={paginas.length} />
              <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
                {paginas.map((p) => (
                  <Fila key={p.id} item={p} tipo="pagina" ahora={ahora} acciones={acciones} />
                ))}
              </ul>
            </section>
          )}
          {tareas.length > 0 && (
            <section className="flex flex-col gap-2" aria-labelledby="titulo-tareas-borradas">
              <TituloSeccion id="titulo-tareas-borradas" titulo="Tareas" extra={tareas.length} />
              <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
                {tareas.map((t) => (
                  <Fila key={t.id} item={t} tipo="tarea" ahora={ahora} acciones={acciones} />
                ))}
              </ul>
            </section>
          )}
          <ConfirmarEliminar
            texto="Vaciar papelera"
            pregunta="¿Vaciar la papelera?"
            detalle="Todo lo que hay aquí se borra para siempre. No se puede deshacer."
            accion={acciones.vaciar}
          />
        </>
      )}
    </Pantalla>
  );
}
