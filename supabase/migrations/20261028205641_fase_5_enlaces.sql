-- =========================================================
-- Orbe · Fase 5 (parte 2) · Enlaces entre notas ([[Título]]), backlinks y mapa de notas.
-- Cada página guarda los títulos a los que enlaza (normalizados: sin tildes, en minúsculas).
-- La base los calcula sola al guardar: la app no puede escribirlos.
-- =========================================================

-- "  Window   Functions " → "window functions"; "Inglés" → "ingles".
create or replace function private.normalizar_titulo(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(private.sin_tildes(texto), '\s+', ' ', 'g'));
$$;

-- Títulos enlazados con [[Título]] o [[Título|texto visible]] en los bloques de texto (no en código).
create or replace function private.enlaces_de_bloques(contenido jsonb)
returns text[]
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(array(
    select distinct private.normalizar_titulo(m.grupos[1])
    from jsonb_array_elements(case when jsonb_typeof(contenido) = 'array' then contenido else '[]'::jsonb end) as b
    cross join lateral regexp_matches(coalesce(b ->> 'texto', ''), '\[\[([^\[\]|]{1,200})(?:\|[^\[\]]*)?\]\]', 'g') as m(grupos)
    where coalesce(b ->> 'tipo', '') <> 'codigo'
      and private.normalizar_titulo(m.grupos[1]) <> ''
    limit 200
  ), '{}');
$$;

alter table public.paginas add column enlaces text[] not null default '{}';
create index paginas_enlaces_idx on public.paginas using gin (enlaces);
create index paginas_titulo_normal_idx on public.paginas (user_id, private.normalizar_titulo(titulo));

create or replace function private.calcular_enlaces()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.enlaces := private.enlaces_de_bloques(new.contenido);
  return new;
end;
$$;

create trigger paginas_enlaces before insert or update of contenido on public.paginas
  for each row execute function private.calcular_enlaces();

-- Páginas que ya tenían [[enlaces]] antes de esta versión.
update public.paginas
  set enlaces = private.enlaces_de_bloques(contenido)
  where enlaces = '{}' and contenido::text like '%[[%';

-- Backlinks: páginas tuyas que enlazan a esta (por su título).
create or replace function public.paginas_que_enlazan(p_id uuid)
returns table (id uuid, titulo text, icono text)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.titulo, q.icono
  from public.paginas p
  join public.paginas q
    on q.user_id = p.user_id
   and q.enlaces @> array[private.normalizar_titulo(p.titulo)]
  where p.id = p_id
    and p.user_id = (select auth.uid())
    and q.id <> p.id
    and q.borrado_en is null
    and private.normalizar_titulo(p.titulo) <> ''
  order by q.actualizado desc
  limit 100;
$$;

-- Todas tus conexiones por [[enlace]] (para el mapa de notas).
create or replace function public.mis_enlaces()
returns table (origen uuid, destino uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct p.id, q.id
  from public.paginas p
  cross join lateral unnest(p.enlaces) as e(titulo)
  join public.paginas q
    on q.user_id = p.user_id
   and private.normalizar_titulo(q.titulo) = e.titulo
   and q.borrado_en is null
  where p.user_id = (select auth.uid())
    and p.borrado_en is null
    and q.id <> p.id
  limit 5000;
$$;

revoke all on function public.paginas_que_enlazan(uuid), public.mis_enlaces() from public, anon;
grant execute on function public.paginas_que_enlazan(uuid), public.mis_enlaces() to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
