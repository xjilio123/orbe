import Link from "next/link";
import type { AccionesTareas } from "@/app/acciones/tipos";
import { AgendaMes } from "@/components/agenda/AgendaMes";
import { ListaDelDia, horarioEvento } from "@/components/agenda/ListaDelDia";
import { Icono } from "@/components/Icono";
import { CapturaRapida } from "@/components/tareas/CapturaRapida";
import { Encabezado, Pantalla, enlace } from "@/components/ui";
import {
  INICIALES_SEMANA,
  bloquesDelDia,
  cuadriculaMes,
  diasDeSemana,
  fechaLarga,
  moverMes,
  nombreMes,
  puntosDelDia,
  rangoCorto,
  type ItemAgenda,
  type VistaAgenda as Vista,
} from "@/lib/agenda";
import { sumarDias } from "@/lib/fechas";

type Props = {
  vista: Vista;
  dia: string;
  hoy: string;
  /** Minutos desde las 00:00 en Lima, para la línea de "ahora" en la vista de día. */
  ahora: number;
  porDia: Record<string, ItemAgenda[]>;
  google: { conectado: boolean; error: boolean };
  base: string;
  acciones: Pick<AccionesTareas, "capturar" | "alternar">;
};

const NOMBRES: Record<Vista, string> = { dia: "Día", semana: "Semana", mes: "Mes" };
const HORA_PX = 56;

const ruta = (base: string, vista: Vista, dia: string) => enlace(base, `/agenda?vista=${vista}&dia=${dia}`);

function Selector({ vista, dia, base }: { vista: Vista; dia: string; base: string }) {
  return (
    <nav aria-label="Vista de la agenda" className="flex rounded-[12px] bg-control p-1">
      {(["dia", "semana", "mes"] as const).map((v) => (
        <Link
          key={v}
          href={ruta(base, v, dia)}
          aria-current={v === vista ? "page" : undefined}
          className={`flex-1 rounded-[9px] py-1.5 text-center text-[15px] font-semibold ${v === vista ? "bg-superficie shadow-sm" : "text-texto-2"}`}
        >
          {NOMBRES[v]}
        </Link>
      ))}
    </nav>
  );
}

function Navegacion({ vista, dia, hoy, base }: { vista: Vista; dia: string; hoy: string; base: string }) {
  const [antes, despues] =
    vista === "mes" ? [moverMes(dia, -1), moverMes(dia, 1)] : vista === "semana" ? [sumarDias(dia, -7), sumarDias(dia, 7)] : [sumarDias(dia, -1), sumarDias(dia, 1)];
  const semana = diasDeSemana(dia);
  const titulo = vista === "mes" ? nombreMes(dia) : vista === "semana" ? rangoCorto(semana[0], semana[6]) : fechaLarga(dia);
  const flecha = "grid size-10 place-items-center rounded-full bg-superficie text-morado shadow-sm active:scale-95";

  return (
    <div className="flex items-center gap-2">
      <Link href={ruta(base, vista, antes)} aria-label="Anterior" className={flecha}>
        <Icono nombre="atras" className="size-5" />
      </Link>
      <p className="flex-1 truncate text-center text-[17px] font-semibold first-letter:uppercase" aria-live="polite">
        {titulo}
      </p>
      <Link href={ruta(base, vista, despues)} aria-label="Siguiente" className={flecha}>
        <Icono nombre="adelante" className="size-5" />
      </Link>
      <Link
        href={ruta(base, vista, hoy)}
        aria-label="Ir a hoy"
        className="rounded-full bg-superficie px-3.5 py-2 text-[15px] font-semibold text-morado shadow-sm active:scale-95"
      >
        Hoy
      </Link>
    </div>
  );
}

function Semana({ dia, hoy, porDia, base, acciones }: Pick<Props, "dia" | "hoy" | "porDia" | "base" | "acciones">) {
  const dias = diasDeSemana(dia);
  return (
    <>
      <ol aria-label="Días de la semana" className="grid grid-cols-7 gap-1 rounded-[22px] bg-superficie p-2">
        {dias.map((d, i) => (
          <li key={d}>
            <Link
              href={ruta(base, "dia", d)}
              aria-label={fechaLarga(d)}
              className={`flex flex-col items-center gap-0.5 rounded-[14px] py-1.5 active:bg-control ${d === hoy ? "bg-morado-relleno/15" : ""}`}
            >
              <span className="text-[12px] font-semibold text-texto-2">{INICIALES_SEMANA[i]}</span>
              <span className={`text-[17px] tabular-nums ${d === hoy ? "font-bold text-morado" : ""}`}>{Number(d.slice(8))}</span>
              <span className="h-1.5 text-[0px]">{puntosDelDia(porDia[d]).length > 0 ? <span className="inline-block size-1.5 rounded-full bg-morado-relleno" /> : null}</span>
            </Link>
          </li>
        ))}
      </ol>
      <CapturaRapida accion={acciones.capturar} fechaDefecto={dias.includes(hoy) ? hoy : dias[0]} placeholder="Agregar a esta semana…" />
      {dias.map((d) => (
        <section key={d} className="flex flex-col gap-2" aria-labelledby={`dia-${d}`}>
          <h2 id={`dia-${d}`} className={`px-1 text-[17px] font-bold tracking-tight first-letter:uppercase ${d === hoy ? "text-morado" : ""}`}>
            {d === hoy ? `Hoy · ${fechaLarga(d)}` : fechaLarga(d)}
          </h2>
          <ListaDelDia items={porDia[d] ?? []} hoy={hoy} base={base} alternar={acciones.alternar} vacio="Libre" />
        </section>
      ))}
    </>
  );
}

