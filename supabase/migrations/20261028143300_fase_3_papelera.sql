-- =========================================================
-- Orbe · Fase 3 · Papelera (30 días), historial de páginas (10 versiones) y plantillas
-- Borrar ya no es para siempre: se marca con borrado_en y la app lo oculta. A los 30 días
-- la app lo borra de verdad (también sus archivos) la próxima vez que abres la papelera.
-- =========================================================

-- ---------- Papelera ----------
alter table public.tareas add column borrado_en timestamptz;
alter table public.paginas
  add column borrado_en timestamptz,
  add column plantilla boolean not null default false;

create index tareas_papelera_idx on public.tareas (user_id, borrado_en) where borrado_en is not null;
create index paginas_papelera_idx on public.paginas (user_id, borrado_en) where borrado_en is not null;

grant update (borrado_en) on public.tareas to authenticated;
grant update (borrado_en, plantilla) on public.paginas to authenticated;

-- Una tarea en la papelera no avisa. Igual que la regla de la Fase 2, más esa condición.
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
    if tg_op = 'UPDATE' and new.repetir is not null and new.fecha is not null then
      insert into public.tareas (user_id, lista_id, titulo, notas, prioridad, fecha, hora, aviso, repetir, orden)
      values (
        new.user_id, new.lista_id, new.titulo, new.notas, new.prioridad,
        private.siguiente_fecha(new.fecha, new.repetir, (now() at time zone 'America/Lima')::date),
        new.hora, new.aviso, new.repetir, new.orden
      )
      returning id into nueva;
      insert into public.tareas (user_id, padre_id, titulo, notas, prioridad)
        select user_id, nueva, titulo, notas, prioridad from public.tareas
        where padre_id = new.id and borrado_en is null order by creado;
      new.repetir = null;
    end if;
  elsif new.estado <> 'hecha' then
    new.hecha_en = null;
  end if;

  if new.fecha is not null and new.hora is not null and new.aviso is not null
     and new.estado <> 'hecha' and new.padre_id is null and new.borrado_en is null then
    new.avisar_en = ((new.fecha + new.hora) at time zone 'America/Lima') - make_interval(mins => new.aviso);
  else
    new.avisar_en = null;
  end if;
  if tg_op = 'INSERT' or new.avisar_en is distinct from old.avisar_en then
    new.avisado_en = case when new.avisar_en < now() - interval '1 minute' then now() end;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizado = now();
  end if;
  return new;
end;
$$;

-- ---------- Historial: las últimas 10 versiones de cada página ----------
-- 10 huecos fijos por página (0 a 9) que se van reutilizando: nunca crece más que eso.
create table public.versiones_pagina (
  pagina_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  hueco smallint not null check (hueco between 0 and 9),
  titulo text not null,
  icono text not null,
  contenido jsonb not null,
  creado timestamptz not null default now(),
  primary key (pagina_id, hueco),
  foreign key (pagina_id, user_id) references public.paginas (id, user_id) on delete cascade
);
create index versiones_pagina_usuario_idx on public.versiones_pagina (user_id);

alter table public.versiones_pagina enable row level security;
create policy "versiones_select_propias" on public.versiones_pagina
  for select to authenticated using ((select auth.uid()) = user_id);
-- Solo la base escribe versiones (con la regla de abajo); la app solo las lee.
revoke all on public.versiones_pagina from anon;
revoke insert, update, delete on public.versiones_pagina from authenticated;

/**
 * Antes de cambiar el texto de una página, guarda cómo estaba si la última versión tiene más de 10 minutos.
 * Así el guardado automático (cada pocos segundos) no llena el historial. Tope: 8 MB de versiones por persona.
 */
create or replace function private.guardar_version_pagina()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ultimo_hueco smallint;
  ultimo_creado timestamptz;
  usado bigint;
begin
  if old.contenido is not distinct from new.contenido and old.titulo is not distinct from new.titulo then
    return new;
  end if;
  -- Una página recién creada (vacía) no necesita versión.
  if old.titulo = '' and old.contenido = '[]'::jsonb then
    return new;
  end if;
  select hueco, creado into ultimo_hueco, ultimo_creado from public.versiones_pagina
    where pagina_id = old.id order by creado desc limit 1;
  if ultimo_creado > now() - interval '10 minutes' then
    return new;
  end if;
  select coalesce(sum(pg_column_size(contenido)), 0) into usado from public.versiones_pagina where user_id = old.user_id;
  if usado + pg_column_size(old.contenido) > 8388608 then
    return new;
  end if;
  insert into public.versiones_pagina (pagina_id, user_id, hueco, titulo, icono, contenido, creado)
  values (old.id, old.user_id, coalesce((ultimo_hueco + 1) % 10, 0), old.titulo, old.icono, old.contenido, now())
  on conflict (pagina_id, hueco) do update
    set titulo = excluded.titulo, icono = excluded.icono, contenido = excluded.contenido, creado = excluded.creado;
  return new;
end;
$$;

create trigger paginas_guardar_version
  before update of titulo, contenido on public.paginas
  for each row execute function private.guardar_version_pagina();

revoke all on all functions in schema private from public, anon, authenticated;
