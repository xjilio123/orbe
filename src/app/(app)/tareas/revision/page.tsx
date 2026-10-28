import { accionesTareas } from "@/app/acciones/conjunto";
import { VistaRevision } from "@/components/vistas/VistaRevision";
import { lunesDe } from "@/lib/agenda";
import { misHabitos } from "@/lib/datos/progreso";
import { inicioDeHoyUtc, tareasActivas, tareasHechasDesde } from "@/lib/datos/tareas";
import { hoyLima } from "@/lib/fechas";
import { revisionSemanal } from "@/lib/organizacion";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Revisión semanal · Orbe" };

export default async function Revision() {
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const [pendientes, hechas, habitos] = await Promise.all([
    tareasActivas(supabase, hoy),
    tareasHechasDesde(supabase, inicioDeHoyUtc(lunesDe(hoy))),
    misHabitos(supabase, hoy),
  ]);
  return <VistaRevision hoy={hoy} base="" revision={revisionSemanal(pendientes, hechas, hoy)} habitos={habitos} acciones={accionesTareas} />;
}
