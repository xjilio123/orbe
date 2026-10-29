import Link from "next/link";
import type { AccionesIa, AccionesProgreso, AccionesTareas } from "@/app/acciones/tipos";
import { Anillo } from "@/components/Anillo";
import { Icono } from "@/components/Icono";
import { TuDiaIa } from "@/components/ia/TuDiaIa";
import { AnillosHabitos } from "@/components/progreso/AnillosHabitos";
import { AvisoInstalar } from "@/components/pwa/AvisoInstalar";
import { CapturaRapida } from "@/components/tareas/CapturaRapida";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { Encabezado, IconoModulo, Pantalla, TEXTO_COLOR, TituloSeccion, enlace } from "@/components/ui";
import type { Plan, ResumenSemana } from "@/lib/ia/contenido";
import { proximasFechas, textoFaltan, type FechaImportante, type Habito } from "@/lib/progreso";
import type { Lista, Tarea } from "@/lib/tareas";

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
  /** Plan del día y resumen semanal guardados (hechos con IA). */
  iaGuardado?: { plan: Plan | null; semana: ResumenSemana | null };
  habitos?: Habito[];
  fechas?: FechaImportante[];
  progreso?: Pick<AccionesProgreso, "marcarHabito">;
};

/** Pantalla Hoy sin acceso a datos: la página real y la vitrina le pasan lo que debe mostrar. */
export function VistaHoy({ fecha, saludo, nombre, hoy, base, resumen, inbox, listas, acciones, ia, iaGuardado, habitos = [], fechas = [], progreso }: Props) {
  const porId = new Map(listas.map((l) => [l.id, l]));
  const quedan = resumen.total - resumen.hechas;
  const proximas = proximasFechas(fechas, hoy, 3);

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

      {habitos.length > 0 && progreso && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-habitos-hoy">
          <TituloSeccion
            id="titulo-habitos-hoy"
            titulo="Hábitos"
            extra={
              <Link href={enlace(base, "/progreso")} className="font-semibold text-azul">
                Progreso
              </Link>
            }
          />
          <AnillosHabitos habitos={habitos} hoy={hoy} marcar={progreso.marcarHabito} />
        </section>
      )}

      {proximas.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-fechas-hoy">
          <TituloSeccion id="titulo-fechas-hoy" titulo="Cuenta regresiva" />
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {proximas.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span aria-hidden="true" className="text-[22px]">
                  {f.icono}
                </span>
                <p className="min-w-0 flex-1 truncate text-[17px] font-semibold">{f.titulo}</p>
                <span className={`shrink-0 text-[15px] font-semibold ${TEXTO_COLOR[f.color]}`}>{textoFaltan(f.fecha, hoy)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ia && <TuDiaIa plan={iaGuardado?.plan ?? null} semana={iaGuardado?.semana ?? null} ia={ia} />}

      <Link
        href={enlace(base, "/tareas#inbox")}
        className="flex items-center gap-3 rounded-[22px] bg-superficie px-4 py-3 active:scale-[0.99]"
      >
        <IconoModulo nombre="inbox" color="celeste" />
        <span className="flex-1 text-[17px] font-semibold">Inbox</span>
        <span className="text-[15px] text-texto-2">{inbox === 0 ? "Vacío" : `${inbox} sin ordenar`}</span>
        <Icono nombre="adelante" className="size-4 text-texto-2" />
      </Link>

      {habitos.length === 0 && (
        <Link
          href={enlace(base, "/progreso")}
          className="flex items-center gap-3 rounded-[22px] bg-superficie px-4 py-3 active:scale-[0.99]"
        >
          <IconoModulo nombre="llama" color="naranja" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[17px] font-semibold">Progreso</span>
            <span className="truncate text-[15px] text-texto-2">Hábitos, metas, fechas y modo foco</span>
          </div>
          <Icono nombre="adelante" className="size-4 text-texto-2" />
        </Link>
      )}

      {/* Al final y flotante: aparece después de cargar sin mover nada de la pantalla. */}
      <AvisoInstalar />
    </Pantalla>
  );
}
