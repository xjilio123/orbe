-- Pruebas de invitados (pgTAP): solo la administración, tope de 30, quitar sin borrar.
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');
insert into private.administradores (user_id) values ('00000000-0000-0000-0000-00000000000a');

-- 1-3. Quien no administra no ve ni toca la lista
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(public.soy_admin(), false, 'B no administra');
select throws_ok($$select * from public.mis_invitados()$$, 'P0001', 'Solo la administración de Orbe puede hacer esto', 'B no ve los invitados');
select throws_ok($$select public.invitar('amiga@prueba.local')$$, 'P0001', 'Solo la administración de Orbe puede hacer esto', 'B no puede invitar');

-- 4-8. La administración invita, quita y vuelve a invitar
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$select public.invitar('  Nueva@Prueba.LOCAL ')$$, 'A invita un correo (se guarda en minúsculas)');
select is((select count(*)::integer from public.mis_invitados() where email = 'nueva@prueba.local' and activo), 1, 'Aparece activo en la lista');
select throws_ok($$select public.invitar('no-es-correo')$$, 'P0001', 'Correo no válido', 'Rechaza correos mal escritos');
select throws_ok($$select public.quitar_invitado('a@prueba.local')$$, 'P0001', 'No puedes quitarte a ti', 'Nadie se quita a sí mismo');
select public.quitar_invitado('nueva@prueba.local');
reset role;

select throws_ok(
  $$insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'nueva@prueba.local')$$,
  'P0001', 'Registro no permitido', 'Un correo quitado ya no puede entrar'
);

-- 9. Volver a invitar lo reactiva
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.invitar('nueva@prueba.local');
reset role;
select lives_ok(
  $$insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'nueva@prueba.local')$$,
  'Al volver a invitarlo puede entrar'
);

-- 10-11. Tope de 30 personas activas
insert into private.correos_permitidos (email) select 'relleno' || n || '@prueba.local' from generate_series(1, 27) n;
select is((select count(*)::integer from private.correos_permitidos where activo), 30, 'Hay 30 activos');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$select public.invitar('extra@prueba.local')$$, 'P0001', 'Orbe admite como máximo 30 personas', 'No se pasa de 30');
reset role;

select * from finish();
rollback;
