"use server";

import { revalidatePath } from "next/cache";
import { borrarParaSiempre, paginasEnPapelera, tareasEnPapelera } from "@/lib/datos/papelera";
import { grupo } from "@/lib/papelera";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

type Tipo = "tarea" | "pagina";
const esTipo = (t: unknown): t is Tipo => t === "tarea" || t === "pagina";

function refrescar() {
  revalidatePath("/", "layout");
}

/**
 * Restaura un elemento y lo que se borró con él. Si su padre sigue en la papelera,
 * vuelve como elemento suelto (tarea normal o página en la raíz) para que no quede escondido.
 */
export async function restaurar(tipo: string, id: string): Promise<void> {
  if (!esTipo(tipo) || !esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  const tabla = tipo === "tarea" ? "tareas" : "paginas";
  const items = tipo === "tarea" ? await tareasEnPapelera(supabase) : await paginasEnPapelera(supabase);
  const raiz = items.find((i) => i.id === id);
  if (!raiz) return;

  const ids = grupo(items, id);
  const padreBorrado = raiz.padre_id !== null && items.some((i) => i.id === raiz.padre_id);
  if (padreBorrado) await supabase.from(tabla).update({ padre_id: null }).eq("id", id);
  for (let i = 0; i < ids.length; i += 200) {
    await supabase.from(tabla).update({ borrado_en: null }).in("id", ids.slice(i, i + 200));
  }
  refrescar();
}

/** Borra para siempre un elemento de la papelera (y lo que se borró con él). */
export async function eliminarDefinitivo(tipo: string, id: string): Promise<void> {
  if (!esTipo(tipo) || !esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  if (tipo === "tarea") {
    const ids = grupo(await tareasEnPapelera(supabase), id);
    await borrarParaSiempre(supabase, { tareas: ids, paginas: [] });
  } else {
    const ids = grupo(await paginasEnPapelera(supabase), id);
    await borrarParaSiempre(supabase, { tareas: [], paginas: ids });
  }
  refrescar();
}

/** Vacía toda la papelera: libera el espacio de inmediato. */
export async function vaciarPapelera(): Promise<void> {
  const { supabase } = await requerirUsuario();
  const [tareas, paginas] = await Promise.all([tareasEnPapelera(supabase), paginasEnPapelera(supabase)]);
  await borrarParaSiempre(supabase, { tareas: tareas.map((t) => t.id), paginas: paginas.map((p) => p.id) });
  refrescar();
}
