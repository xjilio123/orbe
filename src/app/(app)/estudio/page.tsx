import { accionesEstudio } from "@/app/acciones/conjunto";
import { VistaEstudio } from "@/components/vistas/VistaEstudio";
import { misCursos } from "@/lib/datos/estudio";
import { todasLasPaginas } from "@/lib/datos/paginas";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Modo estudio · Orbe" };

export default async function Estudio() {
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const todas = await todasLasPaginas(supabase);
  const cursos = await misCursos(supabase, hoy, todas);
  return <VistaEstudio cursos={cursos} hoy={hoy} base="" acciones={accionesEstudio} />;
}
