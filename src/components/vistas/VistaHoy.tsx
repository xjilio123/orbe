import { AvisoInstalar } from "@/components/pwa/AvisoInstalar";
import { Encabezado, IconoModulo, Pantalla, type ColorModulo } from "@/components/ui";
import type { NombreIcono } from "@/components/Icono";

const modulos: { nombre: string; texto: string; icono: NombreIcono; color: ColorModulo; fase: number }[] = [
  { nombre: "Inbox", texto: "Captura en 2 segundos, ordena después.", icono: "inbox", color: "celeste", fase: 1 },
  { nombre: "Tareas", texto: "Listas, subtareas, prioridad y fechas.", icono: "tareas", color: "azul", fase: 1 },
  { nombre: "Apuntes", texto: "Editor por bloques, como Notion.", icono: "apuntes", color: "naranja", fase: 1 },
  { nombre: "Agenda", texto: "Día, semana y mes en un vistazo.", icono: "agenda", color: "morado", fase: 2 },
  { nombre: "Recordatorios", texto: "Avisos a la hora exacta.", icono: "campana", color: "rojo", fase: 2 },
];

/** Pantalla Hoy sin acceso a datos: la página y la vitrina le pasan lo que debe mostrar. */
export function VistaHoy({ fecha, saludo, nombre }: { fecha: string; saludo: string; nombre?: string }) {
  return (
    <Pantalla>
      <Encabezado titulo="Hoy" sobre={fecha} />
      <p className="text-[22px] font-semibold tracking-tight">
        {saludo}
        {nombre ? `, ${nombre}` : ""}.
      </p>

      <section className="flex flex-col gap-3" aria-labelledby="titulo-camino">
        <div className="flex items-baseline justify-between">
          <h2 id="titulo-camino" className="text-[20px] font-bold tracking-tight">
            En camino
          </h2>
          <p className="text-[15px] text-texto-2">Fase 0 de 5</p>
        </div>
        <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
          {modulos.map((m) => (
            <li key={m.nombre} className="flex items-center gap-3 px-4 py-3">
              <IconoModulo nombre={m.icono} color={m.color} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[17px] font-semibold">{m.nombre}</p>
                <p className="truncate text-[15px] text-texto-2">{m.texto}</p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-texto-2">Fase {m.fase}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Al final y flotante: aparece después de cargar sin mover nada de la pantalla. */}
      <AvisoInstalar />
    </Pantalla>
  );
}
