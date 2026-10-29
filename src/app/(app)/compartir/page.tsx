import { guardarCompartido } from "@/app/acciones/compartir";
import { VistaCompartir } from "@/components/vistas/VistaCompartir";
import { leerCompartido } from "@/lib/compartir";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Guardar en Orbe" };

export default async function Compartir({ searchParams }: PageProps<"/compartir">) {
  await requerirSesion();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  return <VistaCompartir compartido={leerCompartido(params)} error={error} guardar={guardarCompartido} />;
}
