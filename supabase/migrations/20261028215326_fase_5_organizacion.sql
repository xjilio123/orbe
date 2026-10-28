-- =========================================================
-- Orbe · Fase 5 (parte 3a) · Matriz urgente/importante y vistas guardadas.
-- =========================================================

-- Cuadrante de Eisenhower elegido a mano (1 hacer ya, 2 planificar, 3 delegar, 4 soltar).
-- Vacío = Orbe lo calcula solo con la prioridad y la fecha.
alter table public.tareas add column cuadrante smallint check (cuadrante between 1 and 4);
grant update (cuadrante) on public.tareas to authenticated;

-- Vistas guardadas de una lista: tabla con su orden y filtros, con un nombre.
create table public.vistas_guardadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lista_id uuid not null,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 40),
  -- { orden, estado, prioridad } (la app valida cada valor antes de usarlo).
  config jsonb not null default '{}' check (jsonb_typeof(config) = 'object' and pg_column_size(config) <= 2000),
  creado timestamptz not null default now(),
  foreign key (lista_id, user_id) references public.listas (id, user_id) on delete cascade
);
create index vistas_guardadas_lista_idx on public.vistas_guardadas (lista_id, user_id);

create trigger vistas_guardadas_tope before insert on public.vistas_guardadas
  for each row execute function private.limitar_filas('50');

alter table public.vistas_guardadas enable row level security;
create policy "vistas_guardadas_select_propias" on public.vistas_guardadas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "vistas_guardadas_insert_propias" on public.vistas_guardadas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "vistas_guardadas_delete_propias" on public.vistas_guardadas
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.vistas_guardadas from anon;
revoke update on public.vistas_guardadas from authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
-- El índice de títulos de páginas usa esta función con los permisos de quien guarda (ver fase_5_enlaces_permisos).
grant execute on function private.normalizar_titulo(text) to authenticated;
