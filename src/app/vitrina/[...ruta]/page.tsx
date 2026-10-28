import { notFound } from "next/navigation";
import Agenda from "@/app/(app)/agenda/page";
import Apuntes from "@/app/(app)/apuntes/page";
import { VistaAjustes } from "@/components/vistas/VistaAjustes";
import { VistaHoy } from "@/components/vistas/VistaHoy";
import { VistaLista } from "@/components/vistas/VistaLista";
import { VistaTarea } from "@/components/vistas/VistaTarea";
import { VistaTareas } from "@/components/vistas/VistaTareas";
import { agruparPorFecha, compararTareas, esInbox, resumenDelDia } from "@/lib/tareas";
import { vitrinaActiva } from "@/lib/vitrina";
import { DETALLE, HOY, LISTAS, SUBTAREAS, TAREAS, accionesVitrina } from "../datos";

// Pantallas reales con datos FICTICIOS. Solo existe con ORBE_VITRINA=1 fuera de Vercel (ver lib/vitrina.ts).
// Rutas: /vitrina/hoy, /vitrina/tareas, /vitrina/tareas/<id>, /vitrina/tareas/lista/<id>[?vista=tablero], …
export default async function Pantalla({ params, searchParams }: PageProps<"/vitrina/[...ruta]">) {
  if (!vitrinaActiva()) notFound();
  const [{ ruta }, { vista }] = await Promise.all([params, searchParams]);
  const camino = ruta.join("/");
  const base = "/vitrina";
  const subtareas = { [DETALLE.id]: { hechas: 1, total: 3 } };

  if (camino === "hoy") {
    return (
      <VistaHoy
        fecha="martes 27 oct"
        saludo="Buenas tardes"
        nombre="Ana"
        hoy={HOY}
        base={base}
        resumen={resumenDelDia(TAREAS, HOY, (t) => t.hecha_en?.startsWith(HOY) ?? false)}
        inbox={TAREAS.filter(esInbox).length}
        listas={LISTAS}
        acciones={accionesVitrina}
      />
    );
  }
  if (camino === "tareas") {
    return (
      <VistaTareas
        hoy={HOY}
        base={base}
        inbox={TAREAS.filter(esInbox).sort(compararTareas)}
        grupos={agruparPorFecha(TAREAS, HOY)}
        listas={LISTAS.map((l) => ({ ...l, pendientes: TAREAS.filter((t) => t.lista_id === l.id && t.estado !== "hecha").length }))}
        subtareas={subtareas}
        acciones={accionesVitrina}
      />
    );
  }
  if (camino.startsWith("tareas/lista/")) {
    const lista = LISTAS.find((l) => l.id === ruta[2]) ?? LISTAS[1];
    return (
      <VistaLista
        lista={lista}
        tareas={TAREAS.filter((t) => t.lista_id === lista.id)}
        vista={vista === "tablero" ? "tablero" : "lista"}
        hoy={HOY}
        base={base}
        subtareas={subtareas}
        acciones={accionesVitrina}
      />
    );
  }
  if (ruta[0] === "tareas" && ruta.length === 2) {
    const tarea = [...TAREAS, ...SUBTAREAS].find((t) => t.id === ruta[1]) ?? DETALLE;
    return (
      <VistaTarea
        tarea={tarea}
        subtareas={tarea.id === DETALLE.id ? SUBTAREAS : []}
        listas={LISTAS}
        hoy={HOY}
        base={base}
        acciones={accionesVitrina}
      />
    );
  }
  if (camino === "apuntes") return <Apuntes />;
  if (camino === "agenda") return <Agenda />;
  if (camino === "ajustes") return <VistaAjustes nombre="Ana Prueba" email="ana@ejemplo.com" tema="auto" />;
  notFound();
}
