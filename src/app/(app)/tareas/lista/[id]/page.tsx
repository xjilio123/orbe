import { notFound } from "next/navigation";
import { accionesTareas } from "@/app/acciones/conjunto";
import { VistaLista } from "@/components/vistas/VistaLista";
import { conteoSubtareas, listas, tareasDeLista } from "@/lib/datos/tareas";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Lista · Orbe" };

export default async function PaginaLista({ params, searchParams }: PageProps<"/tareas/lista/[id]">) {
  const [{ id }, { vista }] = await Promise.all([params, searchParams]);
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const [misListas, tareas] = await Promise.all([listas(supabase), tareasDeLista(supabase, id, hoy)]);
  const lista = misListas.find((l) => l.id === id);
  if (!lista) notFound();
  const conteo = await conteoSubtareas(supabase, tareas.map((t) => t.id));

  return (
    <VistaLista
      lista={lista}
      tareas={tareas}
      vista={vista === "tablero" ? "tablero" : "lista"}
      hoy={hoy}
      base=""
      subtareas={Object.fromEntries(conteo)}
      acciones={accionesTareas}
    />
  );
}
