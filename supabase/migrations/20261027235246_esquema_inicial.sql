-- =========================================================
-- Orbe · esquema inicial (Fase 0)
-- Seguridad: RLS en todas las tablas, registro cerrado por lista de correos,
-- funciones privilegiadas fuera del esquema expuesto (private).
-- =========================================================

-- Esquema privado: no se expone por la API
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------- Lista de correos permitidos (registro cerrado, máximo 30 personas) ----------
-- Los correos NO se versionan (el repositorio es público). Se cargan aparte en producción:
--   insert into private.correos_permitidos (email) values ('tu-correo@ejemplo.com');
create table private.correos_permitidos (
  email text primary key check (email = lower(email) and char_length(email) <= 254)
);

-- Tope de 30 personas: protege la cuota gratis de Gemini (15 usos × 30 = 450 de ~500 al día).
create or replace function private.limitar_correos_permitidos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from private.correos_permitidos) >= 30 then
    raise exception 'Orbe admite como máximo 30 personas';
  end if;
  return new;
end;
$$;

create trigger antes_de_permitir_correo
  before insert on private.correos_permitidos
  for each row execute function private.limitar_correos_permitidos();

create or replace function private.verificar_correo_permitido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.correos_permitidos where email = lower(new.email)
  ) then
    raise exception 'Registro no permitido';
  end if;
  return new;
end;
$$;

create trigger antes_de_crear_usuario
  before insert on auth.users
  for each row execute function private.verificar_correo_permitido();

-- ---------- Perfiles ----------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '' check (char_length(nombre) <= 80),
  zona_horaria text not null default 'America/Lima' check (char_length(zona_horaria) <= 64),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create or replace function private.tocar_actualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado = now();
  return new;
end;
$$;

create trigger perfiles_actualizado
  before update on public.perfiles
  for each row execute function private.tocar_actualizado();

-- Cada usuario nuevo recibe su perfil con el nombre de su cuenta de Google.
create or replace function private.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80));
  return new;
end;
$$;

create trigger despues_de_crear_usuario
  after insert on auth.users
  for each row execute function private.crear_perfil();

-- ---------- RLS ----------
alter table public.perfiles enable row level security;

-- perfiles: solo el propio; se crean por trigger y no se borran desde la app
create policy "perfiles_select_propio" on public.perfiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfiles_update_propio" on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---------- Privilegios mínimos ----------
revoke all on all tables in schema public from anon;
revoke insert, delete on public.perfiles from authenticated;
-- El id y las fechas no se tocan desde la app: solo nombre y zona horaria.
revoke update on public.perfiles from authenticated;
grant update (nombre, zona_horaria) on public.perfiles to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
