import Link from "next/link";
import type { AccionesIa, AccionesTareas } from "@/app/acciones/tipos";
import { Anillo } from "@/components/Anillo";
import { Icono } from "@/components/Icono";
import { AvisoInstalar } from "@/components/pwa/AvisoInstalar";
import { CapturaRapida } from "@/components/tareas/CapturaRapida";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { Encabezado, IconoModulo, Pantalla, TEXTO_COLOR, TituloSeccion, enlace, type ColorModulo } from "@/components/ui";
import type { NombreIcono } from "@/components/Icono";
import type { Lista, Tarea } from "@/lib/tareas";

const proximamente: { nombre: string; texto: string; icono: NombreIcono; color: ColorModulo; fase: string }[] = [
  { nombre: "Búsqueda y sin conexión", texto: "Encuentra todo y úsalo sin internet.", icono: "buscar", color: "azul", fase: "Fase 3" },
  { nombre: "IA con topes", texto: "Captura inteligente y resúmenes.", icono: "chispa", color: "morado", fase: "Fase 4" },
];

type Props = {
  fecha: string;
  saludo: string;
  nombre?: string;
  hoy: string;
  base: string;
  resumen: { pendientes: Tarea[]; hechas: number; total: number; fraccion: number };
  inbox: number;
  listas: Lista[];
  acciones: Pick<AccionesTareas, "capturar" | "alternar">;
  ia?: AccionesIa;
};

/** Pantalla Hoy sin acceso a datos: la página real y la vitrina le pasan lo que debe mostrar. */
export function VistaHoy({ fecha, saludo, nombre, hoy, base, resumen, inbox, listas, acciones, ia }: Props) {
  const porId = new Map(listas.map((l) => [l.id, l]));
  const quedan = resumen.total - resumen.hechas;

  return (
    <Pantalla>
      <Encabezado titulo="Hoy" sobre={fecha} />

      <section className="flex items-center gap-4 rounded-[22px] bg-superficie p-4" aria-label="Avance del día">
        <Anillo fraccion={resumen.fraccion} etiqueta={`${resumen.hechas} de ${resumen.total} tareas de hoy hechas`} />
        <div className="flex min-w-0 flex-col">
          <p className="text-[20px] font-semibold tracking-tight">
            {saludo}
            {nombre ? `, ${nombre}` : ""}.
          </p>
          <p className="text-[15px] text-texto-2">
            {resumen.total === 0
              ? "No tienes nada para hoy."
              : quedan === 0
                ? `¡Listo! Terminaste las ${resumen.total} de hoy.`
                : `${resumen.hechas} de ${resumen.total} hechas · te ${quedan === 1 ? "queda 1" : `quedan ${quedan}`}`}
          </p>
        </div>
      </section>

      <CapturaRapida accion={acciones.capturar} ia={ia?.captura} />

      <section className="flex flex-col gap-2" aria-labelledby="titulo-para-hoy">
        <TituloSeccion id="titulo-para-hoy" titulo="Para hoy" extra={resumen.pendientes.length || undefined} />
        {resumen.pendientes.length > 0 ? (
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {resumen.pendientes.map((t) => {
              const lista = t.lista_id ? porId.get(t.lista_id) : undefined;
              return (
                <FilaTarea
                  key={t.id}
                  tarea={t}
                  hoy={hoy}
                  base={base}
                  alternar={acciones.alternar}
                  lista={lista && { nombre: lista.nombre, texto: TEXTO_COLOR[lista.color] }}
                />
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] text-texto-2">
            Nada pendiente para hoy. Escribe arriba lo que quieras hacer.
          </p>
        )}
      </section>

      <Link
        href={enlace(base, "/tareas#inbox")}
        className="flex items-center gap-3 rounded-[22px] bg-superficie px-4 py-3 active:scale-[0.99]"
      >
        <IconoModulo nombre="inbox" color="celeste" />
        <span className="flex-1 text-[17px] font-semibold">Inbox</span>
        <span className="text-[15px] text-texto-2">{inbox === 0 ? "Vacío" : `${inbox} sin ordenar`}</span>
        <Icono nombre="adelante" className="size-4 text-texto-2" />
      </Link>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-camino">
        <TituloSeccion id="titulo-camino" titulo="En camino" />
        <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
          {proximamente.map((m) => (
            <li key={m.nombre} className="flex items-center gap-3 px-4 py-3">
              <IconoModulo nombre={m.icono} color={m.color} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[17px] font-semibold">{m.nombre}</p>
                <p className="truncate text-[15px] text-texto-2">{m.texto}</p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-texto-2">{m.fase}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Al final y flotante: aparece después de cargar sin mover nada de la pantalla. */}
      <AvisoInstalar />
    </Pantalla>
  );
}
