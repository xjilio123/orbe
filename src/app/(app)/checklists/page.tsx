import { accionesColeccion } from "@/app/acciones/conjunto";
import { VistaChecklists } from "@/components/vistas/VistaChecklists";
import { misChecklists } from "@/lib/datos/coleccion";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Checklists · Orbe" };

export default async function Checklists() {
  const { supabase } = await requerirSesion();
  return <VistaChecklists checklists={await misChecklists(supabase)} base="" acciones={accionesColeccion} />;
}
