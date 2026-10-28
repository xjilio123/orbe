import { VistaHoy } from "@/components/vistas/VistaHoy";
import { fechaEncabezado, saludo } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Hoy · Orbe" };

export default async function Hoy() {
  const { supabase, usuario } = await requerirSesion();
  const { data: perfil } = await supabase.from("perfiles").select("nombre").eq("id", usuario.id).maybeSingle();
  const ahora = new Date();

  return <VistaHoy fecha={fechaEncabezado(ahora)} saludo={saludo(ahora)} nombre={perfil?.nombre.split(" ")[0]} />;
}
