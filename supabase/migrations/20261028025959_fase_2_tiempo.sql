-- =========================================================
-- Orbe · Fase 2 · Tiempo
-- 1. Tareas que se repiten (la siguiente se crea sola al marcar la actual como hecha).
-- 2. Avisos push a la hora exacta: pg_cron revisa cada minuto y, solo si hay algo que avisar,
--    llama a la Edge Function "avisos" con un secreto guardado en Vault (nunca en el repositorio).
-- 3. Google Calendar de solo lectura con la dirección secreta iCal (solo dominios de Google).
-- =========================================================

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ---------- 1. Repetición y aviso en las tareas ----------
alter table public.tareas
  add column repetir text check (repetir in ('diaria', 'laborables', 'semanal', 'mensual', 'anual')),
  -- Minutos antes de la hora de la tarea. null = sin aviso. Por defecto, a la hora exacta.
  add column aviso smallint default 0 check (aviso in (0, 5, 15, 30, 60, 1440)),
  add column avisar_en timestamptz,
  add column avisado_en timestamptz,
  add constraint repetir_con_fecha check (repetir is null or fecha is not null),
  add constraint repetir_sin_subtareas check (repetir is null or padre_id is null);

-- Solo las tareas que aún deben avisar: el cron las encuentra al instante.
create index tareas_por_avisar_idx on public.tareas (avisar_en) where avisado_en is null and avisar_en is not null;

/** Siguiente fecha de una tarea que se repite, siempre posterior a hoy (Lima). */
create or replace function private.siguiente_fecha(p_fecha date, p_repetir text, p_hoy date)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  f date := p_fecha;
  i integer := 0;
begin
  loop
    i := i + 1;
    f := case p_repetir
      when 'diaria' then f + 1
      when 'laborables' then f + case extract(isodow from f)::integer when 5 then 3 when 6 then 2 else 1 end
      when 'semanal' then f + 7
      -- Mes y año se cuentan desde la fecha original: el 31 pasa a 28/29/30 sin ir corriéndose.
      when 'mensual' then (p_fecha + make_interval(months => i))::date
      when 'anual' then (p_fecha + make_interval(years => i))::date
    end;
    exit when f is null or f > p_hoy or i >= 5000;
  end loop;
  return f;
end;
$$;

-- Reemplaza la regla de la Fase 1: suma la repetición y la hora del aviso.
create or replace function private.antes_de_guardar_tarea()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  nueva uuid;
begin
  if new.padre_id is not null and exists (
    select 1 from public.tareas where id = new.padre_id and padre_id is not null
  ) then
    raise exception 'Las subtareas no pueden tener subtareas';
  end if;

  if new.estado = 'hecha' and (tg_op = 'INSERT' or old.estado <> 'hecha') then
    new.hecha_en = now();
    -- Tarea que se repite: nace la siguiente (con sus subtareas sin marcar) y esta deja de repetirse.
    -- Así, desmarcarla y volver a marcarla no crea duplicados.
    if tg_op = 'UPDATE' and new.repetir is not null and new.fecha is not null then
      insert into public.tareas (user_id, lista_id, titulo, notas, prioridad, fecha, hora, aviso, repetir, orden)
      values (
        new.user_id, new.lista_id, new.titulo, new.notas, new.prioridad,
        private.siguiente_fecha(new.fecha, new.repetir, (now() at time zone 'America/Lima')::date),
        new.hora, new.aviso, new.repetir, new.orden
      )
      returning id into nueva;
      insert into public.tareas (user_id, padre_id, titulo, notas, prioridad)
        select user_id, nueva, titulo, notas, prioridad from public.tareas where padre_id = new.id order by creado;
      new.repetir = null;
    end if;
  elsif new.estado <> 'hecha' then
    new.hecha_en = null;
  end if;

  -- Hora del aviso (Lima). Las subtareas y las tareas hechas no avisan.
  if new.fecha is not null and new.hora is not null and new.aviso is not null
     and new.estado <> 'hecha' and new.padre_id is null then
    new.avisar_en = ((new.fecha + new.hora) at time zone 'America/Lima') - make_interval(mins => new.aviso);
  else
    new.avisar_en = null;
  end if;
  if tg_op = 'INSERT' or new.avisar_en is distinct from old.avisar_en then
    -- Si la hora del aviso ya pasó al guardar, no se avisa tarde.
    new.avisado_en = case when new.avisar_en < now() - interval '1 minute' then now() end;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizado = now();
  end if;
  return new;
