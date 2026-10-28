import { notFound } from "next/navigation";
import { accionesIa, accionesOrganizacion, accionesTareas } from "@/app/acciones/conjunto";
import { VistaLista } from "@/components/vistas/VistaLista";
import { conteoSubtareas, listas, tareasDeLista, vistasGuardadas } from "@/lib/datos/tareas";
import { leerConfig } from "@/lib/organizacion";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Lista · Orbe" };

export default async function PaginaLista({ params, searchParams }: PageProps<"/tareas/lista/[id]">) {
  const [{ id }, consulta] = await Promise.all([params, searchParams]);
  const { vista } = consulta;
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const [misListas, tareas, vistas] = await Promise.all([
    listas(supabase),
    tareasDeLista(supabase, id, hoy),
    vista === "tabla" ? vistasGuardadas(supabase, id) : Promise.resolve([]),
  ]);
  const lista = misListas.find((l) => l.id === id);
  if (!lista) notFound();
  const conteo = await conteoSubtareas(supabase, tareas.map((t) => t.id));

  return (
    <VistaLista
      lista={lista}
      tareas={tareas}
      vista={vista === "tablero" || vista === "tabla" ? vista : "lista"}
      tabla={{ config: leerConfig(consulta), vistas }}
      organizacion={accionesOrganizacion}
      hoy={hoy}
      base=""
      subtareas={Object.fromEntries(conteo)}
      acciones={accionesTareas} ia={accionesIa}
    />
  );
}
