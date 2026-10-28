import { accionesProgreso } from "@/app/acciones/conjunto";
import { VistaProgreso } from "@/components/vistas/VistaProgreso";
import { inicioDeHoyUtc, listas } from "@/lib/datos/tareas";
import { minutosDeFocoHoy, misEstadisticas, misFechas, misHabitos, misMetas } from "@/lib/datos/progreso";
import { hoyLima, sumarDias } from "@/lib/fechas";
import { anioDe } from "@/lib/progreso";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Progreso · Orbe" };

export default async function Progreso() {
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const anio = anioDe(hoy);
  // Consultas en paralelo: la pantalla espera solo a la más lenta.
  const [habitos, metas, fechas, estadisticas, minutosHoy, misListas] = await Promise.all([
    misHabitos(supabase, hoy),
    misMetas(supabase, anio),
    misFechas(supabase, sumarDias(hoy, -30)),
    misEstadisticas(supabase, 8),
    minutosDeFocoHoy(supabase, inicioDeHoyUtc(hoy)),
    listas(supabase),
  ]);

  return (
    <VistaProgreso
      hoy={hoy}
      base=""
      anio={anio}
      habitos={habitos}
      metas={metas}
      fechas={fechas}
      estadisticas={estadisticas}
      minutosHoy={minutosHoy}
      listas={misListas}
      acciones={accionesProgreso}
    />
  );
}
