import { accionesPapelera } from "@/app/acciones/conjunto";
import { VistaPapelera } from "@/components/vistas/VistaPapelera";
import { contenidoPapelera, purgarVencidos } from "@/lib/datos/papelera";
import { requerirUsuario } from "@/lib/supabase/servidor";

export const metadata = { title: "Papelera · Orbe" };

export default async function Papelera() {
  const { supabase } = await requerirUsuario();
  // Lo que ya cumplió 30 días se borra para siempre aquí (con sus archivos), antes de mostrar la lista.
  await purgarVencidos(supabase);
  const { tareas, paginas } = await contenidoPapelera(supabase);
  return <VistaPapelera tareas={tareas} paginas={paginas} base="" ahora={new Date().toISOString()} acciones={accionesPapelera} />;
}
