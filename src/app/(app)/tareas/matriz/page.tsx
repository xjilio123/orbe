import { accionesOrganizacion } from "@/app/acciones/conjunto";
import { VistaMatriz } from "@/components/vistas/VistaMatriz";
import { tareasActivas } from "@/lib/datos/tareas";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Matriz · Orbe" };

export default async function Matriz() {
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const tareas = await tareasActivas(supabase, hoy);
  return <VistaMatriz tareas={tareas} hoy={hoy} base="" acciones={accionesOrganizacion} />;
}
