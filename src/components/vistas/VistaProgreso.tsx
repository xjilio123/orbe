import Link from "next/link";
import type { AccionesProgreso } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { AnillosHabitos } from "@/components/progreso/AnillosHabitos";
import { Barras } from "@/components/progreso/Barras";
import { BotonQuitar } from "@/components/progreso/BotonQuitar";
import { FormularioFecha, FormularioHabito, FormularioMeta } from "@/components/progreso/Formularios";
import { TarjetaMeta } from "@/components/progreso/TarjetaMeta";
import { Encabezado, IconoModulo, Pantalla, TEXTO_COLOR, TituloSeccion, enlace } from "@/components/ui";
import { etiquetaFecha } from "@/lib/fechas";
import {
  formatoHoras,
  formatoMinutos,
  frecuenciaHabito,
  resumenEstadisticas,
  semanaDeHabito,
  textoFaltan,
  textoRacha,
  type FechaImportante,
  type Habito,
  type Meta,
  type SemanaEstadistica,
} from "@/lib/progreso";
import { INICIALES_SEMANA } from "@/lib/agenda";
import type { Lista } from "@/lib/tareas";

type Props = {
  hoy: string;
  base: string;
  anio: number;
  habitos: Habito[];
  metas: Meta[];
  fechas: FechaImportante[];
  estadisticas: SemanaEstadistica[];
  minutosHoy: number;
  listas: Lista[];
  acciones: AccionesProgreso;
};

const PUNTO = { hecho: "bg-verde-relleno", pendiente: "bg-control", futuro: "bg-control/50" } as const;

/** Hábitos, metas del año, fechas importantes, foco y estadísticas en una sola pantalla. */
export function VistaProgreso({ hoy, base, anio, habitos, metas, fechas, estadisticas, minutosHoy, listas, acciones }: Props) {
  const r = resumenEstadisticas(estadisticas);
  const mejorRacha = habitos.reduce((max, h) => (h.racha > max.racha ? h : max), habitos[0] ?? null);

  return (
    <Pantalla>
      <Encabezado titulo="Progreso" sobre="Hábitos, metas y foco" />

      <Link href={enlace(base, "/foco")} className="flex items-center gap-3 rounded-[22px] bg-superficie px-4 py-3.5 active:scale-[0.99]">
        <IconoModulo nombre="foco" color="rojo" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[17px] font-semibold">Modo foco</span>
          <span className="text-[15px] text-texto-2">
            {minutosHoy > 0 ? `Hoy llevas ${formatoMinutos(minutosHoy)} de foco` : "Pomodoro de 25 minutos ligado a una tarea"}
          </span>
        </div>
        <Icono nombre="adelante" className="size-4 text-texto-2" />
      </Link>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-habitos">
        <TituloSeccion
          id="titulo-habitos"
          titulo="Hábitos"
          extra={mejorRacha && mejorRacha.racha > 0 ? `Mejor racha: ${mejorRacha.icono} ${mejorRacha.racha}` : undefined}
        />
        {habitos.length > 0 ? (
          <>
            <AnillosHabitos habitos={habitos} hoy={hoy} marcar={acciones.marcarHabito} />
            {/* mt-3: deja lugar al aviso de error de los anillos sin tapar la lista. */}
            <ul className="mt-3 divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
              {habitos.map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                  <span aria-hidden="true" className="w-8 shrink-0 text-center text-[22px]">
                    {h.icono}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-[17px] font-semibold">{h.nombre}</p>
                    <p className="truncate text-[13px] text-texto-2">
                      {frecuenciaHabito(h.dias_semana)} · {textoRacha(h)}
                    </p>
                    <ol className="flex gap-2" aria-label={`Esta semana: ${h.marcas_semana.length} de ${Math.min(7, h.dias_semana)}`}>
                      {semanaDeHabito(h, hoy).map((d, i) => (
                        <li key={d.fecha} className="flex w-3 flex-col items-center gap-0.5" aria-hidden="true">
                          <span className={`size-2.5 rounded-full ${PUNTO[d.estado]}`} />
                          <span className={`text-[10px] ${d.fecha === hoy ? "font-bold" : "text-texto-2"}`}>{INICIALES_SEMANA[i]}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <BotonQuitar id={h.id} nombre={h.nombre} accion={acciones.eliminarHabito} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
            Crea tu primer hábito. Cada día que lo cumplas, toca su anillo y verás crecer tu racha.
          </p>
        )}
        <FormularioHabito accion={acciones.crearHabito} />
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-metas">
        <TituloSeccion id="titulo-metas" titulo={`Metas de ${anio}`} extra={metas.length || undefined} />
        {metas.length > 0 ? (
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {metas.map((m) => (
              <TarjetaMeta key={m.id} meta={m} avanzar={acciones.avanzarMeta} eliminar={acciones.eliminarMeta} />
            ))}
          </ul>
        ) : (
          <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
            ¿Qué quieres lograr este año? Mide el avance con un número o con las tareas de una lista.
          </p>
        )}
        <FormularioMeta accion={acciones.crearMeta} listas={listas} />
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-fechas">
        <TituloSeccion id="titulo-fechas" titulo="Fechas importantes" />
        {fechas.length > 0 ? (
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {fechas.map((f) => (
              <li key={f.id} className={`flex items-center gap-3 py-2.5 pr-2 pl-4 ${f.fecha < hoy ? "opacity-60" : ""}`}>
                <span aria-hidden="true" className="w-8 shrink-0 text-center text-[22px]">
                  {f.icono}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-[17px] font-semibold">{f.titulo}</p>
                  <p className="text-[13px] text-texto-2">
                    {etiquetaFecha(f.fecha, hoy)} · <span className={`font-semibold ${TEXTO_COLOR[f.color]}`}>{textoFaltan(f.fecha, hoy)}</span>
                  </p>
                </div>
                <BotonQuitar id={f.id} nombre={f.titulo} accion={acciones.eliminarFecha} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
            Exámenes, viajes o entregas: verás cuántos días faltan aquí y en Hoy.
          </p>
        )}
        <FormularioFecha accion={acciones.crearFecha} hoy={hoy} />
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-numeros">
        <TituloSeccion id="titulo-numeros" titulo="Tus números" extra="Últimas 8 semanas" />
        <div className="flex flex-col gap-5 rounded-[22px] bg-superficie p-4">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col gap-0.5">
              <dt className="order-2 text-[12px] text-texto-2">tareas esta semana</dt>
              <dd className="text-[26px] font-bold tabular-nums">{r.tareasSemana}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="order-2 text-[12px] text-texto-2">promedio semanal</dt>
              <dd className="text-[26px] font-bold tabular-nums">{String(r.promedioTareas).replace(".", ",")}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="order-2 text-[12px] text-texto-2">de foco en total</dt>
              <dd className="whitespace-nowrap text-[26px] font-bold tabular-nums">{formatoHoras(r.totalMinutos)}</dd>
            </div>
          </dl>
          <Barras
            titulo="Tareas hechas por semana"
            valores={estadisticas.map((s) => ({ semana: s.semana, valor: s.tareas }))}
            maximo={r.maximoTareas}
            color="bg-azul-relleno"
          />
          <Barras
            titulo="Minutos de foco por semana"
            valores={estadisticas.map((s) => ({ semana: s.semana, valor: s.minutos }))}
            maximo={r.maximoMinutos}
            color="bg-rojo-relleno"
          />
        </div>
      </section>
    </Pantalla>
  );
}