end;
$$;

grant update (repetir, aviso) on public.tareas to authenticated;

-- Las tareas pendientes que ya tenían hora reciben su aviso desde ahora (las pasadas no avisan tarde).
update public.tareas set aviso = aviso where hora is not null and estado <> 'hecha' and padre_id is null;

-- ---------- 2. Avisos push ----------

-- Ajustes del sistema que no son secretos (URL de la función, clave pública VAPID).
create table private.ajustes (
  clave text primary key,
  valor text not null
);
insert into private.ajustes (clave, valor) values
  ('url_avisos', 'https://etgyhcwqkxpkjjpgzxxz.supabase.co/functions/v1/avisos');

-- Secreto entre pg_cron y la Edge Function: se genera aquí, al azar, y vive solo en Vault.
select vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'hex'),
  'orbe_avisos',
  'Secreto que pg_cron envía a la Edge Function avisos'
);

-- Un registro por teléfono o navegador donde activaste los avisos.
create table public.suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Solo servicios de push conocidos (Apple, Google, Mozilla, Microsoft): la función nunca llama a otra dirección.
  endpoint text not null unique check (
    char_length(endpoint) <= 1000 and endpoint ~ '^https://(web\.push\.apple\.com|fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)/'
  ),
  p256dh text not null check (p256dh ~ '^[A-Za-z0-9_-]{40,200}$'),
  auth text not null check (auth ~ '^[A-Za-z0-9_-]{10,100}$'),
  dispositivo text not null default '' check (char_length(dispositivo) <= 80),
  creado timestamptz not null default now()
);
create index suscripciones_push_usuario_idx on public.suscripciones_push (user_id);

create trigger suscripciones_push_tope before insert on public.suscripciones_push
  for each row execute function private.limitar_filas('10');

alter table public.suscripciones_push enable row level security;
create policy "suscripciones_select_propias" on public.suscripciones_push
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "suscripciones_delete_propias" on public.suscripciones_push
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.suscripciones_push from anon;
revoke insert, update on public.suscripciones_push from authenticated;

-- Avisos que no son de tareas (prueba, alertas de espacio). Quedan marcados al enviarse.
create table private.cola_avisos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null check (char_length(titulo) <= 120),
  cuerpo text not null default '' check (char_length(cuerpo) <= 240),
  url text not null default '/' check (url ~ '^/[A-Za-z0-9/_?=&-]*$'),
  creado timestamptz not null default now(),
  enviado_en timestamptz
);
create index cola_avisos_pendientes_idx on private.cola_avisos (id) where enviado_en is null;

-- Quién recibe las alertas del sistema (se carga a mano, nunca desde el repositorio).
create table private.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.perfiles
  add column ultima_prueba_push timestamptz,
  add column calendario_ics text check (
    calendario_ics is null
    or calendario_ics ~ '^https://calendar\.google\.com/calendar/ical/[A-Za-z0-9%._@+-]{3,200}/(public|private-[A-Za-z0-9]{16,64})/basic\.ics$'
  );
grant update (calendario_ics) on public.perfiles to authenticated;

