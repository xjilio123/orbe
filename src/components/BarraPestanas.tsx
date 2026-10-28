"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "@/components/Icono";

// Cada pestaña lleva el color de su módulo cuando está activa.
const pestanas: { segmento: string; nombre: string; icono: NombreIcono; activa: string }[] = [
  { segmento: "", nombre: "Hoy", icono: "hoy", activa: "bg-indigo-relleno/15 text-indigo" },
  { segmento: "tareas", nombre: "Tareas", icono: "tareas", activa: "bg-azul-relleno/15 text-azul" },
  { segmento: "apuntes", nombre: "Apuntes", icono: "apuntes", activa: "bg-naranja-relleno/15 text-naranja" },
  { segmento: "agenda", nombre: "Agenda", icono: "agenda", activa: "bg-morado-relleno/15 text-morado" },
];

/**
 * Barra flotante de vidrio al estilo de iOS. `prefijo` permite reutilizarla en la vitrina
 * (/vitrina/hoy, /vitrina/tareas…) con las mismas pantallas y datos ficticios.
 */
export function BarraPestanas({ prefijo = "" }: { prefijo?: string }) {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md px-5 pb-[max(env(safe-area-inset-bottom),16px)]"
    >
      <div className="flex flex-1 items-center justify-between rounded-full border border-black/5 bg-vidrio p-2 shadow-[0_8px_24px_rgb(0_0_0/0.12)] backdrop-blur-xl dark:border-white/10">
        {pestanas.map((p) => {
          const href = prefijo ? `${prefijo}/${p.segmento || "hoy"}` : `/${p.segmento}`;
          const activa = p.segmento === "" && !prefijo ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);
          return (
            <Link
              key={p.nombre}
              href={href}
              prefetch
              aria-label={p.nombre}
              aria-current={activa ? "page" : undefined}
              className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[15px] font-semibold transition-colors ${
                activa ? `px-4 ${p.activa}` : "px-3 text-texto-2"
              }`}
            >
              <Icono nombre={p.icono} className="size-[24px]" />
              {activa && <span>{p.nombre}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
