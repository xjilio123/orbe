"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import type { AccionesApuntes } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { MAX_ARCHIVO } from "@/lib/archivos";
import {
  MAX_BLOQUES,
  NOMBRE_TIPO,
  atajo,
  esDeTexto,
  nuevoBloque,
  numeracion,
  tipoSiguiente,
  type Bloque,
  type TipoBloque,
} from "@/lib/bloques";
import { BloqueEditor } from "./BloqueEditor";

type Props = {
  paginaId: string;
  titulo: string;
  icono: string;
  contenido: Bloque[];
  urls: Record<string, string>;
  tamanos: Record<string, number>;
  acciones: Pick<AccionesApuntes, "guardar" | "subir" | "eliminarAdjunto">;
};

type Estado = "guardado" | "pendiente" | "guardando" | "error";

const TIPOS_BARRA: { tipo: TipoBloque; corto: string }[] = [
  { tipo: "p", corto: "Aa" },
  { tipo: "h1", corto: "T1" },
  { tipo: "h2", corto: "T2" },
  { tipo: "h3", corto: "T3" },
  { tipo: "lista", corto: "•" },
  { tipo: "num", corto: "1." },
  { tipo: "todo", corto: "☐" },
  { tipo: "cita", corto: "❝" },
  { tipo: "codigo", corto: "</>" },
  { tipo: "aviso", corto: "!" },
];

const ESPERA_GUARDADO = 800;

