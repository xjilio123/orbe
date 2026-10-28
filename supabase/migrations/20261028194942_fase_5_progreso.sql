-- =========================================================
-- Orbe · Fase 5 (parte 1) · Hábitos, metas del año, fechas importantes y sesiones de foco.
-- Mismas reglas que el resto: RLS en todo, llaves compuestas (id, user_id) para no apuntar
-- a datos de otra persona y topes por persona para cuidar la base gratis.
-- =========================================================

-- ---------- Hábitos ----------
create table public.habitos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  icono text not null default '✅' check (char_length(icono) between 1 and 8),
  color text not null default 'verde' check (color in ('indigo', 'azul', 'rojo', 'morado', 'naranja', 'verde', 'celeste')),
  -- Días por semana que quieres cumplirlo (7 = todos los días).
  dias_semana smallint not null default 7 check (dias_semana between 1 and 7),
  orden integer not null default 0,
  archivado boolean not null default false,
  creado timestamptz not null default now(),
  unique (id, user_id)
);
create index habitos_user_idx on public.habitos (user_id, orden);

-- Una fila por día cumplido. Desmarcar = borrar la fila.
create table public.habitos_marcas (
  habito_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  creado timestamptz not null default now(),
  primary key (habito_id, fecha),
  foreign key (habito_id, user_id) references public.habitos (id, user_id) on delete cascade
);
create index habitos_marcas_user_idx on public.habitos_marcas (user_id, fecha);

-- Solo se marcan días de hasta un mes atrás y nunca días futuros (en hora de Lima).
create or replace function private.validar_marca_habito()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  hoy date := (now() at time zone 'America/Lima')::date;
begin
  if new.fecha > hoy then
    raise exception 'No puedes marcar un día que aún no llega';
  end if;
  if new.fecha < hoy - 31 then
    raise exception 'Solo puedes marcar días del último mes';
  end if;
  return new;
end;
$$;

create trigger habitos_marcas_validar before insert on public.habitos_marcas
  for each row execute function private.validar_marca_habito();

-- ---------- Metas del año ----------
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  anio smallint not null check (anio between 2020 and 2100),
  -- 'numero': avanzas un contador (p. ej. 12 libros). 'lista': el avance son las tareas hechas de una lista.
  tipo text not null default 'numero' check (tipo in ('numero', 'lista')),
  lista_id uuid,
  objetivo numeric(12, 2) check (objetivo is null or (objetivo > 0 and objetivo <= 1000000000)),
  actual numeric(12, 2) not null default 0 check (actual >= 0 and actual <= 1000000000),
  unidad text not null default '' check (char_length(unidad) <= 20),
  color text not null default 'verde' check (color in ('indigo', 'azul', 'rojo', 'morado', 'naranja', 'verde', 'celeste')),
  orden integer not null default 0,
  creado timestamptz not null default now(),
  unique (id, user_id),
  foreign key (lista_id, user_id) references public.listas (id, user_id) on delete set null (lista_id),
  constraint meta_numero_con_objetivo check (tipo <> 'numero' or objetivo is not null)
);
create index metas_user_idx on public.metas (user_id, anio);
create index metas_lista_idx on public.metas (lista_id);

-- ---------- Fechas importantes (cuenta regresiva) ----------
create table public.fechas_importantes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 80),
  fecha date not null,
  icono text not null default '📅' check (char_length(icono) between 1 and 8),
  color text not null default 'naranja' check (color in ('indigo', 'azul', 'rojo', 'morado', 'naranja', 'verde', 'celeste')),
  creado timestamptz not null default now()
);
create index fechas_importantes_user_idx on public.fechas_importantes (user_id, fecha);

-- ---------- Sesiones de foco (Pomodoro) ----------
create table public.sesiones_foco (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tarea_id uuid,
  inicio timestamptz not null,
  minutos smallint not null check (minutos between 1 and 180),
  creado timestamptz not null default now(),
  foreign key (tarea_id, user_id) references public.tareas (id, user_id) on delete set null (tarea_id),
  -- Una sesión no puede empezar en el futuro ni durar más que el tiempo transcurrido.
  constraint sesion_razonable check (inicio <= creado + interval '1 minute' and inicio >= creado - interval '1 day')
);
create index sesiones_foco_user_idx on public.sesiones_foco (user_id, inicio);
create index sesiones_foco_tarea_idx on public.sesiones_foco (tarea_id);

-- ---------- Topes por persona ----------
create trigger habitos_tope before insert on public.habitos
  for each row execute function private.limitar_filas('30');
create trigger habitos_marcas_tope before insert on public.habitos_marcas
  for each row execute function private.limitar_filas('20000');
create trigger metas_tope before insert on public.metas
  for each row execute function private.limitar_filas('50');
create trigger fechas_importantes_tope before insert on public.fechas_importantes
  for each row execute function private.limitar_filas('100');
create trigger sesiones_foco_tope before insert on public.sesiones_foco
  for each row execute function private.limitar_filas('20000');

-- ---------- RLS ----------
alter table public.habitos enable row level security;
alter table public.habitos_marcas enable row level security;
alter table public.metas enable row level security;
alter table public.fechas_importantes enable row level security;
alter table public.sesiones_foco enable row level security;

