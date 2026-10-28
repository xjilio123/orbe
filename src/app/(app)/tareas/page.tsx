import { accionesTareas } from "@/app/acciones/conjunto";
import { VistaTareas } from "@/components/vistas/VistaTareas";
import { conteoSubtareas, listas, tareasActivas } from "@/lib/datos/tareas";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { agruparPorFecha, compararTareas, esInbox } from "@/lib/tareas";

export const metadata = { title: "Tareas · Orbe" };

export default async function Tareas() {
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const [tareas, misListas] = await Promise.all([tareasActivas(supabase, hoy), listas(supabase)]);
  const principales = tareas.filter((t) => !t.padre_id && t.estado !== "hecha");
  const conteo = await conteoSubtareas(supabase, principales.map((t) => t.id));

  const pendientesPorLista = new Map<string, number>();
  for (const t of principales) if (t.lista_id) pendientesPorLista.set(t.lista_id, (pendientesPorLista.get(t.lista_id) ?? 0) + 1);

  return (
    <VistaTareas
      hoy={hoy}
      base=""
      inbox={tareas.filter(esInbox).sort(compararTareas)}
      grupos={agruparPorFecha(tareas, hoy)}
      listas={misListas.map((l) => ({ ...l, pendientes: pendientesPorLista.get(l.id) ?? 0 }))}
      subtareas={Object.fromEntries(conteo)}
      acciones={accionesTareas}
    />
  );
}
