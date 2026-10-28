-- =========================================================
-- Orbe · Fase 1 · Apuntes por bloques, adjuntos y control de espacio
-- Plan gratis: 500 MB de base y 1 GB de archivos para 30 personas →
-- 8 MB de texto y 30 MB de archivos por persona, con candado en la base.
-- =========================================================

-- ---------- Páginas (árbol: una página puede tener subpáginas) ----------
create table public.paginas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  padre_id uuid,
  titulo text not null default '' check (char_length(titulo) <= 200),
  icono text not null default '' check (char_length(icono) <= 16),
  contenido jsonb not null default '[]'::jsonb
    check (jsonb_typeof(contenido) = 'array' and pg_column_size(contenido) <= 262144),
  favorita boolean not null default false,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  unique (id, user_id),
  foreign key (padre_id, user_id) references public.paginas (id, user_id) on delete cascade,
  constraint no_es_su_propia_padre check (padre_id is null or padre_id <> id)
);

create index paginas_dueno_idx on public.paginas (user_id, actualizado desc);
create index paginas_padre_idx on public.paginas (padre_id, user_id);

-- Sin ciclos (una página no puede quedar dentro de su propia descendencia), máximo 10 niveles,
-- 8 MB de texto por persona y fecha de actualización automática.
create or replace function private.antes_de_guardar_pagina()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual uuid := new.padre_id;
  nivel integer := 0;
  usado bigint;
begin
  while actual is not null loop
    if actual = new.id then
      raise exception 'Una página no puede ir dentro de sí misma';
    end if;
    nivel := nivel + 1;
    if nivel > 10 then
      raise exception 'Máximo 10 niveles de páginas';
    end if;
    select padre_id into actual from public.paginas where id = actual;
  end loop;

  if tg_op = 'INSERT' or new.contenido is distinct from old.contenido then
    select coalesce(sum(pg_column_size(contenido)), 0) into usado
      from public.paginas where user_id = new.user_id and id <> new.id;
    if usado + pg_column_size(new.contenido) > 8388608 then
      raise exception 'Sin espacio: llegaste a los 8 MB de texto';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizado = now();
  end if;
  return new;
end;
$$;

create trigger paginas_antes_de_guardar
  before insert or update on public.paginas
  for each row execute function private.antes_de_guardar_pagina();

create trigger paginas_tope before insert on public.paginas
  for each row execute function private.limitar_filas('2000');

-- ---------- Adjuntos (fotos y PDF dentro de una página) ----------
create table public.adjuntos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pagina_id uuid not null,
  ruta text not null unique check (ruta ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png|pdf)$'),
  tipo text not null check (tipo in ('image/webp', 'image/jpeg', 'image/png', 'application/pdf')),
  tamano integer not null check (tamano between 1 and 4194304),
  nombre text not null default '' check (char_length(nombre) <= 120),
  creado timestamptz not null default now(),
  foreign key (pagina_id, user_id) references public.paginas (id, user_id) on delete cascade,
  -- La carpeta del archivo siempre es la de su dueño.
  constraint ruta_del_dueno check (split_part(ruta, '/', 1) = user_id::text)
);

create index adjuntos_pagina_idx on public.adjuntos (pagina_id, user_id);
create index adjuntos_dueno_idx on public.adjuntos (user_id);

-- Candado de espacio: 30 MB de archivos y 500 archivos por persona.
create or replace function private.antes_de_crear_adjunto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  usado bigint;
  cantidad integer;
begin
  select coalesce(sum(tamano), 0), count(*) into usado, cantidad
    from public.adjuntos where user_id = new.user_id;
  if cantidad >= 500 then
    raise exception 'Llegaste al máximo de 500 archivos';
  end if;
  if usado + new.tamano > 31457280 then
    raise exception 'Sin espacio: llegaste a los 30 MB de archivos';
  end if;
  return new;
end;
$$;

create trigger adjuntos_antes_de_crear
  before insert on public.adjuntos
  for each row execute function private.antes_de_crear_adjunto();

-- ---------- Medidor de espacio (solo lo propio: RLS se aplica dentro) ----------
create or replace function public.mi_espacio()
returns table (archivos bigint, archivos_max bigint, texto bigint, texto_max bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select coalesce(sum(tamano), 0) from public.adjuntos where user_id = (select auth.uid())),
    31457280::bigint,
    (select coalesce(sum(pg_column_size(contenido)), 0) from public.paginas where user_id = (select auth.uid())),
    8388608::bigint;
$$;

revoke all on function public.mi_espacio() from public, anon;
grant execute on function public.mi_espacio() to authenticated;

-- ---------- RLS ----------
alter table public.paginas enable row level security;
alter table public.adjuntos enable row level security;

create policy "paginas_select_propias" on public.paginas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "paginas_insert_propias" on public.paginas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "paginas_update_propias" on public.paginas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "paginas_delete_propias" on public.paginas
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "adjuntos_select_propios" on public.adjuntos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "adjuntos_insert_propios" on public.adjuntos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "adjuntos_delete_propios" on public.adjuntos
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.paginas, public.adjuntos from anon;
revoke update on public.paginas from authenticated;
grant update (padre_id, titulo, icono, contenido, favorita) on public.paginas to authenticated;
-- Los adjuntos no se editan: se crean o se borran.
revoke update on public.adjuntos from authenticated;

-- ---------- Bucket privado de archivos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('adjuntos', 'adjuntos', false, 4194304, array['image/webp', 'image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- Solo se puede subir a la propia carpeta y a una ruta ya registrada (con el candado de espacio aplicado).
create policy "adjuntos_subir_propios" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'adjuntos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.adjuntos a where a.ruta = name and a.user_id = (select auth.uid()))
  );
create policy "adjuntos_ver_propios" on storage.objects
  for select to authenticated
  using (bucket_id = 'adjuntos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "adjuntos_borrar_propios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'adjuntos' and (storage.foldername(name))[1] = (select auth.uid())::text);

revoke all on all functions in schema private from public, anon, authenticated;
