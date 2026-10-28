import { accionesApuntes } from "@/app/acciones/conjunto";
import { VistaNuevaPagina } from "@/components/vistas/VistaNuevaPagina";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Nueva página · Orbe" };

export default async function NuevaPagina({ searchParams }: PageProps<"/apuntes/nueva">) {
  const { padre } = await searchParams;
  const padreId = typeof padre === "string" && esquemaId.safeParse(padre).success ? padre : null;
  const { supabase } = await requerirSesion();
  const { data } = await supabase
    .from("paginas")
    .select("id,titulo,icono")
    .eq("plantilla", true)
    .is("borrado_en", null)
    .order("titulo")
    .limit(50);

  return <VistaNuevaPagina padreId={padreId} propias={data ?? []} base="" acciones={accionesApuntes} />;
}
