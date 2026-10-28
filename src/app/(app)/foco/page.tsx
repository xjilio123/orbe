import { accionesProgreso } from "@/app/acciones/conjunto";
import { VistaFoco } from "@/components/vistas/VistaFoco";
import { minutosDeFocoHoy } from "@/lib/datos/progreso";
import { inicioDeHoyUtc, tareasActivas } from "@/lib/datos/tareas";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { compararTareas } from "@/lib/tareas";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Modo foco · Orbe" };

export default async function Foco({ searchParams }: PageProps<"/foco">) {
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const [{ tarea }, tareas, minutosHoy] = await Promise.all([searchParams, tareasActivas(supabase, hoy), minutosDeFocoHoy(supabase, inicioDeHoyUtc(hoy))]);
  // Solo tareas pendientes (sin subtareas), las más urgentes primero.
  const pendientes = tareas
    .filter((t) => t.estado !== "hecha" && !t.padre_id)
    .sort(compararTareas)
    .slice(0, 100)
    .map((t) => ({ id: t.id, titulo: t.titulo }));
  const inicial = typeof tarea === "string" && esquemaId.safeParse(tarea).success && pendientes.some((t) => t.id === tarea) ? tarea : null;

  return <VistaFoco base="" tareas={pendientes} tareaInicial={inicial} minutosHoy={minutosHoy} guardar={accionesProgreso.guardarFoco} />;
}
