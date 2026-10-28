-- =========================================================
-- Orbe · Fase 4 · Topes de uso de la IA (Gemini gratis), como en SaveWise
-- 15 usos al día por persona, tope por función, freno general de 480 al día para toda la app,
-- 10 s entre usos (15 s tras un error). Los errores no cuentan. Se reinicia a las 00:00 de Lima.
-- Todo se decide aquí, en la base: la app no puede saltarse los topes.
-- =========================================================

create table private.uso_ia (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  funcion text not null,
  dia date not null default (now() at time zone 'America/Lima')::date,
  semana date not null default date_trunc('week', now() at time zone 'America/Lima')::date,
  estado text not null default 'reservado' check (estado in ('reservado', 'ok', 'error')),
  creado timestamptz not null default now()
);
create index uso_ia_usuario_idx on private.uso_ia (user_id, creado desc);
create index uso_ia_dia_idx on private.uso_ia (dia);

insert into private.ajustes (clave, valor) values ('ia_tope_global', '480'), ('ia_tope_persona', '15')
on conflict (clave) do nothing;

/** Tope de cada función (por día, salvo el resumen semanal). La búsqueda por significado no usa Gemini. */
create or replace function private.topes_ia()
returns table (funcion text, tope integer, periodo text)
language sql
immutable
set search_path = ''
as $$
  values
    ('captura', 8, 'dia'), ('etiquetas', 5, 'dia'), ('dividir', 3, 'dia'), ('audio', 2, 'dia'),
    ('plan', 1, 'dia'), ('resumen_semanal', 1, 'semana'), ('preguntar', 5, 'dia'), ('mejorar', 5, 'dia'),
    ('resumir', 3, 'dia'), ('tarjetas', 2, 'dia'), ('foto', 2, 'dia');
$$;

/** Un uso cuenta si salió bien o si está en curso (reservado hace menos de 2 minutos). */
create or replace function private.uso_cuenta(estado text, creado timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select estado = 'ok' or (estado = 'reservado' and creado > now() - interval '2 minutes');
$$;

/**
 * Reserva un uso antes de llamar a Gemini. Si no se puede, lanza un error con un código:
 * ESPERA:<segundos>, TOPE_PERSONA, TOPE_FUNCION o TOPE_GLOBAL.
 */
create or replace function public.reservar_ia(p_funcion text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  hoy date := (now() at time zone 'America/Lima')::date;
  esta_semana date := date_trunc('week', now() at time zone 'America/Lima')::date;
  tope_funcion integer;
  periodo_funcion text;
  ultimo_uso timestamptz;
  ultimo_error timestamptz;
  nuevo bigint;
begin
  if yo is null then
    raise exception 'Sin sesión';
  end if;
  select t.tope, t.periodo into tope_funcion, periodo_funcion from private.topes_ia() t where t.funcion = p_funcion;
  if tope_funcion is null then
    raise exception 'Función desconocida';
  end if;

  -- Uno a la vez para toda la app: así el freno general nunca se pasa aunque lleguen dos pedidos juntos.
  perform pg_advisory_xact_lock(hashtext('orbe_uso_ia'));

  select max(u.creado) filter (where private.uso_cuenta(u.estado, u.creado)),
         max(u.creado) filter (where u.estado = 'error')
    into ultimo_uso, ultimo_error
    from private.uso_ia u where u.user_id = yo and u.creado > now() - interval '1 minute';
  if ultimo_uso > now() - interval '10 seconds' then
    raise exception 'ESPERA:%', ceil(extract(epoch from (ultimo_uso + interval '10 seconds' - now())))::integer;
  end if;
  if ultimo_error > now() - interval '15 seconds' then
    raise exception 'ESPERA:%', ceil(extract(epoch from (ultimo_error + interval '15 seconds' - now())))::integer;
  end if;

  if (select count(*) from private.uso_ia u where u.user_id = yo and u.dia = hoy and private.uso_cuenta(u.estado, u.creado))
     >= (select valor::integer from private.ajustes where clave = 'ia_tope_persona') then
    raise exception 'TOPE_PERSONA';
  end if;
  if (select count(*) from private.uso_ia u
      where u.user_id = yo and u.funcion = p_funcion and private.uso_cuenta(u.estado, u.creado)
        and (case when periodo_funcion = 'semana' then u.semana = esta_semana else u.dia = hoy end)) >= tope_funcion then
    raise exception 'TOPE_FUNCION';
  end if;
  if (select count(*) from private.uso_ia u where u.dia = hoy and private.uso_cuenta(u.estado, u.creado))
     >= (select valor::integer from private.ajustes where clave = 'ia_tope_global') then
    raise exception 'TOPE_GLOBAL';
  end if;

  insert into private.uso_ia (user_id, funcion) values (yo, p_funcion) returning id into nuevo;
  return nuevo;
end;
$$;

/** Marca cómo terminó el uso. Los errores no cuentan para los topes (solo activan la espera de 15 s). */
create or replace function public.terminar_ia(p_id bigint, p_ok boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.uso_ia set estado = case when p_ok then 'ok' else 'error' end
  where id = p_id and user_id = auth.uid() and estado = 'reservado';
$$;

/** Cuánto usaste hoy (y esta semana el resumen), para el medidor de Ajustes. */
create or replace function public.mi_uso_ia()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with usos as (
    select u.funcion, u.dia, u.semana from private.uso_ia u
    where u.user_id = auth.uid() and private.uso_cuenta(u.estado, u.creado)
      and u.semana >= date_trunc('week', now() at time zone 'America/Lima')::date - 7
  ),
  hoy as (select (now() at time zone 'America/Lima')::date as d, date_trunc('week', now() at time zone 'America/Lima')::date as s)
  select jsonb_build_object(
    'usados', (select count(*) from usos, hoy where usos.dia = hoy.d),
    'tope', (select valor::integer from private.ajustes where clave = 'ia_tope_persona'),
    'funciones', (
      select jsonb_agg(jsonb_build_object(
        'funcion', t.funcion, 'tope', t.tope, 'periodo', t.periodo,
        'usados', (select count(*) from usos, hoy where usos.funcion = t.funcion
                   and (case when t.periodo = 'semana' then usos.semana = hoy.s else usos.dia = hoy.d end))
      ))
      from private.topes_ia() t
    )
  );
$$;

alter table private.uso_ia enable row level security;
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.reservar_ia(text), public.terminar_ia(bigint, boolean), public.mi_uso_ia() from public, anon;
grant execute on function public.reservar_ia(text), public.terminar_ia(bigint, boolean), public.mi_uso_ia() to authenticated;
