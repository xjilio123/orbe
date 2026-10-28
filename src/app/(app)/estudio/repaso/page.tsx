import { notFound } from "next/navigation";
import { VistaRepaso } from "@/components/vistas/VistaRepaso";
import { tarjetasParaRepasar } from "@/lib/datos/estudio";
import { todasLasPaginas } from "@/lib/datos/paginas";
import { mezclar } from "@/lib/estudio";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Repasar · Orbe" };

export default async function Repaso({ searchParams }: PageProps<"/estudio/repaso">) {
  const { pagina, curso } = await searchParams;
  const origen =
    typeof pagina === "string" && esquemaId.safeParse(pagina).success
      ? { pagina }
      : typeof curso === "string" && esquemaId.safeParse(curso).success
        ? { curso }
        : null;
  if (!origen) notFound();
  const { supabase } = await requerirSesion();
  const todas = "curso" in origen ? await todasLasPaginas(supabase) : [];
  const repaso = await tarjetasParaRepasar(supabase, todas, origen);
  if (!repaso) notFound();
  // Un orden distinto cada día (y el mismo durante el día, aunque recargues).
  const semilla = Number(hoyLima().replaceAll("-", ""));
  const volver = "pagina" in origen ? { href: `/apuntes/${origen.pagina}`, texto: "Volver a la página" } : { href: "/estudio", texto: "Modo estudio" };
  return <VistaRepaso titulo={repaso.titulo} tarjetas={mezclar(repaso.tarjetas, semilla)} volver={volver} base="" />;
}
