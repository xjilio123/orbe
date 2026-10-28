"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import type { EstadoFormulario } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { SelectorColor } from "@/components/SelectorColor";
import type { Lista } from "@/lib/tareas";

type Accion = (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

const CAMPO = "w-full rounded-[12px] bg-control px-3 py-2.5 text-[17px] outline-none focus:ring-2 focus:ring-indigo-relleno/40";

/** Desplegable "Nuevo …" que se cierra solo al guardar (React 19 vacía el formulario por su cuenta). */
function Desplegable({ id, titulo, estado, children }: { id: string; titulo: string; estado: EstadoFormulario; children: ReactNode }) {
  const caja = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (estado.ok && caja.current) caja.current.open = false;
  }, [estado]);
  return (
    <details id={id} ref={caja} className="group rounded-[22px] bg-superficie">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[17px] font-semibold text-azul [&::-webkit-details-marker]:hidden">
        <Icono nombre="mas" className="size-5 transition-transform group-open:rotate-45" />
        {titulo}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
    </details>
  );
}

function MensajeError({ texto }: { texto?: string }) {
  return texto ? <span className="text-[13px] text-rojo">{texto}</span> : null;
}

function Guardar({ guardando, texto }: { guardando: boolean; texto: string }) {
  return (
    <button
      type="submit"
      disabled={guardando}
      className="rounded-[16px] bg-indigo-relleno py-3 text-[17px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
    >
      {guardando ? "Guardando…" : texto}
    </button>
  );
}

function CampoIcono({ porDefecto }: { porDefecto: string }) {
  return (
    <label className="flex w-20 shrink-0 flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-texto-2">Emoji</span>
      <input name="icono" defaultValue={porDefecto} maxLength={8} aria-label="Emoji" className={`${CAMPO} text-center`} />
    </label>
  );
}

export function FormularioHabito({ accion }: { accion: Accion }) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  return (
    <Desplegable id="nuevo-habito" titulo="Nuevo hábito" estado={estado}>
      <form action={enviar} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <CampoIcono porDefecto="✅" />
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Hábito</span>
            <input name="nombre" maxLength={60} required placeholder="Leer, caminar, tomar agua…" className={CAMPO} />
          </label>
        </div>
        <MensajeError texto={estado.errores?.nombre ?? estado.errores?.icono} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">¿Cada cuánto?</span>
          <select name="dias_semana" defaultValue="7" className={CAMPO}>
            <option value="7">Todos los días</option>
            {[6, 5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1 día por semana" : `${n} días por semana`}
              </option>
            ))}
          </select>
        </label>
        <SelectorColor color="verde" />
        <MensajeError texto={estado.errores?.general} />
        <Guardar guardando={guardando} texto="Crear hábito" />
      </form>
    </Desplegable>
  );
}

export function FormularioMeta({ accion, listas }: { accion: Accion; listas: Lista[] }) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  const [tipo, setTipo] = useState<"numero" | "lista">("numero");
  return (
    <Desplegable id="nueva-meta" titulo="Nueva meta" estado={estado}>
      <form action={enviar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Meta</span>
          <input name="titulo" maxLength={120} required placeholder="Leer 12 libros, aprobar el B2…" className={CAMPO} />
          <MensajeError texto={estado.errores?.titulo} />
        </label>
        <fieldset className="grid grid-cols-2 gap-1 rounded-[12px] bg-control p-1">
          <legend className="sr-only">¿Cómo mides el avance?</legend>
          {(
            [
              ["numero", "Con un número"],
              ["lista", "Con una lista"],
            ] as const
          ).map(([valor, texto]) => (
            <label key={valor} className="relative">
              <input type="radio" name="tipo" value={valor} checked={tipo === valor} onChange={() => setTipo(valor)} className="peer sr-only" />
              <span className="block rounded-[9px] py-2 text-center text-[15px] font-semibold text-texto-2 peer-checked:bg-superficie peer-checked:text-texto peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-relleno">
                {texto}
              </span>
            </label>
          ))}
        </fieldset>
        {tipo === "numero" ? (
          <div className="flex gap-2">
            <label className="flex w-28 flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-texto-2">Objetivo</span>
              <input name="objetivo" inputMode="decimal" required placeholder="12" className={CAMPO} />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-texto-2">Unidad</span>
              <input name="unidad" maxLength={20} placeholder="libros, km, cursos…" className={CAMPO} />
            </label>
          </div>
        ) : listas.length > 0 ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Lista (el avance son sus tareas hechas)</span>
            <select name="lista_id" required defaultValue="" className={CAMPO}>
              <option value="" disabled>
                Elige una lista
              </option>
              {listas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-[15px] text-texto-2">Primero crea una lista en Tareas: el avance de la meta serán sus tareas hechas.</p>
        )}
        <MensajeError texto={estado.errores?.objetivo ?? estado.errores?.lista_id} />
        <SelectorColor color="verde" />
        <MensajeError texto={estado.errores?.general} />
        <Guardar guardando={guardando} texto="Crear meta" />
      </form>
    </Desplegable>
  );
}

export function FormularioFecha({ accion, hoy }: { accion: Accion; hoy: string }) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  return (
    <Desplegable id="nueva-fecha" titulo="Nueva fecha importante" estado={estado}>
      <form action={enviar} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <CampoIcono porDefecto="📅" />
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">¿Qué pasa ese día?</span>
            <input name="titulo" maxLength={80} required placeholder="Examen de SQL, viaje a Cusco…" className={CAMPO} />
          </label>
        </div>
        <MensajeError texto={estado.errores?.titulo ?? estado.errores?.icono} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Fecha</span>
          <input type="date" name="fecha" required min={hoy} className={CAMPO} />
          <MensajeError texto={estado.errores?.fecha} />
        </label>
        <SelectorColor color="naranja" />
        <MensajeError texto={estado.errores?.general} />
        <Guardar guardando={guardando} texto="Guardar fecha" />
      </form>
    </Desplegable>
  );
}
