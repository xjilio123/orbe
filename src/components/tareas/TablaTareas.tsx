"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { AccionesOrganizacion } from "@/app/acciones/tipos";
import { BotonQuitar } from "@/components/progreso/BotonQuitar";
import { enlace } from "@/components/ui";
import { etiquetaFecha } from "@/lib/fechas";
import { aParametros, aplicarTabla, leerConfig, type ConfigTabla, type FiltroEstado, type Orden } from "@/lib/organizacion";
import { NOMBRE_ESTADO, type Tarea } from "@/lib/tareas";

type Vista = { id: string; nombre: string; config: Record<string, unknown> };

type Props = {
  listaId: string;
  tareas: Tarea[];
  inicial: ConfigTabla;
  vistas: Vista[];
  hoy: string;
  base: string;
  acciones: Pick<AccionesOrganizacion, "guardarVista" | "eliminarVista">;
};

const ORDEN_NOMBRE: Record<Orden, string> = { fecha: "Fecha", prioridad: "Prioridad", titulo: "Título", estado: "Estado", creado: "Más nuevas" };
const ESTADO_NOMBRE: Record<FiltroEstado, string> = { pendientes: "Pendientes", todas: "Todas", hechas: "Hechas" };
const CONTROL = "rounded-[10px] bg-control px-2.5 py-2 text-[14px] font-semibold outline-none focus:ring-2 focus:ring-indigo-relleno/40";
const COLOR_ESTADO = { pendiente: "text-texto-2", en_curso: "text-azul", hecha: "text-verde" } as const;

/** La lista como tabla: ordena, filtra y guarda la combinación con un nombre. */
export function TablaTareas({ listaId, tareas, inicial, vistas, hoy, base, acciones }: Props) {
  const [config, setConfig] = useState(inicial);
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
  const [guardando, iniciar] = useTransition();
  const filas = aplicarTabla(tareas, config);
  const ruta = enlace(base, `/tareas/lista/${listaId}`);
  const cambiar = (parcial: Partial<ConfigTabla>) => {
    setMensaje(null);
    setConfig((c) => ({ ...c, ...parcial }));
  };

  function guardar() {
    const limpio = nombre.trim();
    if (!limpio) return setMensaje({ texto: "Ponle un nombre a la vista.", error: true });
    iniciar(async () => {
      try {
        const r = await acciones.guardarVista(listaId, limpio, config);
        if (r.ok) {
          setNombre("");
          setMensaje({ texto: `Guardé “${limpio}”.`, error: false });
        } else setMensaje({ texto: r.error ?? "No se pudo guardar.", error: true });
      } catch {
        setMensaje({ texto: "Sin conexión: no se guardó.", error: true });
      }
    });
  }

  return (
    <section aria-label="Tabla" className="flex flex-col gap-3">
      {vistas.length > 0 && (
        <nav aria-label="Vistas guardadas" className="-mx-5 flex gap-2 overflow-x-auto px-5">
          {vistas.map((v) => (
            <span key={v.id} className="flex shrink-0 items-center rounded-full bg-superficie pl-3 shadow-sm">
              <Link href={`${ruta}?${aParametros(leerConfig(v.config))}`} className="py-1.5 text-[14px] font-semibold text-indigo">
                {v.nombre}
              </Link>
              <BotonQuitar id={v.id} nombre={`la vista ${v.nombre}`} accion={acciones.eliminarVista} />
            </span>
          ))}
        </nav>
      )}

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="px-1 text-[12px] font-semibold text-texto-2">Ordenar por</span>
          <select value={config.orden} onChange={(e) => cambiar({ orden: e.target.value as Orden })} className={CONTROL}>
            {(Object.keys(ORDEN_NOMBRE) as Orden[]).map((o) => (
              <option key={o} value={o}>
                {ORDEN_NOMBRE[o]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="px-1 text-[12px] font-semibold text-texto-2">Mostrar</span>
          <select value={config.estado} onChange={(e) => cambiar({ estado: e.target.value as FiltroEstado })} className={CONTROL}>
            {(Object.keys(ESTADO_NOMBRE) as FiltroEstado[]).map((e) => (
              <option key={e} value={e}>
                {ESTADO_NOMBRE[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="px-1 text-[12px] font-semibold text-texto-2">Prioridad</span>
          <select value={config.prioridad} onChange={(e) => cambiar({ prioridad: Number(e.target.value) })} className={CONTROL}>
            <option value={0}>Todas</option>
            <option value={1}>! o más</option>
            <option value={2}>!! o más</option>
            <option value={3}>Solo !!!</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-[22px] bg-superficie">
        <table className="w-full table-fixed text-left">
          <thead className="border-b border-separador/60 text-[12px] text-texto-2">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">
                Tarea ({filas.length})
              </th>
              <th scope="col" className="w-[76px] py-2 font-semibold">
                Fecha
              </th>
              <th scope="col" className="w-[78px] py-2 pr-3 font-semibold">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separador/60">
            {filas.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5">
                  <Link href={enlace(base, `/tareas/${t.id}`)} className={`line-clamp-2 text-[15px] leading-snug ${t.estado === "hecha" ? "text-texto-2 line-through" : ""}`}>
                    {t.prioridad > 0 && <span className="mr-1 font-bold text-rojo">{"!".repeat(t.prioridad)}</span>}
                    {t.titulo}
                  </Link>
                </td>
                <td className={`py-2.5 text-[13px] ${t.fecha && t.fecha < hoy && t.estado !== "hecha" ? "text-rojo" : "text-texto-2"}`}>
                  {t.fecha ? etiquetaFecha(t.fecha, hoy) : "—"}
                </td>
                <td className={`py-2.5 pr-3 text-[13px] font-semibold ${COLOR_ESTADO[t.estado]}`}>{NOMBRE_ESTADO[t.estado]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filas.length === 0 && <p className="px-4 py-5 text-center text-[15px] text-texto-2">Ninguna tarea con estos filtros.</p>}
      </div>

      <div className="flex gap-2">
        <label className="sr-only" htmlFor="nombre-vista">
          Nombre de la vista
        </label>
        <input
          id="nombre-vista"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={40}
          placeholder="Nombre para guardar esta vista"
          className="min-w-0 flex-1 rounded-[14px] bg-superficie px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-indigo-relleno/40"
        />
        <button type="button" onClick={guardar} disabled={guardando} className="shrink-0 rounded-[14px] bg-indigo-relleno px-4 text-[15px] font-bold text-white active:scale-95 disabled:opacity-60">
          Guardar vista
        </button>
      </div>
      <p className={`h-5 px-1 text-[13px] ${mensaje?.error ? "text-rojo" : "text-verde"}`} aria-live="polite">
        {mensaje?.texto}
      </p>
    </section>
  );
}
