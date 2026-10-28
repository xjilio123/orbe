-- =========================================================
-- Orbe · Fase 3 · Invitados (máximo 30 personas), administrados desde Ajustes
-- Solo quien está en private.administradores puede ver, invitar o quitar correos.
-- Quitar no borra la cuenta: impide que esa persona entre por primera vez.
-- =========================================================

alter table private.correos_permitidos
  add column activo boolean not null default true,
  add column creado timestamptz not null default now();

-- El tope de 30 cuenta solo los correos activos, al invitar y al volver a activar uno.
create or replace function private.limitar_correos_permitidos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.activo or (tg_op = 'UPDATE' and old.activo) then
    return new;
  end if;
  if (select count(*) from private.correos_permitidos where activo) >= 30 then
    raise exception 'Orbe admite como máximo 30 personas';
  end if;
  return new;
end;
$$;

create trigger antes_de_reactivar_correo
  before update of activo on private.correos_permitidos
  for each row execute function private.limitar_correos_permitidos();

create or replace function private.verificar_correo_permitido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.correos_permitidos where email = lower(new.email) and activo
  ) then
    raise exception 'Registro no permitido';
  end if;
  return new;
end;
$$;

create or replace function private.exigir_administrador()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from private.administradores where user_id = auth.uid()) then
    raise exception 'Solo la administración de Orbe puede hacer esto';
  end if;
end;
$$;

/** ¿Puedo administrar invitados? (Ajustes solo muestra la sección si es así). */
create or replace function public.soy_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.administradores where user_id = auth.uid());
$$;

/** Lista de invitados y si ya entraron a Orbe. */
create or replace function public.mis_invitados()
returns table (email text, activo boolean, registrado boolean, creado timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.exigir_administrador();
  return query
    select c.email, c.activo, exists (select 1 from auth.users u where lower(u.email) = c.email), c.creado
    from private.correos_permitidos c
    order by c.activo desc, c.creado;
end;
$$;

create or replace function public.invitar(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  correo text := lower(btrim(coalesce(p_email, '')));
begin
  perform private.exigir_administrador();
  if correo !~ '^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,180}\.[a-z]{2,24}$' then
    raise exception 'Correo no válido';
  end if;
  insert into private.correos_permitidos (email) values (correo)
  on conflict (email) do update set activo = true;
end;
$$;

create or replace function public.quitar_invitado(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  correo text := lower(btrim(coalesce(p_email, '')));
begin
  perform private.exigir_administrador();
  if exists (select 1 from auth.users where id = auth.uid() and lower(email) = correo) then
    raise exception 'No puedes quitarte a ti';
  end if;
  update private.correos_permitidos set activo = false where email = correo;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.soy_admin(), public.mis_invitados(), public.invitar(text), public.quitar_invitado(text) from public, anon;
grant execute on function public.soy_admin(), public.mis_invitados(), public.invitar(text), public.quitar_invitado(text) to authenticated;