function Dia({ dia, hoy, ahora, porDia, base, acciones }: Pick<Props, "dia" | "hoy" | "ahora" | "porDia" | "base" | "acciones">) {
  const items = porDia[dia] ?? [];
  const sinHora = items.filter((i) => (i.tipo === "evento" ? !i.evento.inicio : !i.tarea.hora));
  const bloques = bloquesDelDia(items);
  const desde = Math.min(7, ...bloques.map((b) => Math.floor(b.inicio / 60)));
  const horas = Array.from({ length: 24 - desde }, (_, i) => desde + i);
  const y = (min: number) => ((min - desde * 60) / 60) * HORA_PX;

  return (
    <>
      <CapturaRapida accion={acciones.capturar} fechaDefecto={dia} placeholder="Agregar a este día…" />
      <section className="flex flex-col gap-2" aria-labelledby="titulo-todo-el-dia">
        <h2 id="titulo-todo-el-dia" className="px-1 text-[17px] font-bold tracking-tight">
          Todo el día y sin hora
        </h2>
        <ListaDelDia items={sinHora} hoy={hoy} base={base} alternar={acciones.alternar} vacio="Nada sin hora." />
      </section>

      <section aria-labelledby="titulo-horas" className="rounded-[22px] bg-superficie py-3 pr-3">
        <h2 id="titulo-horas" className="sr-only">
          Por hora
        </h2>
        <div className="relative" style={{ height: horas.length * HORA_PX }}>
          {horas.map((h) => (
            <div key={h} className="absolute inset-x-0 flex items-start gap-2" style={{ top: y(h * 60) }}>
              <span className="w-12 -translate-y-2 text-right text-[12px] tabular-nums text-texto-2">{h === 12 ? "12 p. m." : `${h % 12 || 12} ${h < 12 ? "a. m." : "p. m."}`}</span>
              <span className="mt-0 h-px flex-1 bg-separador/70" />
            </div>
          ))}

          {bloques.map((b) => {
            const estilo = {
              top: y(b.inicio) + 1,
              height: Math.max(y(b.fin) - y(b.inicio) - 2, 24),
              left: `calc(3.5rem + (100% - 3.5rem) * ${b.columna} / ${b.columnas})`,
              width: `calc((100% - 3.5rem) / ${b.columnas} - 4px)`,
            };
            if (b.item.tipo === "evento") {
              const e = b.item.evento;
              return (
                <div key={b.item.clave} style={estilo} className="absolute overflow-hidden rounded-[8px] border-l-4 border-celeste-relleno bg-celeste-relleno/15 px-2 py-1">
                  <p className="truncate text-[13px] font-semibold">{e.titulo}</p>
                  <p className="truncate text-[12px] text-texto-2">{horarioEvento(e)}</p>
                </div>
              );
            }
            const t = b.item.tarea;
            return (
              <Link
                key={b.item.clave}
                href={enlace(base, `/tareas/${t.id}`)}
                style={estilo}
                className={`absolute overflow-hidden rounded-[8px] border-l-4 px-2 py-1 ${
                  b.item.proyectada ? "border-dashed border-azul-relleno/60 bg-azul-relleno/8" : "border-azul-relleno bg-azul-relleno/15"
                }`}
              >
                <p className={`truncate text-[13px] font-semibold ${t.estado === "hecha" ? "text-texto-2 line-through" : ""}`}>
                  {t.repetir ? "↻ " : ""}
                  {t.titulo}
                </p>
              </Link>
            );
          })}

          {dia === hoy && ahora >= desde * 60 && (
            <div aria-hidden="true" className="absolute right-0 left-12 flex items-center" style={{ top: y(ahora) - 4 }}>
              <span className="size-2 rounded-full bg-rojo-relleno" />
              <span className="h-0.5 flex-1 bg-rojo-relleno" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/** Agenda: mes (con el día elegido debajo), semana o día con sus horas. Tareas + Google Calendar. */
export function VistaAgenda(props: Props) {
  const { vista, dia, hoy, porDia, google, base, acciones } = props;
  const dias = cuadriculaMes(dia);

  return (
    <Pantalla>
      <Encabezado titulo="Agenda" />
      <Selector vista={vista} dia={dia} base={base} />
      <Navegacion vista={vista} dia={dia} hoy={hoy} base={base} />
      {google.error && (
        <p className="rounded-[14px] bg-rojo-relleno/10 px-4 py-2.5 text-[15px] text-rojo">No se pudo leer tu Google Calendar ahora. Tus tareas sí están al día.</p>
      )}

      {vista === "mes" && (
        <AgendaMes
          key={dia}
          dias={dias}
          mes={dia.slice(0, 7)}
          inicial={dia}
          hoy={hoy}
          base={base}
          porDia={porDia}
          capturar={acciones.capturar}
          alternar={acciones.alternar}
        />
      )}
      {vista === "semana" && <Semana {...props} />}
      {vista === "dia" && <Dia {...props} />}

      {!google.conectado && (
        <Link href={enlace(base, "/ajustes#calendario")} className="flex items-center gap-3 rounded-[22px] bg-superficie px-4 py-3 active:scale-[0.99]">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-[10px] bg-celeste-relleno text-white">
            <Icono nombre="agenda" className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[17px] font-semibold">Ver tu Google Calendar aquí</span>
            <span className="text-[13px] text-texto-2">Solo lectura. Se conecta en Ajustes.</span>
          </span>
          <Icono nombre="adelante" className="size-4 text-texto-2" />
        </Link>
      )}
    </Pantalla>
  );
}
