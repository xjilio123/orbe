import Link from "next/link";
import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";

/** Contenedor de cada pantalla: ancho de teléfono, márgenes seguros y espacio para la barra de pestañas. */
export function Pantalla({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),24px)] pb-32">
      {children}
    </main>
  );
}

/** Título grande al estilo iOS, con un texto pequeño encima y el acceso a Ajustes a la derecha. */
export function Encabezado({ titulo, sobre }: { titulo: string; sobre?: string }) {
  return (
    <header className="flex items-end justify-between gap-4 pt-2">
      <div className="flex flex-col gap-1">
        {sobre && <p className="text-[13px] font-semibold uppercase tracking-wide text-texto-2">{sobre}</p>}
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">{titulo}</h1>
      </div>
      <Link
        href="/ajustes"
        aria-label="Ajustes"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-superficie text-texto-2 shadow-sm active:scale-95"
      >
        <Icono nombre="ajustes" className="size-[22px]" />
      </Link>
    </header>
  );
}

const colores = {
  indigo: "bg-indigo-relleno",
  azul: "bg-azul-relleno",
  rojo: "bg-rojo-relleno",
  morado: "bg-morado-relleno",
  naranja: "bg-naranja-relleno",
  verde: "bg-verde-relleno",
  celeste: "bg-celeste-relleno",
} as const;
export type ColorModulo = keyof typeof colores;
export const FONDO_COLOR: Record<ColorModulo, string> = colores;
export const TEXTO_COLOR: Record<ColorModulo, string> = {
  indigo: "text-indigo",
  azul: "text-azul",
  rojo: "text-rojo",
  morado: "text-morado",
  naranja: "text-naranja",
  verde: "text-verde",
  celeste: "text-celeste",
};

/** Enlaces que funcionan igual en la app y en la vitrina (/vitrina/...). */
export function enlace(base: string, ruta: string): string {
  if (!base) return ruta;
  return ruta === "/" ? `${base}/hoy` : `${base}${ruta}`;
}

/** Título de sección al estilo iOS, con un contador o acción a la derecha. */
export function TituloSeccion({ id, titulo, extra, alerta }: { id: string; titulo: string; extra?: ReactNode; alerta?: boolean }) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <h2 id={id} className={`text-[20px] font-bold tracking-tight ${alerta ? "text-rojo" : ""}`}>
        {titulo}
      </h2>
      {extra && <div className="text-[15px] text-texto-2">{extra}</div>}
    </div>
  );
}

/** Ícono blanco sobre un cuadrado redondeado del color del módulo (como en Ajustes de iOS). */
export function IconoModulo({ nombre, color, grande = false }: { nombre: NombreIcono; color: ColorModulo; grande?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center text-white ${colores[color]} ${
        grande ? "size-16 rounded-[18px]" : "size-9 rounded-[10px]"
      }`}
    >
      <Icono nombre={nombre} className={grande ? "size-9" : "size-5"} />
    </span>
  );
}

/** Estado vacío honesto: dice qué llegará y en qué fase. */
export function Proximamente({
  icono,
  color,
  titulo,
  texto,
  fase,
}: {
  icono: NombreIcono;
  color: ColorModulo;
  titulo: string;
  texto: string;
  fase: number;
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-[28px] bg-superficie px-6 py-10 text-center">
      <IconoModulo nombre={icono} color={color} grande />
      <div className="flex flex-col gap-2">
        <h2 className="text-[22px] font-bold tracking-tight">{titulo}</h2>
        <p className="text-[17px] leading-relaxed text-texto-2">{texto}</p>
      </div>
      <p className="rounded-full bg-control px-3 py-1 text-[13px] font-semibold text-texto-2">Llega en la Fase {fase}</p>
    </section>
  );
}
