-- Mismo resultado que antes, pero sin llamar a otra función de "private": así el índice de títulos
-- funciona con los permisos de quien guarda la página (solo necesita ejecutar esta función).
create or replace function private.normalizar_titulo(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, ''))), '\s+', ' ', 'g'));
$$;
grant execute on function private.normalizar_titulo(text) to authenticated;
