import { accionesTareas } from "@/app/acciones/conjunto";
import { VistaHoy } from "@/components/vistas/VistaHoy";
import { listas, tareasActivas } from "@/lib/datos/tareas";
import { fechaEncabezado, hoyLima, saludo } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esInbox, resumenDelDia } from "@/lib/tareas";

export const metadata = { title: "Hoy · Orbe" };

export default async function Hoy() {
  const { supabase, usuario } = await requerirSesion();
  const hoy = hoyLima();
  // Consultas en paralelo: la pantalla espera solo a la más lenta.
  const [{ data: perfil }, tareas, misListas] = await Promise.all([
    supabase.from("perfiles").select("nombre").eq("id", usuario.id).maybeSingle(),
    tareasActivas(supabase, hoy),
    listas(supabase),
  ]);
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
    />
  );
}
