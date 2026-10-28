import { accionesIa, accionesTareas } from "@/app/acciones/conjunto";
import { VistaHoy } from "@/components/vistas/VistaHoy";
import { listas, tareasActivas } from "@/lib/datos/tareas";
import { fechaEncabezado, hoyLima, saludo } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { lunesDe } from "@/lib/agenda";
import type { Plan, ResumenSemana } from "@/lib/ia/contenido";
import { esInbox, resumenDelDia } from "@/lib/tareas";

export const metadata = { title: "Hoy · Orbe" };

export default async function Hoy() {
  const { supabase, usuario } = await requerirSesion();
  const hoy = hoyLima();
  // Consultas en paralelo: la pantalla espera solo a la más lenta.
  const [{ data: perfil }, tareas, misListas, { data: guardado }] = await Promise.all([
    supabase.from("perfiles").select("nombre").eq("id", usuario.id).maybeSingle(),
    tareasActivas(supabase, hoy),
    listas(supabase),
    supabase.from("ia_guardado").select("clave,fecha,datos"),
  ]);
  // El plan vale solo hoy y el resumen, solo esta semana.
  const plan = guardado?.find((g) => g.clave === "plan" && g.fecha === hoy)?.datos as unknown as Plan | undefined;
  const semana = guardado?.find((g) => g.clave === "semana" && g.fecha === lunesDe(hoy))?.datos as unknown as ResumenSemana | undefined;
  const ahora = new Date();
  const inicioHoy = Date.parse(`${hoy}T05:00:00Z`);

  return (
    <VistaHoy
      fecha={fechaEncabezado(ahora)}
      saludo={saludo(ahora)}
      nombre={perfil?.nombre.split(" ")[0]}
      hoy={hoy}
      base=""
      resumen={resumenDelDia(tareas, hoy, (t) => t.hecha_en !== null && Date.parse(t.hecha_en) >= inicioHoy)}
      inbox={tareas.filter(esInbox).length}
      listas={misListas}
      acciones={accionesTareas}
      ia={accionesIa}
      iaGuardado={{ plan: plan ?? null, semana: semana ?? null }}
    />
  );
}
