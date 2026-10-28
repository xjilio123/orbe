"use client";

import { memo, type KeyboardEvent } from "react";
import { Icono } from "@/components/Icono";
import { tamanoLegible } from "@/lib/archivos";
import type { Bloque } from "@/lib/bloques";

type Props = {
  bloque: Bloque;
  numero?: number;
  url?: string;
  tamano?: number;
  seleccionado: boolean;
  registrar: (id: string, campo: HTMLTextAreaElement | null) => void;
  cambiarTexto: (id: string, texto: string) => void;
  teclas: (e: KeyboardEvent<HTMLTextAreaElement>, bloque: Bloque) => void;
  enfocar: (id: string) => void;
  alternarHecho: (id: string) => void;
  quitar: (id: string) => void;
};

// Mismo tamaño de letra y relleno para el texto visible y su "sombra" (la que hace crecer el bloque).
const ESTILO: Record<string, string> = {
  p: "text-[17px] leading-relaxed",
  h1: "text-[28px] font-bold leading-tight tracking-tight",
  h2: "text-[22px] font-bold leading-snug tracking-tight",
  h3: "text-[19px] font-semibold leading-snug",
  lista: "text-[17px] leading-relaxed",
  num: "text-[17px] leading-relaxed",
  todo: "text-[17px] leading-relaxed",
  cita: "text-[17px] leading-relaxed italic text-texto-2",
  codigo: "font-mono text-[14px] leading-relaxed",
  aviso: "text-[16px] leading-relaxed",
};

const PISTA: Record<string, string> = {
  p: "Escribe, o usa # para un título y - para una lista",
  h1: "Título 1",
  h2: "Título 2",
  h3: "Título 3",
  lista: "Elemento de la lista",
  num: "Elemento de la lista",
  todo: "Por hacer",
  cita: "Cita",
  codigo: "Código",
  aviso: "Algo importante",
};

/**
 * Un bloque del editor. El campo crece con el texto sin JavaScript: el textarea y una copia invisible
 * del texto comparten la misma celda de una grilla, y la copia define la altura. Nada salta al escribir.
 */
export const BloqueEditor = memo(function BloqueEditor(p: Props) {
  const { bloque } = p;

  if (bloque.tipo === "separador") {
    return (
      <button
        type="button"
        onClick={() => p.enfocar(bloque.id)}
        aria-label="Separador"
        className={`block w-full rounded-lg py-3 ${p.seleccionado ? "bg-indigo-relleno/10" : ""}`}
      >
        <hr className="border-separador" />
      </button>
    );
  }

  if (bloque.tipo === "imagen" || bloque.tipo === "archivo") {
    return (
      <figure
        className={`group relative overflow-hidden rounded-[16px] ${p.seleccionado ? "ring-2 ring-indigo-relleno" : ""}`}
        onClick={() => p.enfocar(bloque.id)}
      >
        {bloque.tipo === "imagen" ? (
          p.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- enlace firmado y temporal de un archivo privado
            <img
              src={p.url}
              alt={bloque.texto || "Imagen del apunte"}
              width={bloque.ancho}
              height={bloque.alto}
              loading="lazy"
              decoding="async"
              className="h-auto w-full bg-control"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center bg-control text-[15px] text-texto-2">Subiendo foto…</div>
          )
        ) : (
          <a
            href={p.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-superficie-2 px-4 py-3"
          >
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-[10px] bg-rojo-relleno text-[13px] font-bold text-white">
              PDF
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[16px] font-semibold">{bloque.texto || "Documento"}</span>
              <span className="text-[13px] text-texto-2">{p.url ? (p.tamano ? tamanoLegible(p.tamano) : "Abrir") : "Subiendo…"}</span>
            </span>
          </a>
        )}
        {p.seleccionado && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              p.quitar(bloque.id);
            }}
            aria-label="Quitar archivo"
            className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-black/60 text-white"
          >
            <Icono nombre="basura" className="size-5" />
          </button>
        )}
      </figure>
    );
  }

  const prefijo =
    bloque.tipo === "lista" ? (
      <span aria-hidden="true" className="w-5 shrink-0 pt-[0.15em] text-center text-[17px] text-texto-2">
        •
      </span>
    ) : bloque.tipo === "num" ? (
      <span aria-hidden="true" className="w-6 shrink-0 text-right text-[17px] leading-relaxed text-texto-2 tabular-nums">
        {p.numero}.
      </span>
    ) : bloque.tipo === "todo" ? (
      <button
        type="button"
        role="checkbox"
        aria-checked={Boolean(bloque.hecho)}
        aria-label="Marcar como hecho"
        onClick={() => p.alternarHecho(bloque.id)}
        className={`mt-[0.3em] grid size-[22px] shrink-0 place-items-center rounded-[7px] border-2 transition active:scale-90 ${
          bloque.hecho ? "border-verde-relleno bg-verde-relleno text-white" : "border-texto-2/60"
        }`}
      >
        {bloque.hecho && <Icono nombre="check" className="size-3.5" />}
      </button>
    ) : null;

  const marco =
    bloque.tipo === "cita"
      ? "border-l-[3px] border-separador pl-3"
      : bloque.tipo === "codigo"
        ? "rounded-[12px] bg-superficie-2 px-3 py-2"
        : bloque.tipo === "aviso"
          ? "rounded-[14px] bg-indigo-relleno/10 px-3 py-2"
          : "";

  const estilo = `${ESTILO[bloque.tipo]} ${bloque.tipo === "todo" && bloque.hecho ? "text-texto-2 line-through" : ""}`;

  return (
    <div className={`flex items-start gap-2 ${marco}`}>
      {prefijo}
      <div
        className={`grid min-w-0 flex-1 after:invisible after:whitespace-pre-wrap after:break-words after:content-[attr(data-valor)] after:[grid-area:1/1] ${estilo}`}
        data-valor={`${bloque.texto} `}
      >
        <textarea
          ref={(campo) => p.registrar(bloque.id, campo)}
          value={bloque.texto}
          rows={1}
          spellCheck={bloque.tipo !== "codigo"}
          aria-label={PISTA[bloque.tipo]}
          placeholder={p.seleccionado ? PISTA[bloque.tipo] : ""}
          onFocus={() => p.enfocar(bloque.id)}
          onChange={(e) => p.cambiarTexto(bloque.id, e.target.value)}
          onKeyDown={(e) => p.teclas(e, bloque)}
          className={`resize-none overflow-hidden bg-transparent break-words outline-none [grid-area:1/1] placeholder:text-texto-2/60 ${estilo}`}
        />
      </div>
    </div>
  );
});
