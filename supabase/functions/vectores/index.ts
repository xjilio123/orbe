// Edge Function "vectores" (Deno): búsqueda por significado con gte-small, que corre DENTRO de Supabase
// (no usa Gemini ni manda tus notas a otro servicio).
//
// Dos usos:
// 1. pg_cron (con el secreto de Vault): convierte en vectores las páginas que cambiaron. Máximo 1.000 por persona.
// 2. La app, con la sesión de la persona: busca los trozos de SUS páginas que más se parecen a una frase.
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const modelo = new Supabase.ai.Session("gte-small");

const MAX_POR_PERSONA = 1000;
const MAX_TROZOS = 50;
const TAMANO_TROZO = 900;
const SIN_TEXTO = new Set(["codigo", "imagen", "archivo", "separador"]);

type Bloque = { tipo?: unknown; texto?: unknown };

async function vector(texto: string): Promise<number[]> {
  return (await modelo.run(texto, { mean_pool: true, normalize: true })) as number[];
}

/** Junta los bloques en trozos de ~900 caracteres; cada trozo lleva el título para no perder el contexto. */
function trozos(titulo: string, contenido: unknown): string[] {
  const textos = (Array.isArray(contenido) ? (contenido as Bloque[]) : [])
    .filter((b) => typeof b?.texto === "string" && b.texto.trim() && !SIN_TEXTO.has(String(b.tipo)))
    .map((b) => String(b.texto).trim());
  const cabeza = titulo.trim() ? `${titulo.trim()}\n` : "";
  const salida: string[] = [];
  let actual = "";
  for (const t of textos) {
    if (actual && actual.length + t.length > TAMANO_TROZO) {
      salida.push(cabeza + actual);
      actual = "";
    }
    actual = actual ? `${actual}\n${t.slice(0, TAMANO_TROZO)}` : t.slice(0, TAMANO_TROZO);
  }
  if (actual) salida.push(cabeza + actual);
  if (salida.length === 0 && cabeza) salida.push(titulo.trim());
  return salida.map((s) => s.slice(0, 2000)).slice(0, MAX_TROZOS);
}

/** Compara el secreto en tiempo constante. */
async function secretoValido(recibido: string | null): Promise<boolean> {
  if (!recibido || recibido.length > 200) return false;
  const [fila] = await sql<{ s: string }[]>`select decrypted_secret as s from vault.decrypted_secrets where name = 'orbe_avisos'`;
  if (!fila) return false;
  const a = new TextEncoder().encode(fila.s);
  const b = new TextEncoder().encode(recibido);
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a[i] ^ b[i];
  return diferencia === 0;
}

async function procesarPendientes(): Promise<number> {
  const paginas = await sql<{ id: string; user_id: string; titulo: string; contenido: unknown }[]>`
    select id, user_id, titulo, contenido from public.paginas
    where borrado_en is null and (vectorizado_en is null or vectorizado_en < actualizado)
      and actualizado < now() - interval '1 minute'
    order by actualizado desc limit 8`;
  for (const p of paginas) {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from public.vectores where user_id = ${p.user_id} and pagina_id <> ${p.id}`;
    const lista = trozos(p.titulo, p.contenido).slice(0, Math.max(0, MAX_POR_PERSONA - n));
    const vectores: number[][] = [];
    for (const t of lista) vectores.push(await vector(t));
    await sql.begin(async (tx) => {
      await tx`delete from public.vectores where pagina_id = ${p.id}`;
      for (let i = 0; i < lista.length; i++) {
        await tx`insert into public.vectores (pagina_id, user_id, trozo, texto, vector)
                 values (${p.id}, ${p.user_id}, ${i}, ${lista[i]}, ${JSON.stringify(vectores[i])}::extensions.halfvec)`;
      }
      await tx`update public.paginas set vectorizado_en = now() where id = ${p.id}`;
    });
  }
  return paginas.length;
}

/** Quién pide la búsqueda: se valida su sesión con Supabase Auth. */
async function usuarioDe(req: Request): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token || token.length > 4000) return null;
  let apikey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  try {
    apikey = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default ?? apikey;
  } catch {
    // se usa la clave anon
  }
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey } });
  if (!r.ok) return null;
  const u = (await r.json()) as { id?: string };
  return typeof u.id === "string" ? u.id : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });

  // 1. Cron: vectorizar páginas que cambiaron.
  if (req.headers.get("x-orbe-secreto")) {
    if (!(await secretoValido(req.headers.get("x-orbe-secreto")))) return new Response("No autorizado", { status: 401 });
    return Response.json({ paginas: await procesarPendientes() });
  }

  // 2. App: buscar por significado dentro de las páginas de quien pregunta.
  const usuario = await usuarioDe(req);
  if (!usuario) return new Response("No autorizado", { status: 401 });
  let cuerpo: { consulta?: unknown; limite?: unknown } = {};
  try {
    cuerpo = await req.json();
  } catch {
    return new Response("Pedido no válido", { status: 400 });
  }
  const consulta = typeof cuerpo.consulta === "string" ? cuerpo.consulta.trim().slice(0, 300) : "";
  if (consulta.length < 2) return Response.json({ resultados: [] });
  const limite = Math.min(20, Math.max(1, Number(cuerpo.limite) || 10));
  const v = JSON.stringify(await vector(consulta));
  const resultados = await sql`
    select v.pagina_id, p.titulo, p.icono, v.texto, 1 - (v.vector <=> ${v}::extensions.halfvec) as similitud
    from public.vectores v join public.paginas p on p.id = v.pagina_id
    where v.user_id = ${usuario} and p.borrado_en is null
    order by v.vector <=> ${v}::extensions.halfvec
    limit ${limite}`;
  return Response.json({ resultados });
});
