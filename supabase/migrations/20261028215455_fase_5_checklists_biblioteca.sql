-- =========================================================
-- Orbe · Fase 5 (parte 3b) · Checklists reutilizables (mercado, maleta) y biblioteca (libros, series…).
-- =========================================================

-- ---------- Checklists ----------
create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  icono text not null default '🛒' check (char_length(icono) between 1 and 8),
  color text not null default 'verde' check (color in ('indigo', 'azul', 'rojo', 'morado', 'naranja', 'verde', 'celeste')),
  orden integer not null default 0,
  creado timestamptz not null default now(),
  unique (id, user_id)
);
create index checklists_user_idx on public.checklists (user_id, orden);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  checklist_id uuid not null,
  texto text not null check (char_length(btrim(texto)) between 1 and 200),
  hecho boolean not null default false,
  orden integer not null default 0,
  creado timestamptz not null default now(),
  foreign key (checklist_id, user_id) references public.checklists (id, user_id) on delete cascade
);
create index checklist_items_lista_idx on public.checklist_items (checklist_id, user_id, orden);

create trigger checklists_tope before insert on public.checklists
  for each row execute function private.limitar_filas('50');
create trigger checklist_items_tope before insert on public.checklist_items
  for each row execute function private.limitar_filas('3000');

-- ---------- Biblioteca ----------
create table public.biblioteca (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 200),
  autor text not null default '' check (char_length(autor) <= 120),
  tipo text not null default 'libro' check (tipo in ('libro', 'serie', 'pelicula', 'curso', 'podcast')),
  estado text not null default 'quiero' check (estado in ('quiero', 'en_curso', 'terminado', 'abandonado')),
  -- Páginas, episodios o lecciones: por dónde vas y cuántas tiene.
  progreso integer not null default 0 check (progreso between 0 and 100000),
  total integer check (total is null or total between 1 and 100000),
  nota smallint check (nota between 1 and 5),
  resena text not null default '' check (char_length(resena) <= 2000),
  terminado_en date,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index biblioteca_user_idx on public.biblioteca (user_id, estado, actualizado desc);

-- Al terminar algo se anota la fecha; al avanzar se toca "actualizado" (para ordenar lo reciente).
create or replace function private.antes_de_guardar_biblioteca()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'terminado' and new.terminado_en is null then
    new.terminado_en := (now() at time zone 'America/Lima')::date;
  elsif new.estado <> 'terminado' then
    new.terminado_en := null;
  end if;
  if new.estado = 'terminado' and new.total is not null then
    new.progreso := new.total;
  end if;
  new.actualizado := now();
  return new;
end;
$$;

create trigger biblioteca_antes_de_guardar before insert or update on public.biblioteca
  for each row execute function private.antes_de_guardar_biblioteca();
create trigger biblioteca_tope before insert on public.biblioteca
  for each row execute function private.limitar_filas('2000');

-- ---------- RLS ----------
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.biblioteca enable row level security;

create policy "checklists_select_propias" on public.checklists for select to authenticated using ((select auth.uid()) = user_id);
create policy "checklists_insert_propias" on public.checklists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "checklists_update_propias" on public.checklists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "checklists_delete_propias" on public.checklists for delete to authenticated using ((select auth.uid()) = user_id);

create policy "checklist_items_select_propios" on public.checklist_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "checklist_items_insert_propios" on public.checklist_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "checklist_items_update_propios" on public.checklist_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "checklist_items_delete_propios" on public.checklist_items for delete to authenticated using ((select auth.uid()) = user_id);

create policy "biblioteca_select_propia" on public.biblioteca for select to authenticated using ((select auth.uid()) = user_id);
create policy "biblioteca_insert_propia" on public.biblioteca for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "biblioteca_update_propia" on public.biblioteca for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "biblioteca_delete_propia" on public.biblioteca for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- Privilegios mínimos ----------
revoke all on public.checklists, public.checklist_items, public.biblioteca from anon;
revoke update on public.checklists, public.checklist_items, public.biblioteca from authenticated;
grant update (nombre, icono, color, orden) on public.checklists to authenticated;
grant update (texto, hecho, orden) on public.checklist_items to authenticated;
grant update (titulo, autor, tipo, estado, progreso, total, nota, resena) on public.biblioteca to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
-- El índice de títulos de páginas usa esta función con los permisos de quien guarda (ver fase_5_enlaces_permisos).
grant execute on function private.normalizar_titulo(text) to authenticated;
