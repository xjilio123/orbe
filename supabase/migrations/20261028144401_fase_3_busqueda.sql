-- =========================================================
-- Orbe · Fase 3 · Búsqueda de texto completo (tareas y páginas)
-- Sin tildes ni mayúsculas ("canción" = "cancion"), por prefijo ("presu" encuentra "presupuesto")
-- y solo dentro de lo tuyo. Índice GIN: rápido aunque tengas miles de notas.
-- =========================================================

create extension if not exists unaccent with schema extensions;

/** Minúsculas y sin tildes. */
create or replace function private.sin_tildes(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, '')));
$$;

/** Texto plano de los bloques de una página (máximo 200 KB para el índice). */
create or replace function private.texto_de_bloques(contenido jsonb)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select left(coalesce(string_agg(b ->> 'texto', ' '), ''), 200000)
  from jsonb_array_elements(case when jsonb_typeof(contenido) = 'array' then contenido else '[]'::jsonb end) b;
$$;

alter table public.tareas add column busqueda tsvector;
alter table public.paginas add column busqueda tsvector;

create or replace function private.indexar_tarea()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.busqueda :=
    setweight(to_tsvector('simple', private.sin_tildes(new.titulo)), 'A')
    || setweight(to_tsvector('simple', private.sin_tildes(new.notas)), 'B');
  return new;
end;
$$;

create or replace function private.indexar_pagina()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.busqueda :=
    setweight(to_tsvector('simple', private.sin_tildes(new.titulo)), 'A')
    || setweight(to_tsvector('simple', private.sin_tildes(private.texto_de_bloques(new.contenido))), 'B');
  return new;
end;
$$;

create trigger tareas_indexar before insert or update of titulo, notas on public.tareas
  for each row execute function private.indexar_tarea();
create trigger paginas_indexar before insert or update of titulo, contenido on public.paginas
  for each row execute function private.indexar_pagina();

-- Las páginas solo cambian su "actualizado" cuando cambia lo que escribiste (título, ícono, texto o lugar):
-- marcar favorita, plantilla, mandarla a la papelera o reindexarla ya no la sube en "recientes".
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

  if tg_op = 'UPDATE' and (new.titulo, new.icono, new.contenido, new.padre_id) is distinct from (old.titulo, old.icono, old.contenido, old.padre_id) then
    new.actualizado = now();
  end if;
  return new;
end;
$$;

-- Indexa lo que ya existe (solo lo que aún no tiene índice).
update public.tareas
  set busqueda = setweight(to_tsvector('simple', private.sin_tildes(titulo)), 'A')
    || setweight(to_tsvector('simple', private.sin_tildes(notas)), 'B')
  where busqueda is null;
update public.paginas
  set busqueda = setweight(to_tsvector('simple', private.sin_tildes(titulo)), 'A')
    || setweight(to_tsvector('simple', private.sin_tildes(private.texto_de_bloques(contenido))), 'B')
  where busqueda is null;

create index tareas_busqueda_idx on public.tareas using gin (busqueda) where borrado_en is null;
create index paginas_busqueda_idx on public.paginas using gin (busqueda) where borrado_en is null;

/**
 * Busca en tus tareas y páginas. Cada palabra se busca por prefijo y todas deben aparecer.
 * Corre con permisos del sistema pero SIEMPRE filtra por tu usuario (auth.uid()).
 */
create or replace function public.buscar(consulta text)
returns table (tipo text, id uuid, titulo text, icono text, detalle text, rango real)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  palabras text[];
  q tsquery;
begin
  if yo is null then
    raise exception 'Sin sesión';
  end if;
  select array_agg(p) into palabras
  from (
    select p from unnest(regexp_split_to_array(private.sin_tildes(left(coalesce(consulta, ''), 100)), '[^a-z0-9]+')) p
    where p <> '' limit 6
  ) s;
  if palabras is null then
    return;
  end if;
  q := to_tsquery('simple', array_to_string(array(select quote_literal(p) || ':*' from unnest(palabras) p), ' & '));

  return query
  (
    select 'pagina'::text, pg.id, pg.titulo, pg.icono,
      coalesce((
        select left(b ->> 'texto', 140) from jsonb_array_elements(pg.contenido) b
        where private.sin_tildes(b ->> 'texto') like '%' || palabras[1] || '%' limit 1
      ), ''),
      ts_rank(pg.busqueda, q)
    from public.paginas pg
    where pg.user_id = yo and pg.borrado_en is null and pg.busqueda @@ q
    order by ts_rank(pg.busqueda, q) desc, pg.actualizado desc
    limit 15
  )
  union all
  (
    select 'tarea'::text, t.id, t.titulo, ''::text, left(t.notas, 140), ts_rank(t.busqueda, q)
    from public.tareas t
    where t.user_id = yo and t.borrado_en is null and t.busqueda @@ q
    order by t.estado = 'hecha', ts_rank(t.busqueda, q) desc, t.creado desc
    limit 15
  );
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.buscar(text) from public, anon;
grant execute on function public.buscar(text) to authenticated;
