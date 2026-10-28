-- =========================================================
-- Orbe · Fase 5 (parte 2b) · Modo estudio (cursos y exámenes) y diario con estado de ánimo.
-- =========================================================

-- ---------- Modo estudio ----------
-- Un curso es una página marcada como tal: sus páginas internas son los temas.
alter table public.paginas add column curso boolean not null default false;
grant update (curso) on public.paginas to authenticated;

-- Un examen es una fecha importante ligada a la página del curso.
alter table public.fechas_importantes add column pagina_id uuid;
alter table public.fechas_importantes
  add constraint fechas_importantes_pagina_fkey foreign key (pagina_id, user_id)
  references public.paginas (id, user_id) on delete set null (pagina_id);
create index fechas_importantes_pagina_idx on public.fechas_importantes (pagina_id);

-- ---------- Diario con estado de ánimo ----------
create table public.diario (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  -- 1 = muy mal … 5 = muy bien (puede quedar vacío si solo escribiste).
  animo smallint check (animo between 1 and 5),
  pagina_id uuid,
  creado timestamptz not null default now(),
  primary key (user_id, fecha),
  foreign key (pagina_id, user_id) references public.paginas (id, user_id) on delete set null (pagina_id)
);
create index diario_pagina_idx on public.diario (pagina_id);

-- No se registran días que aún no llegan (hora de Lima).
create or replace function private.validar_dia_diario()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.fecha > (now() at time zone 'America/Lima')::date then
    raise exception 'Ese día aún no llega';
  end if;
  if new.fecha < date '2000-01-01' then
    raise exception 'Fecha no válida';
  end if;
  return new;
end;
$$;

create trigger diario_validar before insert or update on public.diario
  for each row execute function private.validar_dia_diario();
create trigger diario_tope before insert on public.diario
  for each row execute function private.limitar_filas('4000');

alter table public.diario enable row level security;
create policy "diario_select_propio" on public.diario
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "diario_insert_propio" on public.diario
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "diario_update_propio" on public.diario
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.diario from anon;
revoke update on public.diario from authenticated;
-- fecha va incluida porque el "upsert" de la app la reescribe con el mismo valor.
grant update (fecha, animo, pagina_id) on public.diario to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
-- El índice de títulos de páginas usa esta función con los permisos de quien guarda (ver fase_5_enlaces_permisos).
grant execute on function private.normalizar_titulo(text) to authenticated;