export function Editor({ paginaId, titulo: tituloInicial, icono: iconoInicial, contenido, urls: urlsIniciales, tamanos, acciones }: Props) {
  const [titulo, setTitulo] = useState(tituloInicial);
  const [icono, setIcono] = useState(iconoInicial);
  const [bloques, setBloques] = useState<Bloque[]>(() => (contenido.length ? contenido : [nuevoBloque()]));
  const [urls, setUrls] = useState(urlsIniciales);
  const [actual, setActual] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("guardado");
  const [aviso, setAviso] = useState<string | null>(null);
  const [foco, setFoco] = useState<{ id: string; pos: number } | null>(null);
  const [, iniciar] = useTransition();

  const campos = useRef(new Map<string, HTMLTextAreaElement>());
  // Copia estable de los bloques: los manejadores la leen sin cambiar en cada tecla, así cada bloque
  // (memo) solo se vuelve a dibujar cuando cambia él mismo y no toda la página.
  const bloquesRef = useRef(bloques);
  const ultimo = useRef({ titulo, icono, bloques });
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subidaFoto = useRef<HTMLInputElement>(null);
  const subidaPdf = useRef<HTMLInputElement>(null);

  // ---------- Guardado automático ----------
  const guardarAhora = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = null;
    const { titulo: t, icono: i, bloques: b } = ultimo.current;
    // Las fotos que todavía se están subiendo no se guardan hasta tener su archivo.
    const contenidoListo = b.filter((x) => !((x.tipo === "imagen" || x.tipo === "archivo") && !x.adjunto));
    setEstado("guardando");
    iniciar(async () => {
      const r = await acciones.guardar(paginaId, { titulo: t, icono: i, contenido: contenidoListo });
      setEstado(r.ok ? "guardado" : "error");
      setAviso(r.ok ? null : (r.error ?? "No se pudo guardar."));
    });
  }, [acciones, paginaId]);

  const programarGuardado = useCallback(
    (datos: Partial<typeof ultimo.current>) => {
      ultimo.current = { ...ultimo.current, ...datos };
      setEstado("pendiente");
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(guardarAhora, ESPERA_GUARDADO);
    },
    [guardarAhora],
  );

  // Si sales de la app o cambias de pantalla con cambios sin guardar, se guardan en ese momento.
  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === "hidden" && temporizador.current) guardarAhora();
    };
    document.addEventListener("visibilitychange", alOcultar);
    return () => {
      document.removeEventListener("visibilitychange", alOcultar);
      if (temporizador.current) guardarAhora();
    };
  }, [guardarAhora]);

  // Se llama solo desde eventos (teclas, toques, subidas): calcula la lista nueva una vez y la guarda.
  const actualizar = useCallback(
    (cambio: (lista: Bloque[]) => Bloque[]) => {
      const nueva = cambio(bloquesRef.current);
      bloquesRef.current = nueva;
      setBloques(nueva);
      programarGuardado({ bloques: nueva });
    },
    [programarGuardado],
  );

  // ---------- Foco ----------
  useEffect(() => {
    if (!foco) return;
    const campo = campos.current.get(foco.id);
    if (campo) {
      campo.focus();
      const pos = Math.min(foco.pos, campo.value.length);
      campo.setSelectionRange(pos, pos);
    }
  }, [foco]);

  const registrar = useCallback((id: string, campo: HTMLTextAreaElement | null) => {
    if (campo) campos.current.set(id, campo);
    else campos.current.delete(id);
  }, []);

  const enfocar = useCallback((id: string) => setActual(id), []);

  // ---------- Edición ----------
  const cambiarTexto = useCallback(
    (id: string, texto: string) => {
      const bloque = bloquesRef.current.find((b) => b.id === id);
      if (!bloque) return;
      const nuevoTipo = atajo(texto, bloque.tipo);
      if (nuevoTipo === "separador") {
        const siguiente = nuevoBloque();
        actualizar((lista) => lista.flatMap((b) => (b.id === id ? [{ id: b.id, tipo: "separador" as const, texto: "" }, siguiente] : [b])));
        setFoco({ id: siguiente.id, pos: 0 });
      } else if (nuevoTipo) {
        actualizar((lista) => lista.map((b) => (b.id === id ? { id: b.id, tipo: nuevoTipo, texto: "", ...(nuevoTipo === "todo" ? { hecho: false } : {}) } : b)));
      } else {
        actualizar((lista) => lista.map((b) => (b.id === id ? { ...b, texto } : b)));
      }
    },
    [actualizar],
  );

  const teclas = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>, bloque: Bloque) => {
      const campo = e.currentTarget;
      const inicio = campo.selectionStart;
      const fin = campo.selectionEnd;

      const bloques = bloquesRef.current;
      if (e.key === "Enter" && !e.shiftKey && bloque.tipo !== "codigo") {
        e.preventDefault();
        if (bloques.length >= MAX_BLOQUES) return;
        // Enter en un ítem vacío de una lista sale de la lista.
        if (bloque.texto === "" && bloque.tipo !== "p") {
          actualizar((lista) => lista.map((b) => (b.id === bloque.id ? { id: b.id, tipo: "p", texto: "" } : b)));
          return;
        }
        const nuevo = nuevoBloque(tipoSiguiente(bloque.tipo), bloque.texto.slice(fin));
        actualizar((lista) => {
          const i = lista.findIndex((b) => b.id === bloque.id);
          const antes = { ...lista[i], texto: bloque.texto.slice(0, inicio) };
          return [...lista.slice(0, i), antes, nuevo, ...lista.slice(i + 1)];
        });
        setFoco({ id: nuevo.id, pos: 0 });
        return;
      }

      if (e.key === "Backspace" && inicio === 0 && fin === 0) {
        const i = bloques.findIndex((b) => b.id === bloque.id);
        if (bloque.tipo !== "p") {
          e.preventDefault();
          actualizar((lista) => lista.map((b) => (b.id === bloque.id ? { id: b.id, tipo: "p", texto: b.texto } : b)));
          return;
        }
        const anterior = bloques[i - 1];
        if (!anterior) return;
        e.preventDefault();
        if (esDeTexto(anterior.tipo)) {
          // Une este bloque al anterior y deja el cursor en la unión.
          actualizar((lista) => lista.filter((b) => b.id !== bloque.id).map((b) => (b.id === anterior.id ? { ...b, texto: b.texto + bloque.texto } : b)));
          setFoco({ id: anterior.id, pos: anterior.texto.length });
        } else if (bloque.texto === "") {
          actualizar((lista) => lista.filter((b) => b.id !== bloque.id));
          setActual(anterior.id);
        }
        return;
      }

      if (e.key === "ArrowUp" && inicio === 0) {
        const anterior = bloques.slice(0, bloques.findIndex((b) => b.id === bloque.id)).findLast((b) => esDeTexto(b.tipo));
        if (anterior) {
          e.preventDefault();
          setFoco({ id: anterior.id, pos: anterior.texto.length });
        }
      }
      if (e.key === "ArrowDown" && fin === bloque.texto.length) {
        const siguiente = bloques.slice(bloques.findIndex((b) => b.id === bloque.id) + 1).find((b) => esDeTexto(b.tipo));
        if (siguiente) {
          e.preventDefault();
          setFoco({ id: siguiente.id, pos: 0 });
        }
      }
    },
    [actualizar],
  );

  const alternarHecho = useCallback((id: string) => actualizar((lista) => lista.map((b) => (b.id === id ? { ...b, hecho: !b.hecho } : b))), [actualizar]);

  const quitar = useCallback(
    (id: string) => {
      const bloque = bloquesRef.current.find((b) => b.id === id);
      if (bloque?.adjunto) {
        const adjunto = bloque.adjunto;
        iniciar(() => acciones.eliminarAdjunto(adjunto));
      }
      actualizar((lista) => {
        const resto = lista.filter((b) => b.id !== id);
        return resto.length ? resto : [nuevoBloque()];
      });
      setActual(null);
    },
    [acciones, actualizar],
  );

  function cambiarTipo(tipo: TipoBloque) {
    const id = actual;
    if (!id) return;
    const bloque = bloques.find((b) => b.id === id);
    if (!bloque || !esDeTexto(bloque.tipo)) return;
    actualizar((lista) => lista.map((b) => (b.id === id ? { id: b.id, tipo, texto: b.texto, ...(tipo === "todo" ? { hecho: false } : {}) } : b)));
    setFoco({ id, pos: campos.current.get(id)?.selectionStart ?? bloque.texto.length });
  }

  /** Inserta bloques debajo del bloque actual (o al final). */
  function insertar(nuevos: Bloque[]) {
    actualizar((lista) => {
      const i = actual ? lista.findIndex((b) => b.id === actual) : lista.length - 1;
      const pos = i < 0 ? lista.length : i + 1;
      return [...lista.slice(0, pos), ...nuevos, ...lista.slice(pos)];
    });
  }

  function insertarSeparador() {
    const texto = nuevoBloque();
    insertar([{ ...nuevoBloque("separador") }, texto]);
    setFoco({ id: texto.id, pos: 0 });
  }

  // ---------- Fotos y PDF ----------
  async function subir(archivo: File, tipo: "imagen" | "archivo") {
    setAviso(null);
    const temporal: Bloque = { ...nuevoBloque(tipo, tipo === "archivo" ? archivo.name.slice(0, 120) : "") };
    let blob: Blob = archivo;
    if (tipo === "imagen") {
      try {
        const { comprimirFoto } = await import("@/lib/imagen");
        const r = await comprimirFoto(archivo);
        blob = r.blob;
        Object.assign(temporal, { ancho: r.ancho, alto: r.alto });
      } catch {
        setAviso("No se pudo leer esa foto.");
        return;
      }
    }
    if (blob.size > MAX_ARCHIVO) {
      setAviso("El archivo pesa más de 4 MB.");
      return;
    }
    insertar([temporal]);
    const datos = new FormData();
    datos.append("archivo", blob, archivo.name);
    const r = await acciones.subir(paginaId, datos);
    if (!r.ok) {
      setAviso(r.error);
      actualizar((lista) => lista.filter((b) => b.id !== temporal.id));
      return;
    }
    setUrls((u) => ({ ...u, [r.adjunto.id]: r.adjunto.url }));
    actualizar((lista) => lista.map((b) => (b.id === temporal.id ? { ...b, adjunto: r.adjunto.id } : b)));
  }

  const numeros = numeracion(bloques);
  const bloqueActual = bloques.find((b) => b.id === actual);
  const textoEstado = { guardado: "Guardado", pendiente: "Sin guardar", guardando: "Guardando…", error: "No se guardó" }[estado];

  return (
    <div className="flex flex-col gap-4">
      {/* Barra fija arriba: en el iPhone el teclado tapa la parte de abajo. Altura constante: no empuja nada. */}
      <div className="sticky top-[max(env(safe-area-inset-top),8px)] z-10 -mx-1 flex items-center gap-1 overflow-x-auto rounded-[16px] border border-black/5 bg-vidrio p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10">
        {TIPOS_BARRA.map((t) => (
          <button
            key={t.tipo}
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => cambiarTipo(t.tipo)}
            disabled={!bloqueActual || !esDeTexto(bloqueActual.tipo)}
            aria-label={NOMBRE_TIPO[t.tipo]}
            aria-pressed={bloqueActual?.tipo === t.tipo}
            className="grid h-9 min-w-9 shrink-0 place-items-center rounded-[10px] px-2 text-[15px] font-semibold aria-pressed:bg-indigo-relleno aria-pressed:text-white disabled:opacity-35"
          >
            {t.corto}
          </button>
        ))}
        <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-separador" />
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={insertarSeparador} aria-label="Separador" className="grid h-9 min-w-9 shrink-0 place-items-center rounded-[10px] px-2 text-[15px] font-semibold">
          —
        </button>
        <button type="button" onClick={() => subidaFoto.current?.click()} aria-label="Agregar foto" className="grid h-9 min-w-9 shrink-0 place-items-center rounded-[10px] px-2 text-[13px] font-semibold">
          Foto
        </button>
        <button type="button" onClick={() => subidaPdf.current?.click()} aria-label="Agregar PDF" className="grid h-9 min-w-9 shrink-0 place-items-center rounded-[10px] px-2 text-[13px] font-semibold">
          PDF
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => actual && quitar(actual)}
          disabled={!actual}
          aria-label="Eliminar bloque"
          className="grid h-9 min-w-9 shrink-0 place-items-center rounded-[10px] px-2 text-rojo disabled:opacity-35"
        >
          <Icono nombre="basura" className="size-5" />
        </button>
        <input
          ref={subidaFoto}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void subir(f, "imagen");
          }}
        />
        <input
          ref={subidaPdf}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void subir(f, "archivo");
          }}
        />
      </div>

      <div className="flex items-start gap-3">
        <label className="sr-only" htmlFor="icono-pagina">
          Ícono
        </label>
        <input
          id="icono-pagina"
          value={icono}
          onChange={(e) => {
            const valor = [...e.target.value].slice(-2).join("").slice(0, 16);
            setIcono(valor);
            programarGuardado({ icono: valor });
          }}
          placeholder="📄"
          className="size-12 shrink-0 rounded-[14px] bg-control text-center text-[26px] outline-none placeholder:opacity-50"
        />
        <div className="grid min-w-0 flex-1 text-[30px] leading-tight font-bold tracking-tight after:invisible after:whitespace-pre-wrap after:break-words after:content-[attr(data-valor)] after:[grid-area:1/1]" data-valor={`${titulo} `}>
          <textarea
            aria-label="Título de la página"
            value={titulo}
            rows={1}
            maxLength={200}
            placeholder="Sin título"
            onChange={(e) => {
              const valor = e.target.value.replace(/\n/g, " ");
              setTitulo(valor);
              programarGuardado({ titulo: valor });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const primero = bloques.find((b) => esDeTexto(b.tipo));
                if (primero) setFoco({ id: primero.id, pos: 0 });
              }
            }}
            className="resize-none overflow-hidden bg-transparent text-[30px] leading-tight font-bold tracking-tight break-words outline-none [grid-area:1/1] placeholder:text-texto-2/50"
          />
        </div>
      </div>

      <p className={`-mt-2 h-5 text-[13px] ${estado === "error" ? "text-rojo" : "text-texto-2"}`} aria-live="polite">
        {aviso ?? textoEstado}
        {estado === "error" && (
          <button type="button" onClick={guardarAhora} className="ml-2 font-semibold text-indigo">
            Reintentar
          </button>
        )}
      </p>

      <div className="flex flex-col gap-1.5">
        {bloques.map((b) => (
          <BloqueEditor
            key={b.id}
            bloque={b}
            numero={numeros.get(b.id)}
            url={b.adjunto ? urls[b.adjunto] : undefined}
            tamano={b.adjunto ? tamanos[b.adjunto] : undefined}
            seleccionado={actual === b.id}
            registrar={registrar}
            cambiarTexto={cambiarTexto}
            teclas={teclas}
            enfocar={enfocar}
            alternarHecho={alternarHecho}
            quitar={quitar}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const nuevo = nuevoBloque();
          actualizar((lista) => [...lista, nuevo]);
          setFoco({ id: nuevo.id, pos: 0 });
        }}
        className="h-16 w-full rounded-[16px] text-left text-[15px] text-texto-2/70"
        aria-label="Agregar un bloque al final"
      >
        Toca aquí para seguir escribiendo
      </button>
    </div>
  );
}
