import { accionesTareas } from "@/app/acciones/conjunto";
import { VistaAgenda } from "@/components/vistas/VistaAgenda";
import { itemsPorDia, leerParametros, rangoDeVista } from "@/lib/agenda";
import { eventosDeGoogle } from "@/lib/datos/calendario";
import { tareasDeAgenda } from "@/lib/datos/tareas";
import { hoyLima, minutosLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Agenda · Orbe" };

export default async function Agenda({ searchParams }: PageProps<"/agenda">) {
  const hoy = hoyLima();
  const parametros = await searchParams;
  const { vista, dia } = leerParametros(parametros.vista, parametros.dia, hoy);
  const [desde, hasta] = rangoDeVista(vista, dia);
  const { supabase, usuario } = await requerirSesion();

  // Google se descarga en paralelo con las tareas; si tarda o falla, la Agenda sale igual.
  const [tareas, google] = await Promise.all([
    tareasDeAgenda(supabase, desde, hasta),
    supabase
      .from("perfiles")
      .select("calendario_ics")
      .eq("id", usuario.id)
      .maybeSingle()
      .then(async ({ data }) => ({
        conectado: Boolean(data?.calendario_ics),
        ...(await eventosDeGoogle(usuario.id, data?.calendario_ics ?? null, desde, hasta)),
      })),
  ]);

  return (
    <VistaAgenda
      vista={vista}
      dia={dia}
      hoy={hoy}
      ahora={minutosLima()}
      porDia={itemsPorDia(tareas, google.eventos, desde, hasta)}
      google={{ conectado: google.conectado, error: google.error }}
      base=""
      acciones={accionesTareas}
    />
  );
}
