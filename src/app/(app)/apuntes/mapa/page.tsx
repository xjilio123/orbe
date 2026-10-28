import { VistaMapa } from "@/components/vistas/VistaMapa";
import { misEnlaces, todasLasPaginas } from "@/lib/datos/paginas";
import { armarGrafo, distribuir, type Arista } from "@/lib/grafo";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Mapa de notas · Orbe" };

export default async function Mapa() {
  const { supabase } = await requerirSesion();
  const [paginas, enlaces] = await Promise.all([todasLasPaginas(supabase), misEnlaces(supabase)]);
  const aristas: Arista[] = [
    ...enlaces.map((e) => ({ origen: e.origen, destino: e.destino, tipo: "enlace" as const })),
    ...paginas.flatMap((p) => (p.padre_id ? [{ origen: p.padre_id, destino: p.id, tipo: "dentro" as const }] : [])),
  ];
  const g = armarGrafo(
    paginas.map((p) => ({ id: p.id, titulo: p.titulo, icono: p.icono })),
    aristas,
  );
  // Con pocas páginas el mapa entra en la pantalla; con muchas, crece y se recorre con el dedo.
  const lado = Math.round(Math.min(1400, Math.max(380, 70 * Math.sqrt(g.nodos.length) + 240)));
  return (
    <VistaMapa nodos={distribuir(g.nodos, g.aristas, lado, Math.round(lado * 1.2))} aristas={g.aristas} ancho={lado} alto={Math.round(lado * 1.2)} total={paginas.length} base="" />
  );
}