/** Llama a la Edge Function solo si hay algo que avisar (así casi nunca se usa). */
create or replace function private.disparar_avisos()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.tareas where avisado_en is null and avisar_en <= now())
     or exists (select 1 from private.cola_avisos where enviado_en is null) then
    perform net.http_post(
      url := (select valor from private.ajustes where clave = 'url_avisos'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-orbe-secreto', (select decrypted_secret from vault.decrypted_secrets where name = 'orbe_avisos')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 15000
    );
  end if;
end;
$$;

/**
 * Lo que la Edge Function debe enviar ahora. Marca cada aviso como enviado en la misma operación,
 * así dos llamadas seguidas nunca mandan el mismo aviso dos veces.
 */
create or replace function private.tomar_avisos()
returns table (user_id uuid, titulo text, cuerpo text, url text, etiqueta text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with tomadas as (
    update public.tareas t set avisado_en = now()
    where t.avisado_en is null and t.avisar_en <= now()
    returning t.id, t.user_id, t.titulo, t.hora, t.aviso, t.avisar_en
  )
  select
    tomadas.user_id,
    tomadas.titulo,
    case
      when tomadas.avisar_en < now() - interval '30 minutes' then 'Aviso atrasado · '
      when tomadas.aviso = 0 then 'Ahora · '
      when tomadas.aviso = 1440 then 'Mañana · '
      when tomadas.aviso = 60 then 'En 1 hora · '
      else 'En ' || tomadas.aviso || ' min · '
    end
      || ltrim(to_char(tomadas.hora, 'HH12:MI'), '0')
      || case when tomadas.hora < '12:00' then ' a. m.' else ' p. m.' end,
    '/tareas/' || tomadas.id,
    'tarea-' || tomadas.id
  from tomadas;

  return query
  with cola as (
    update private.cola_avisos c set enviado_en = now() where c.enviado_en is null returning c.*
  )
  select cola.user_id, cola.titulo, cola.cuerpo, cola.url, 'sistema-' || cola.id from cola;
end;
$$;

/** El teléfono guarda su suscripción. Si el mismo teléfono era de otra cuenta, pasa a esta. */
create or replace function public.guardar_suscripcion_push(p_endpoint text, p_p256dh text, p_auth text, p_dispositivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sin sesión';
  end if;
  insert into public.suscripciones_push (user_id, endpoint, p256dh, auth, dispositivo)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(coalesce(p_dispositivo, ''), 80))
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        dispositivo = excluded.dispositivo, creado = now();
end;
$$;

/** Aviso de prueba: uno por minuto como máximo y solo a tus propios dispositivos. */
create or replace function public.probar_avisos()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
begin
  if yo is null then
    raise exception 'Sin sesión';
  end if;
  if not exists (select 1 from public.suscripciones_push where user_id = yo) then
    return 'sin_dispositivos';
  end if;
  update public.perfiles set ultima_prueba_push = now()
  where id = yo and (ultima_prueba_push is null or ultima_prueba_push < now() - interval '1 minute');
  if not found then
    return 'espera';
  end if;
  insert into private.cola_avisos (user_id, titulo, cuerpo, url)
  values (yo, 'Orbe', 'Los avisos funcionan en este dispositivo.', '/ajustes');
  perform private.disparar_avisos();
  return 'enviado';
end;
$$;

/** Clave pública VAPID (no es secreta): el teléfono la necesita para suscribirse. */
create or replace function public.clave_publica_push()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select valor from private.ajustes where clave = 'vapid_publica';
$$;

-- ---------- Alerta semanal de espacio (70 % del plan gratis) ----------
create or replace function private.revisar_espacio()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base bigint := pg_database_size(current_database());
  archivos bigint := coalesce((select sum((metadata ->> 'size')::bigint) from storage.objects), 0);
  limite_base bigint := 500 * 1024 * 1024;
  limite_archivos bigint := 1024 * 1024 * 1024;
begin
  if base > limite_base * 0.7 or archivos > limite_archivos * 0.7 then
    insert into private.cola_avisos (user_id, titulo, cuerpo, url)
    select a.user_id, 'Orbe: espacio al ' || greatest(round(100.0 * base / limite_base), round(100.0 * archivos / limite_archivos)) || ' %',
      'Base ' || pg_size_pretty(base) || ' de 500 MB · archivos ' || pg_size_pretty(archivos) || ' de 1 GB.', '/ajustes'
    from private.administradores a;
  end if;
end;
$$;

-- Solo el sistema ejecuta estas funciones; la app usa únicamente las tres públicas.
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.guardar_suscripcion_push(text, text, text, text) from public, anon;
revoke all on function public.probar_avisos() from public, anon;
revoke all on function public.clave_publica_push() from public, anon;
grant execute on function public.guardar_suscripcion_push(text, text, text, text) to authenticated;
grant execute on function public.probar_avisos() to authenticated;
grant execute on function public.clave_publica_push() to authenticated;

-- Cada minuto (solo llama a la función si hay avisos) y los lunes a las 9:00 de Lima (14:00 UTC).
select cron.schedule('orbe-avisos', '* * * * *', 'select private.disparar_avisos()');
select cron.schedule('orbe-espacio', '0 14 * * 1', 'select private.revisar_espacio()');
