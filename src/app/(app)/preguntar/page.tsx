import { accionesIa } from "@/app/acciones/conjunto";
import { VistaPreguntar } from "@/components/vistas/VistaPreguntar";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Pregunta a tus notas · Orbe" };

export default async function Preguntar({ searchParams }: PageProps<"/preguntar">) {
  await requerirSesion();
  const { q } = await searchParams;
  return <VistaPreguntar base="" inicial={typeof q === "string" ? q.slice(0, 300) : ""} preguntar={accionesIa.preguntar} />;
}
