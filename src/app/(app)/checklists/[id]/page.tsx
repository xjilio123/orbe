import { notFound } from "next/navigation";
import { accionesColeccion } from "@/app/acciones/conjunto";
import { VistaChecklist } from "@/components/vistas/VistaChecklist";
import { checklistConItems } from "@/lib/datos/coleccion";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Checklist · Orbe" };

export default async function PaginaChecklist({ params }: PageProps<"/checklists/[id]">) {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirSesion();
  const datos = await checklistConItems(supabase, id);
  if (!datos) notFound();
  return <VistaChecklist checklist={datos.checklist} items={datos.items} base="" acciones={accionesColeccion} />;
}