create policy "habitos_select_propios" on public.habitos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "habitos_insert_propios" on public.habitos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "habitos_update_propios" on public.habitos
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "habitos_delete_propios" on public.habitos
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "habitos_marcas_select_propias" on public.habitos_marcas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "habitos_marcas_insert_propias" on public.habitos_marcas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "habitos_marcas_delete_propias" on public.habitos_marcas
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "metas_select_propias" on public.metas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "metas_insert_propias" on public.metas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "metas_update_propias" on public.metas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "metas_delete_propias" on public.metas
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "fechas_importantes_select_propias" on public.fechas_importantes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "fechas_importantes_insert_propias" on public.fechas_importantes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "fechas_importantes_delete_propias" on public.fechas_importantes
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "sesiones_foco_select_propias" on public.sesiones_foco
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "sesiones_foco_insert_propias" on public.sesiones_foco
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "sesiones_foco_delete_propias" on public.sesiones_foco
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- Privilegios mínimos ----------
revoke all on public.habitos, public.habitos_marcas, public.metas, public.fechas_importantes, public.sesiones_foco from anon;
revoke update on public.habitos, public.habitos_marcas, public.metas, public.fechas_importantes, public.sesiones_foco from authenticated;
grant update (nombre, icono, color, dias_semana, orden, archivado) on public.habitos to authenticated;
grant update (titulo, objetivo, actual, unidad, color, orden) on public.metas to authenticated;

-- ---------- Lecturas para las pantallas (con RLS: cada quien ve solo lo suyo) ----------

-- Hábitos con lo marcado esta semana y la racha actual.
-- Diario (7 días): días seguidos hasta hoy (o hasta ayer, si hoy aún no lo marcas).
-- Semanal (1 a 6 días): semanas seguidas en que llegaste a tu meta.
create or replace function public.mis_habitos(hoy date)
returns table (
  id uuid,
  nombre text,
  icono text,
  color text,
  dias_semana smallint,
  hecho_hoy boolean,
  marcas_semana date[],
  racha integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    h.id, h.nombre, h.icono, h.color, h.dias_semana, d.hecho_hoy, d.marcas_semana,
    case when h.dias_semana = 7 then r.diaria else r.semanal end
  from public.habitos h
  cross join lateral (
    select
      exists (select 1 from public.habitos_marcas m where m.habito_id = h.id and m.fecha = hoy) as hecho_hoy,
      array(
        select m.fecha from public.habitos_marcas m
        where m.habito_id = h.id and m.fecha >= date_trunc('week', hoy::timestamp)::date and m.fecha <= hoy
        order by m.fecha
      ) as marcas_semana,
      date_trunc('week', hoy::timestamp)::date as lunes
  ) d
  cross join lateral (
    select
      (
        select count(*)::integer from (
          select m.fecha, row_number() over (order by m.fecha desc)::integer as n
          from public.habitos_marcas m
          where m.habito_id = h.id and m.fecha <= hoy
        ) x
        where x.fecha = (case when d.hecho_hoy then hoy else hoy - 1 end) - (x.n - 1)
      ) as diaria,
      (
        select count(*)::integer from (
          select s.semana, row_number() over (order by s.semana desc)::integer as n
          from (
            select date_trunc('week', m.fecha::timestamp)::date as semana
            from public.habitos_marcas m
            where m.habito_id = h.id and m.fecha <= hoy
            group by 1
            having count(*) >= h.dias_semana
          ) s
        ) x
        where x.semana = (case when cardinality(d.marcas_semana) >= h.dias_semana then d.lunes else d.lunes - 7 end) - 7 * (x.n - 1)
      ) as semanal
  ) r
  where not h.archivado
  order by h.orden, h.creado;
$$;

-- Metas de un año con su avance. Las de tipo 'lista' cuentan las tareas (sin subtareas ni papelera).
create or replace function public.mis_metas(p_anio integer)
returns table (
  id uuid,
  titulo text,
  tipo text,
  lista_id uuid,
  lista text,
  objetivo numeric,
  actual numeric,
  unidad text,
  color text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    m.id, m.titulo, m.tipo, m.lista_id, l.nombre,
    case when m.tipo = 'lista' then (
      select count(*)::numeric from public.tareas t
      where t.lista_id = m.lista_id and t.padre_id is null and t.borrado_en is null
    ) else m.objetivo end,
    case when m.tipo = 'lista' then (
      select count(*)::numeric from public.tareas t
      where t.lista_id = m.lista_id and t.padre_id is null and t.borrado_en is null and t.estado = 'hecha'
    ) else m.actual end,
    m.unidad, m.color
  from public.metas m
  left join public.listas l on l.id = m.lista_id
  where m.anio = p_anio
  order by m.orden, m.creado;
$$;

-- Tareas hechas y minutos de foco por semana (de lunes a domingo, hora de Lima), de la más antigua a la actual.
create or replace function public.mis_estadisticas(p_semanas integer default 8)
returns table (semana date, tareas integer, minutos integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with semanas as (
    select (date_trunc('week', (now() at time zone 'America/Lima'))::date - 7 * g)::date as lunes
    from generate_series(0, least(greatest(p_semanas, 1), 26) - 1) as g
  )
  select
    s.lunes,
    (
      select count(*)::integer from public.tareas t
      where t.estado = 'hecha' and t.borrado_en is null
        and t.hecha_en >= (s.lunes::timestamp at time zone 'America/Lima')
        and t.hecha_en < ((s.lunes + 7)::timestamp at time zone 'America/Lima')
    ),
    (
      select coalesce(sum(f.minutos), 0)::integer from public.sesiones_foco f
      where f.inicio >= (s.lunes::timestamp at time zone 'America/Lima')
        and f.inicio < ((s.lunes + 7)::timestamp at time zone 'America/Lima')
    )
  from semanas s
  order by s.lunes;
$$;

revoke all on function public.mis_habitos(date), public.mis_metas(integer), public.mis_estadisticas(integer) from public, anon;
grant execute on function public.mis_habitos(date), public.mis_metas(integer), public.mis_estadisticas(integer) to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
