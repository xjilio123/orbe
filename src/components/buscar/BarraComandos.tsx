"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { Buscar, ResultadoBusqueda } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { enlace } from "@/components/ui";
import { filtrarComandos } from "@/lib/comandos";

type Props = { buscar: Buscar; significado?: Buscar; base: string; onCerrar: () => void };

type Opcion = { clave: string; href: string; titulo: string; detalle: string; icono: React.ReactNode; grupo: "ir" | "resultado" | "significado" };

/**
 * Barra ⌘K: busca en tus tareas y páginas y lleva a cualquier pantalla.
 * Flota sobre la app (no mueve nada) y se maneja con el teclado: ↑ ↓ para elegir, Enter para abrir, Esc para cerrar.
 */
export default function BarraComandos({ buscar, significado, base, onCerrar }: Props) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<{ consulta: string; items: ResultadoBusqueda[] }>({ consulta: "", items: [] });
  const [activo, setActivo] = useState(0);
  const [parecidos, setParecidos] = useState<{ consulta: string; items: ResultadoBusqueda[] }>({ consulta: "", items: [] });
  const idLista = useId();
  const ultima = useRef(0);

  // Busca 150 ms después de la última tecla; si llega una respuesta vieja, se ignora.
  const consulta = texto.trim();
  useEffect(() => {
    if (consulta.length < 2) return;
    const pedido = ++ultima.current;
    const espera = setTimeout(async () => {
      try {
        const items = await buscar(consulta);
        if (pedido === ultima.current) setResultados({ consulta, items });
      } catch {
        if (pedido === ultima.current) setResultados({ consulta, items: [] });
      }
    }, 150);
    return () => clearTimeout(espera);
  }, [consulta, buscar]);

  // Búsqueda por significado (gratis, sin Gemini): espera a que dejes de escribir un poco más.
  useEffect(() => {
    if (!significado || consulta.length < 4) return;
    let vigente = true;
    const espera = setTimeout(async () => {
      try {
        const items = await significado(consulta);
        if (vigente) setParecidos({ consulta, items });
      } catch {
        if (vigente) setParecidos({ consulta, items: [] });
      }
    }, 500);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [consulta, significado]);

  // Mientras está abierta, la página de atrás no se desplaza.
  useEffect(() => {
    const antes = document.body.style.overflow;
    const foco = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
      foco?.focus?.();
    };
  }, []);

  const items = consulta.length >= 2 && resultados.consulta === consulta ? resultados.items : [];
  const buscando = consulta.length >= 2 && resultados.consulta !== consulta;
  const opciones: Opcion[] = [
    ...filtrarComandos(texto).map((c) => ({
      clave: `ir-${c.id}`,
      href: enlace(base, c.ruta),
      titulo: c.nombre,
      detalle: "",
      icono: <Icono nombre={c.icono} className="size-5" />,
      grupo: "ir" as const,
    })),
    ...items.map((r) => ({
      clave: `${r.tipo}-${r.id}`,
      href: enlace(base, r.tipo === "tarea" ? `/tareas/${r.id}` : `/apuntes/${r.id}`),
      titulo: r.titulo || "Sin título",
      detalle: r.detalle,
      icono: r.tipo === "pagina" ? <span className="text-[18px]">{r.icono || "📄"}</span> : <Icono nombre="tareas" className="size-5" />,
      grupo: "resultado" as const,
    })),
  ];
  const yaEstan = new Set(items.map((r) => r.id));
  if (parecidos.consulta === consulta) {
    for (const r of parecidos.items) {
      if (yaEstan.has(r.id)) continue;
      opciones.push({
        clave: `significado-${r.id}`,
        href: enlace(base, `/apuntes/${r.id}`),
        titulo: r.titulo || "Sin título",
        detalle: r.detalle,
        icono: <span className="text-[18px]">{r.icono || "📄"}</span>,
        grupo: "significado",
      });
    }
  }
  if (consulta.length >= 5) {
    opciones.push({
      clave: "preguntar",
      href: enlace(base, `/preguntar?q=${encodeURIComponent(consulta)}`),
      titulo: `Preguntar a tus notas: “${consulta}”`,
      detalle: "La IA responde con lo que escribiste",
      icono: <Icono nombre="chispa" className="size-5 text-morado" />,
      grupo: "significado",
    });
  }
  const elegido = Math.min(activo, Math.max(0, opciones.length - 1));

  function ir(href: string) {
    onCerrar();
    router.push(href);
  }

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCerrar();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setActivo((elegido + paso + opciones.length) % Math.max(1, opciones.length));
    } else if (e.key === "Enter" && opciones[elegido]) {
      e.preventDefault();
      ir(opciones[elegido].href);
    }
  }

  const grupos = [
    { id: "ir", titulo: "Ir a", items: opciones.filter((o) => o.grupo === "ir") },
    { id: "resultado", titulo: "En tus notas y tareas", items: opciones.filter((o) => o.grupo === "resultado") },
    { id: "significado", titulo: "Por significado", items: opciones.filter((o) => o.grupo === "significado") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/35 px-3 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-sm" onMouseDown={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en Orbe"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-fit max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-[22px] bg-superficie shadow-[0_16px_48px_rgb(0_0_0/0.25)] motion-safe:animate-[entrar-desde-arriba_0.18s_ease-out]"
      >
        <div className="flex items-center gap-2 border-b border-separador/60 px-4 py-2.5">
          <Icono nombre="buscar" className="size-5 shrink-0 text-texto-2" />
          <input
            autoFocus
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setActivo(0);
            }}
            onKeyDown={teclas}
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-activedescendant={opciones[elegido] ? `${idLista}-${opciones[elegido].clave}` : undefined}
            aria-label="Buscar tareas, páginas o pantallas"
            placeholder="Buscar en Orbe…"
            maxLength={100}
            autoComplete="off"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent py-2 text-[17px] outline-none placeholder:text-texto-2"
          />
          <button type="button" onClick={onCerrar} className="shrink-0 px-1 text-[17px] text-indigo">
            Cancelar
          </button>
        </div>

        <div id={idLista} role="listbox" aria-label="Resultados" className="overflow-y-auto overscroll-contain py-2">
          {grupos.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.id} role="group" aria-label={g.titulo}>
                  <p className="px-4 pt-2 pb-1 text-[13px] font-semibold text-texto-2">{g.titulo}</p>
                  {g.items.map((o) => {
                    const i = opciones.indexOf(o);
                    return (
                      <div
                        key={o.clave}
                        id={`${idLista}-${o.clave}`}
                        role="option"
                        aria-selected={i === elegido}
                        onMouseEnter={() => setActivo(i)}
                        onClick={() => ir(o.href)}
                        className={`mx-2 flex cursor-pointer items-center gap-3 rounded-[12px] px-2 py-2 ${i === elegido ? "bg-indigo-relleno/12" : ""}`}
                      >
                        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-control text-texto-2">
                          {o.icono}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[16px]">{o.titulo}</span>
                          {o.detalle && <span className="truncate text-[13px] text-texto-2">{o.detalle}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ),
          )}
          <p className="px-4 py-2 text-[13px] text-texto-2" aria-live="polite">
            {consulta.length < 2
              ? "Escribe al menos 2 letras para buscar en tus notas y tareas."
              : buscando
                ? "Buscando…"
                : items.length === 0
                  ? `Nada encontrado con “${consulta}”.`
                  : `${items.length} ${items.length === 1 ? "resultado" : "resultados"}`}
          </p>
        </div>
      </div>
    </div>
  );
}
