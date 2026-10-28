import { notFound } from "next/navigation";
import { accionesApuntes, accionesIa, accionesNotas } from "@/app/acciones/conjunto";
import { VistaPagina } from "@/components/vistas/VistaPagina";
import { adjuntosDePagina, ancestros, enlacesFirmados, pagina as leerPagina, paginasQueEnlazan, todasLasPaginas } from "@/lib/datos/paginas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Apunte · Orbe" };

export default async function PaginaApunte({ params }: PageProps<"/apuntes/[id]">) {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirSesion();
  const [pagina, todas, adjuntos, mencionan] = await Promise.all([
    leerPagina(supabase, id),
    todasLasPaginas(supabase),
    adjuntosDePagina(supabase, id),
    paginasQueEnlazan(supabase, id),
  ]);
  // RLS: si la página es de otra persona, simplemente no existe para ti.
  if (!pagina) notFound();
  const urls = await enlacesFirmados(supabase, adjuntos);

  return (
    <VistaPagina
      key={pagina.id}
      pagina={pagina}
      camino={ancestros(todas, id)}
      hijas={todas.filter((p) => p.padre_id === id).sort((a, b) => a.titulo.localeCompare(b.titulo))}
      urls={urls}
      tamanos={Object.fromEntries(adjuntos.map((a) => [a.id, a.tamano]))}
      base=""
      acciones={accionesApuntes}
      ia={accionesIa}
      paginas={todas.map((p) => ({ id: p.id, titulo: p.titulo, icono: p.icono }))}
      mencionan={mencionan}
      notas={accionesNotas}
    />
  );
}
