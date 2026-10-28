import { accionesNotas } from "@/app/acciones/conjunto";
import { VistaApuntes } from "@/components/vistas/VistaApuntes";
import { todasLasPaginas } from "@/lib/datos/paginas";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Apuntes · Orbe" };

export default async function Apuntes({ searchParams }: PageProps<"/apuntes">) {
  const { supabase } = await requerirSesion();
  const [paginas, { error, vista }] = await Promise.all([todasLasPaginas(supabase), searchParams]);
  const hijas = new Map<string, number>();
  for (const p of paginas) if (p.padre_id) hijas.set(p.padre_id, (hijas.get(p.padre_id) ?? 0) + 1);

  return (
    <VistaApuntes
      paginas={paginas.map((p) => ({ ...p, hijas: hijas.get(p.id) ?? 0 }))}
      hoy={hoyLima()}
      base=""
      error={error === "1"}
      notas={accionesNotas}
      vista={vista === "galeria" ? "galeria" : "lista"}
    />
  );
}
