-- =========================================================
-- Orbe · Fase 4 · Búsqueda por significado y "Pregunta a tus notas"
-- Cada página se parte en trozos y cada trozo se convierte en un vector con gte-small, que corre dentro
-- de Supabase (no usa Gemini ni manda tus notas afuera). Vectores livianos (halfvec): máximo 1.000 por persona.
-- Un cron cada 2 minutos llama a la Edge Function "vectores" solo si hay páginas cambiadas.
-- =========================================================

create extension if not exists vector with schema extensions;

alter table public.paginas add column vectorizado_en timestamptz;

create table public.vectores (
  pagina_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  trozo smallint not null check (trozo between 0 and 49),
  texto text not null check (char_length(texto) <= 2000),
  vector extensions.halfvec(384) not null,
  primary key (pagina_id, trozo),
  foreign key (pagina_id, user_id) references public.paginas (id, user_id) on delete cascade
);
create index vectores_usuario_idx on public.vectores (user_id);

alter table public.vectores enable row level security;
create policy "vectores_select_propios" on public.vectores
  for select to authenticated using ((select auth.uid()) = user_id);
-- Solo la Edge Function (con la conexión del sistema) escribe vectores.
revoke all on public.vectores from anon;
revoke insert, update, delete on public.vectores from authenticated;

insert into private.ajustes (clave, valor) values
  ('url_vectores', 'https://etgyhcwqkxpkjjpgzxxz.supabase.co/functions/v1/vectores')
on conflict (clave) do nothing;

/** Llama a la Edge Function solo si hay páginas que cambiaron hace más de 1 minuto (ya no las estás escribiendo). */
create or replace function private.disparar_vectores()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.paginas
    where borrado_en is null
      and (vectorizado_en is null or vectorizado_en < actualizado)
      and actualizado < now() - interval '1 minute'
  ) then
    perform net.http_post(
      url := (select valor from private.ajustes where clave = 'url_vectores'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-orbe-secreto', (select decrypted_secret from vault.decrypted_secrets where name = 'orbe_avisos')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  end if;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;

select cron.schedule('orbe-vectores', '*/2 * * * *', 'select private.disparar_vectores()');
