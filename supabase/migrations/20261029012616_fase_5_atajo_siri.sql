-- =========================================================
-- Orbe · Fase 5 (parte 4) · Atajo de Siri "Anota en Orbe".
-- Una clave personal (que solo sirve para crear tareas en tu Inbox) permite anotar sin abrir la app.
-- La base guarda solo la huella SHA-256 de la clave: aunque alguien leyera la tabla, no la obtiene.
-- =========================================================

create table public.claves_atajo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 40),
  hash text not null unique check (hash ~ '^[0-9a-f]{64}$'),
  -- Últimos caracteres de la clave, para reconocerla en Ajustes.
  pista text not null check (char_length(pista) between 4 and 8),
  creado timestamptz not null default now(),
  ultimo_uso timestamptz,
  -- Freno: hasta 30 tareas por hora con cada clave.
  ventana timestamptz,
  usos_ventana integer not null default 0
);
create index claves_atajo_user_idx on public.claves_atajo (user_id);

create trigger claves_atajo_tope before insert on public.claves_atajo
  for each row execute function private.limitar_filas('5');

alter table public.claves_atajo enable row level security;
create policy "claves_atajo_select_propias" on public.claves_atajo
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "claves_atajo_insert_propias" on public.claves_atajo
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "claves_atajo_delete_propias" on public.claves_atajo
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.claves_atajo from anon;
revoke update on public.claves_atajo from authenticated;
-- Solo se crean con nombre, huella y pista; el resto lo maneja la base.
revoke insert on public.claves_atajo from authenticated;
grant insert (nombre, hash, pista) on public.claves_atajo to authenticated;

-- Crea una tarea con una clave del atajo. La llama /api/atajo sin sesión (por eso es SECURITY DEFINER),
-- pero solo hace una cosa: con una clave válida, agrega una tarea a la persona dueña de la clave.
create or replace function public.capturar_con_clave(
  p_clave text,
  p_titulo text,
  p_fecha date default null,
  p_hora time default null,
  p_prioridad integer default 0,
  p_lista text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  k public.claves_atajo%rowtype;
  ahora timestamptz := now();
  titulo text := left(btrim(coalesce(p_titulo, '')), 200);
  lista uuid;
begin
  if p_clave is null or char_length(p_clave) not between 20 and 100 then
    raise exception 'CLAVE_INVALIDA';
  end if;
  select * into k from public.claves_atajo
    where hash = encode(extensions.digest(p_clave, 'sha256'), 'hex')
    for update;
  if not found then
    raise exception 'CLAVE_INVALIDA';
  end if;

  if k.ventana is null or k.ventana < ahora - interval '1 hour' then
    update public.claves_atajo set ventana = ahora, usos_ventana = 1, ultimo_uso = ahora where id = k.id;
  elsif k.usos_ventana >= 30 then
    raise exception 'DEMASIADAS';
  else
    update public.claves_atajo set usos_ventana = usos_ventana + 1, ultimo_uso = ahora where id = k.id;
  end if;

  if titulo = '' then
    raise exception 'SIN_TEXTO';
  end if;

  if p_lista is not null and btrim(p_lista) <> '' then
    select id into lista from public.listas
      where user_id = k.user_id and lower(btrim(nombre)) = lower(btrim(p_lista))
      limit 1;
  end if;

  insert into public.tareas (user_id, titulo, fecha, hora, prioridad, lista_id)
  values (
    k.user_id,
    titulo,
    p_fecha,
    case when p_fecha is null then null else p_hora end,
    greatest(0, least(3, coalesce(p_prioridad, 0))),
    lista
  );
  return titulo;
end;
$$;

revoke all on function public.capturar_con_clave(text, text, date, time, integer, text) from public;
grant execute on function public.capturar_con_clave(text, text, date, time, integer, text) to anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
-- El índice de títulos de páginas usa esta función con los permisos de quien guarda (ver fase_5_enlaces_permisos).
grant execute on function private.normalizar_titulo(text) to authenticated;
