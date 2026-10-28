"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { AccionesNotas } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { enlace } from "@/components/ui";

const MAX_ARCHIVOS = 500;
const MAX_POR_ARCHIVO = 1_000_000;
// Cada envío queda bajo el límite de Vercel (4.5 MB) con margen.
const MAX_TANDA_BYTES = 2_500_000;
const MAX_TANDA_ARCHIVOS = 40;

type Estado = { tipo: "listo" | "trabajando" | "error"; texto: string; carpeta?: string };

/** Trae notas .md (por ejemplo, de tu bóveda de Obsidian) como páginas nuevas dentro de una carpeta "Importado". */
export function ImportarMarkdown({ importar, base }: { importar: AccionesNotas["importar"]; base: string }) {
  const campo = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado | null>(null);

  async function procesar(lista: FileList) {
    const archivos = [...lista].filter((f) => /\.(md|markdown|txt)$/i.test(f.name)).slice(0, MAX_ARCHIVOS);
    const grandes = archivos.filter((f) => f.size > MAX_POR_ARCHIVO).length;
    const validos = archivos.filter((f) => f.size <= MAX_POR_ARCHIVO);
    if (validos.length === 0) {
      setEstado({ tipo: "error", texto: "Elige archivos .md de hasta 1 MB." });
      return;
    }
    let carpeta: string | null = null;
    let hechas = 0;
    let tanda: { nombre: string; texto: string }[] = [];
    let bytes = 0;

    const enviar = async () => {
      if (tanda.length === 0) return true;
      setEstado({ tipo: "trabajando", texto: `Importando ${hechas + tanda.length} de ${validos.length}…` });
      const r = await importar(tanda, carpeta);
      if (r.carpetaId) carpeta = r.carpetaId;
      if (!r.ok) {
        setEstado({ tipo: "error", texto: `${r.error} Se importaron ${hechas} de ${validos.length}.`, carpeta: carpeta ?? undefined });
        return false;
      }
      hechas += r.creadas;
      tanda = [];
      bytes = 0;
      return true;
    };

    try {
      for (const f of validos) {
        const texto = await f.text();
        const peso = new Blob([texto]).size;
        if (tanda.length >= MAX_TANDA_ARCHIVOS || bytes + peso > MAX_TANDA_BYTES) {
          if (!(await enviar())) return;
        }
        tanda.push({ nombre: (f.webkitRelativePath || f.name).slice(-300), texto });
        bytes += peso;
      }
      if (!(await enviar())) return;
      const extra = grandes > 0 ? ` (${grandes} de más de 1 MB no entraron)` : "";
      setEstado({ tipo: "listo", texto: `Listo: ${hechas} ${hechas === 1 ? "nota importada" : "notas importadas"}${extra}.`, carpeta: carpeta ?? undefined });
    } catch {
      setEstado({ tipo: "error", texto: `Sin conexión: se importaron ${hechas} de ${validos.length}.`, carpeta: carpeta ?? undefined });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={estado?.tipo === "trabajando"}
        onClick={() => campo.current?.click()}
        className="flex items-center gap-3 rounded-[18px] bg-superficie px-4 py-3 text-left active:scale-[0.99] disabled:opacity-60"
      >
        <Icono nombre="inbox" className="size-5 text-naranja" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[17px] font-semibold">Importar notas .md</span>
          <span className="text-[13px] text-texto-2">De Obsidian u otra app. Los [[enlaces]] se mantienen.</span>
        </span>
      </button>
      <input
        ref={campo}
        type="file"
        multiple
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        hidden
        onChange={(e) => {
          const archivos = e.target.files;
          if (archivos?.length) void procesar(archivos);
          e.target.value = "";
        }}
      />
      <p
        className={`min-h-5 px-1 text-[13px] ${estado?.tipo === "error" ? "text-rojo" : estado?.tipo === "listo" ? "font-semibold text-verde" : "text-texto-2"}`}
        aria-live="polite"
      >
        {estado?.texto}
        {estado?.carpeta && estado.tipo !== "trabajando" && (
          <Link href={enlace(base, `/apuntes/${estado.carpeta}`)} className="ml-1.5 font-semibold text-naranja">
            Ver
          </Link>
        )}
      </p>
    </div>
  );
}
