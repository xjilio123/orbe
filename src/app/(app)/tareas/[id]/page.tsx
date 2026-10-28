import { notFound } from "next/navigation";
import { accionesTareas } from "@/app/acciones/conjunto";
import { VistaTarea } from "@/components/vistas/VistaTarea";
import { listas, tareaConSubtareas } from "@/lib/datos/tareas";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Tarea · Orbe" };

export default async function DetalleTarea({ params }: PageProps<"/tareas/[id]">) {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirSesion();
  const [{ tarea, subtareas }, misListas] = await Promise.all([tareaConSubtareas(supabase, id), listas(supabase)]);
  // RLS: si la tarea es de otra persona, simplemente no existe para ti.
  if (!tarea) notFound();

  return <VistaTarea tarea={tarea} subtareas={subtareas} listas={misListas} hoy={hoyLima()} base="" acciones={accionesTareas} />;
}
