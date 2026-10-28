"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { EstadoFormulario } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { SelectorColor } from "@/components/SelectorColor";
import { TIPOS_BIBLIOTECA, type TipoBiblioteca } from "@/lib/coleccion";

type Accion = (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

const CAMPO = "w-full rounded-[12px] bg-control px-3 py-2.5 text-[17px] outline-none focus:ring-2 focus:ring-indigo-relleno/40";

function Desplegable({ titulo, estado, children }: { titulo: string; estado: EstadoFormulario; children: ReactNode }) {
  const caja = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (estado.ok && caja.current) caja.current.open = false;
  }, [estado]);
  return (
    <details ref={caja} className="group rounded-[22px] bg-superficie">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[17px] font-semibold text-azul [&::-webkit-details-marker]:hidden">
        <Icono nombre="mas" className="size-5 transition-transform group-open:rotate-45" />
        {titulo}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
    </details>
  );
}

function Guardar({ guardando, texto }: { guardando: boolean; texto: string }) {
  return (
    <button type="submit" disabled={guardando} className="rounded-[16px] bg-indigo-relleno py-3 text-[17px] font-bold text-white active:scale-[0.98] disabled:opacity-60">
      {guardando ? "Guardando…" : texto}
    </button>
  );
}

function Errores({ estado, campos }: { estado: EstadoFormulario; campos: string[] }) {
  const texto = campos.map((c) => estado.errores?.[c]).find(Boolean);
  return texto ? <span className="text-[13px] text-rojo">{texto}</span> : null;
}

export function FormularioChecklist({ accion }: { accion: Accion }) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  return (
    <Desplegable titulo="Nueva checklist" estado={estado}>
      <form action={enviar} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <label className="flex w-20 shrink-0 flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Emoji</span>
            <input name="icono" defaultValue="🛒" maxLength={8} aria-label="Emoji" className={`${CAMPO} text-center`} />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Nombre</span>
            <input name="nombre" maxLength={60} required placeholder="Mercado, Maleta de viaje…" className={CAMPO} />
          </label>
        </div>
        <Errores estado={estado} campos={["nombre", "icono"]} />
        <SelectorColor color="verde" />
        <Errores estado={estado} campos={["general"]} />
        <Guardar guardando={guardando} texto="Crear checklist" />
      </form>
    </Desplegable>
  );
}

export function FormularioObra({ accion }: { accion: Accion }) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  return (
    <Desplegable titulo="Agregar a la biblioteca" estado={estado}>
      <form action={enviar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Título</span>
          <input name="titulo" maxLength={200} required placeholder="Storytelling with Data, Dark…" className={CAMPO} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Autor o plataforma (opcional)</span>
          <input name="autor" maxLength={120} placeholder="Cole Nussbaumer, Netflix, Platzi…" className={CAMPO} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Tipo</span>
            <select name="tipo" defaultValue="libro" className={CAMPO}>
              {(Object.keys(TIPOS_BIBLIOTECA) as TipoBiblioteca[]).map((t) => (
                <option key={t} value={t}>
                  {TIPOS_BIBLIOTECA[t].emoji} {TIPOS_BIBLIOTECA[t].nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Total (opcional)</span>
            <input name="total" inputMode="numeric" placeholder="Páginas, episodios…" className={CAMPO} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">¿En qué va?</span>
          <select name="estado" defaultValue="quiero" className={CAMPO}>
            <option value="quiero">Quiero verlo o leerlo</option>
            <option value="en_curso">Lo estoy viendo o leyendo</option>
            <option value="terminado">Ya lo terminé</option>
          </select>
        </label>
        <Errores estado={estado} campos={["titulo", "tipo", "total", "general"]} />
        <Guardar guardando={guardando} texto="Agregar" />
      </form>
    </Desplegable>
  );
}
