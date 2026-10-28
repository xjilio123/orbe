import "server-only";
import type { ResultadoIa } from "@/app/acciones/tipos";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { mensajeTope, type FuncionIa } from "./funciones";
import { ErrorIa, iaConfigurada } from "./gemini";

export type Cliente = Awaited<ReturnType<typeof requerirUsuario>>["supabase"];

/**
 * Toda función de IA pasa por aquí: la base reserva el uso (topes, esperas, freno general),
 * se llama a Gemini y se marca si salió bien. Los errores no cuentan para los topes.
 */
export async function conTope<T>(funcion: FuncionIa, ejecutar: (supabase: Cliente, usuario: string) => Promise<T>): Promise<ResultadoIa<T>> {
  if (!iaConfigurada()) return { ok: false, error: "La IA aún no está configurada." };
  const { supabase, usuario } = await requerirUsuario();
  const { data: id, error } = await supabase.rpc("reservar_ia", { p_funcion: funcion });
  if (error || id === null) return { ok: false, error: mensajeTope(error?.message ?? "") };
  try {
    const resultado = await ejecutar(supabase, usuario.id);
    await supabase.rpc("terminar_ia", { p_id: id, p_ok: true });
    return { ok: true, datos: resultado };
  } catch (e) {
    await supabase.rpc("terminar_ia", { p_id: id, p_ok: false });
    return { ok: false, error: e instanceof ErrorIa ? e.message : "No se pudo completar. Intenta de nuevo." };
  }
}
