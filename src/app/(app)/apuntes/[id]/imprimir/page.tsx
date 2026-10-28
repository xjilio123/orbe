import { notFound } from "next/navigation";
import { VistaImprimir } from "@/components/vistas/VistaImprimir";
import { adjuntosDePagina, enlacesFirmados, pagina as leerPagina } from "@/lib/datos/paginas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Exportar a PDF · Orbe" };

export default async function Imprimir({ params }: PageProps<"/apuntes/[id]/imprimir">) {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirSesion();
  const [pagina, adjuntos] = await Promise.all([leerPagina(supabase, id), adjuntosDePagina(supabase, id)]);
  if (!pagina) notFound();
  const urls = await enlacesFirmados(supabase, adjuntos);
  return <VistaImprimir pagina={pagina} urls={urls} base="" />;
}
