-- =========================================================
-- Orbe · Fase 1 · Listas y tareas (Inbox = tareas sin lista ni fecha)
-- Seguridad: RLS en todo, llaves compuestas (id, user_id) para que nadie
-- apunte a listas o tareas de otra persona, y topes para cuidar el espacio gratis.
-- =========================================================

create table public.listas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  color text not null default 'azul' check (color in ('indigo', 'azul', 'rojo', 'morado', 'naranja', 'verde', 'celeste')),
  orden integer not null default 0,
  creado timestamptz not null default now(),
  unique (id, user_id)
);

create unique index listas_nombre_unico on public.listas (user_id, lower(btrim(nombre)));

create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lista_id uuid,
  padre_id uuid,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 200),
  notas text not null default '' check (char_length(notas) <= 2000),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'hecha')),
  prioridad smallint not null default 0 check (prioridad between 0 and 3),
  fecha date,
  hora time,
  hecha_en timestamptz,
  orden integer not null default 0,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  unique (id, user_id),
  -- Solo puede apuntar a listas y tareas del mismo dueño.
  foreign key (lista_id, user_id) references public.listas (id, user_id) on delete set null (lista_id),
  foreign key (padre_id, user_id) references public.tareas (id, user_id) on delete cascade,
  constraint hora_con_fecha check (hora is null or fecha is not null),
  constraint no_es_su_propio_padre check (padre_id is null or padre_id <> id)
);

create index tareas_pendientes_idx on public.tareas (user_id, estado, fecha);
create index tareas_lista_idx on public.tareas (lista_id);
create index tareas_padre_idx on public.tareas (padre_id);

-- ---------- Reglas de negocio ----------

-- Subtareas de un solo nivel, fecha de "hecha" automática y fecha de actualización.
create or replace function private.antes_de_guardar_tarea()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.padre_id is not null and exists (
    select 1 from public.tareas where id = new.padre_id and padre_id is not null
  ) then
    raise exception 'Las subtareas no pueden tener subtareas';
  end if;

  if new.estado = 'hecha' and (tg_op = 'INSERT' or old.estado <> 'hecha') then
    new.hecha_en = now();
  elsif new.estado <> 'hecha' then
    new.hecha_en = null;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizado = now();
  end if;
  return new;
end;
$$;

create trigger tareas_antes_de_guardar
  before insert or update on public.tareas
  for each row execute function private.antes_de_guardar_tarea();

-- Topes por persona: cuidan los 500 MB gratis de la base (30 personas).
create or replace function private.limitar_filas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tope integer := tg_argv[0]::integer;
  cantidad integer;
begin
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into cantidad using new.user_id;
  if cantidad >= tope then
    raise exception 'Llegaste al máximo de % en %', tope, tg_table_name;
  end if;
  return new;
end;
$$;

create trigger listas_tope before insert on public.listas
  for each row execute function private.limitar_filas('50');
create trigger tareas_tope before insert on public.tareas
  for each row execute function private.limitar_filas('5000');

-- ---------- RLS ----------
alter table public.listas enable row level security;
alter table public.tareas enable row level security;

create policy "listas_select_propias" on public.listas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "listas_insert_propias" on public.listas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "listas_update_propias" on public.listas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "listas_delete_propias" on public.listas
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "tareas_select_propias" on public.tareas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "tareas_insert_propias" on public.tareas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tareas_update_propias" on public.tareas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tareas_delete_propias" on public.tareas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- Privilegios mínimos ----------
revoke all on public.listas, public.tareas from anon;
-- El dueño, el id y las fechas automáticas no se cambian desde la app.
revoke update on public.listas, public.tareas from authenticated;
grant update (nombre, color, orden) on public.listas to authenticated;
grant update (lista_id, padre_id, titulo, notas, estado, prioridad, fecha, hora, orden) on public.tareas to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
