import { accionesEstudio } from "@/app/acciones/conjunto";
import { VistaDiario } from "@/components/vistas/VistaDiario";
import { diarioDelMes } from "@/lib/datos/estudio";
import { hoyLima } from "@/lib/fechas";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Diario · Orbe" };

export default async function Diario({ searchParams }: PageProps<"/diario">) {
  const { supabase } = await requerirSesion();
  const hoy = hoyLima();
  const { mes: pedido, error } = await searchParams;
  // Solo meses válidos y nunca después del actual.
  const mes = typeof pedido === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) && pedido <= hoy.slice(0, 7) ? pedido : hoy.slice(0, 7);
  const [dias, diasDeHoy] = await Promise.all([diarioDelMes(supabase, mes), mes === hoy.slice(0, 7) ? Promise.resolve(null) : diarioDelMes(supabase, hoy.slice(0, 7))]);
  // El cuadro de "hoy" necesita el registro de hoy aunque estés mirando otro mes.
  const todos = diasDeHoy ? [...dias, ...diasDeHoy.filter((d) => d.fecha === hoy)] : dias;
  return <VistaDiario hoy={hoy} mes={mes} dias={todos} base="" error={error === "1"} acciones={accionesEstudio} />;
}
