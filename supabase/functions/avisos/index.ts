// Edge Function "avisos" (Deno): envía los avisos push que tocan ahora.
//
// Solo la llama pg_cron (cada minuto, y solo si hay algo que avisar) con un secreto que vive en Vault.
// Se conecta directo a la base (SUPABASE_DB_URL, la pone Supabase), así no necesita ninguna clave de API.
// Las claves VAPID se crean aquí la primera vez y se guardan en Vault: nunca pasan por el repositorio ni por el chat.
import postgres from "npm:postgres@3.4.5";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const CONTACTO = "https://orbe-nine-chi.vercel.app";

type Aviso = { user_id: string; titulo: string; cuerpo: string; url: string; etiqueta: string };
type Suscripcion = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };

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

let claves: CryptoKeyPair | null = null;

async function clavesVapid(): Promise<CryptoKeyPair> {
  if (claves) return claves;
  const [fila] = await sql<{ s: string }[]>`select decrypted_secret as s from vault.decrypted_secrets where name = 'orbe_vapid'`;
  if (fila) return (claves = await webpush.importVapidKeys(JSON.parse(fila.s)));

  const nuevas = await webpush.generateVapidKeys({ extractable: true });
  const exportadas = await webpush.exportVapidKeys(nuevas);
  const publica = await webpush.exportApplicationServerKey(nuevas);
  await sql.begin(async (tx) => {
    await tx`select vault.create_secret(${JSON.stringify(exportadas)}, 'orbe_vapid', 'Claves VAPID de los avisos de Orbe')`;
    await tx`insert into private.ajustes (clave, valor) values ('vapid_publica', ${publica})`;
  });
  return (claves = await webpush.importVapidKeys(exportadas));
}

async function enviar(vapid: CryptoKeyPair, s: Suscripcion, a: Aviso): Promise<"ok" | "vencida" | "error"> {
  try {
    // Claves de cifrado nuevas para cada mensaje, como pide el estándar (RFC 8291).
    const servidor = await webpush.ApplicationServer.new({ contactInformation: CONTACTO, vapidKeys: vapid });
    const mensaje = JSON.stringify({ titulo: a.titulo, cuerpo: a.cuerpo, url: a.url, etiqueta: a.etiqueta });
    await servidor
      .subscribe({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } })
      .pushTextMessage(mensaje, { urgency: webpush.Urgency.High, ttl: 3600 });
    return "ok";
  } catch (e) {
    if (e instanceof webpush.PushMessageError && [404, 410].includes(e.response.status)) return "vencida";
    // Sin datos del dispositivo en el registro: solo el código de error.
    console.error("aviso no enviado:", e instanceof webpush.PushMessageError ? e.response.status : String(e));
    return "error";
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  if (!(await secretoValido(req.headers.get("x-orbe-secreto")))) return new Response("No autorizado", { status: 401 });

  const vapid = await clavesVapid();
  const avisos = await sql<Aviso[]>`select * from private.tomar_avisos()`;
  if (avisos.length === 0) return Response.json({ enviados: 0 });

  const usuarios = [...new Set(avisos.map((a) => a.user_id))];
  const suscripciones = await sql<Suscripcion[]>`
    select id, user_id, endpoint, p256dh, auth from public.suscripciones_push where user_id in ${sql(usuarios)}`;

  const resultados = await Promise.all(
    avisos.flatMap((a) => suscripciones.filter((s) => s.user_id === a.user_id).map(async (s) => ({ s, r: await enviar(vapid, s, a) }))),
  );

  // El teléfono ya no existe o quitó el permiso: se olvida esa suscripción.
  const vencidas = [...new Set(resultados.filter((x) => x.r === "vencida").map((x) => x.s.id))];
  if (vencidas.length > 0) await sql`delete from public.suscripciones_push where id in ${sql(vencidas)}`;

  return Response.json({
    enviados: resultados.filter((x) => x.r === "ok").length,
    vencidas: vencidas.length,
    errores: resultados.filter((x) => x.r === "error").length,
  });
});
