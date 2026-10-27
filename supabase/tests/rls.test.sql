-- Pruebas de seguridad de la base de datos (pgTAP). Se ejecutan con: supabase test db
-- Si una política RLS se rompe, estas pruebas fallan y el cambio no se publica.
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

-- ---------- Preparación (como superusuario) ----------
insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local', '{"full_name":"Ana Prueba"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local', '{}');

-- 1. RLS activo
select ok((select relrowsecurity from pg_class where oid = 'public.perfiles'::regclass), 'RLS activo en perfiles');

-- 2. Registro cerrado: un correo no autorizado no puede crear cuenta
select throws_ok(
  $$insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000ff', 'intruso@prueba.local')$$,
  'P0001', 'Registro no permitido',
  'Un correo fuera de la lista no puede registrarse'
);

-- 3. El trigger crea el perfil con el nombre de Google
select is(
  (select nombre from public.perfiles where id = '00000000-0000-0000-0000-00000000000a'),
  'Ana Prueba',
  'Cada usuario nuevo recibe su perfil con su nombre'
);

-- 4. Tope de 30 personas en la lista de correos
insert into private.correos_permitidos (email)
  select 'relleno' || n || '@prueba.local' from generate_series(1, 28) as n;
select throws_ok(
  $$insert into private.correos_permitidos (email) values ('numero31@prueba.local')$$,
  'P0001', 'Orbe admite como máximo 30 personas',
  'La lista no acepta una persona número 31'
);

-- ---------- Sin sesión (anon) ----------
set local role anon;
select throws_ok($$select * from public.perfiles$$, '42501', null, 'Sin sesión no se puede leer ningún perfil');
reset role;

-- ---------- Como usuario B ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- 6. B solo ve su propio perfil
select is((select count(*) from public.perfiles), 1::bigint, 'B solo ve su propio perfil');

-- 7. B intenta renombrar a todos; RLS hace que solo cambie el suyo (se verifica más abajo)
update public.perfiles set nombre = 'Hackeado';

-- 8. B no puede crear perfiles
select throws_ok(
  $$insert into public.perfiles (id, nombre) values ('00000000-0000-0000-0000-0000000000cc', 'Falso')$$,
  '42501', null,
  'Nadie puede crear perfiles desde la app'
);

-- 9. B no puede borrar perfiles
select throws_ok($$delete from public.perfiles$$, '42501', null, 'Nadie puede borrar perfiles desde la app');

-- 10. B no puede cambiar el id de su perfil
select throws_ok(
  $$update public.perfiles set id = '00000000-0000-0000-0000-0000000000dd'$$,
  '42501', null,
  'El id del perfil no se puede cambiar'
);

-- 11. B no puede leer la lista de correos permitidos
select throws_ok($$select * from private.correos_permitidos$$, '42501', null, 'La lista de correos es privada');

reset role;

-- 7 (verificación). Como superusuario: el perfil de A sigue intacto
select is(
  (select nombre from public.perfiles where id = '00000000-0000-0000-0000-00000000000a'),
  'Ana Prueba',
  'B no pudo modificar el perfil de A'
);

select * from finish();
rollback;
