-- Pruebas del modo estudio (cursos y exámenes) y del diario con ánimo (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');
insert into public.paginas (id, user_id, titulo) values
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-00000000000a', 'SQL'),
  ('00000000-0000-0000-0000-0000000008a2', '00000000-0000-0000-0000-00000000000a', '28 oct 2026 · miércoles');

-- 1. RLS activo
select ok((select relrowsecurity from pg_class where oid = 'public.diario'::regclass), 'RLS activo en diario');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- 2. Guardar y cambiar el ánimo de hoy, como lo hace la app (upsert)
select lives_ok(
  $$insert into public.diario (fecha, animo) values ((now() at time zone 'America/Lima')::date, 4)
    on conflict (user_id, fecha) do update set fecha = excluded.fecha, animo = excluded.animo;
    insert into public.diario (fecha, pagina_id) values ((now() at time zone 'America/Lima')::date, '00000000-0000-0000-0000-0000000008a2')
    on conflict (user_id, fecha) do update set fecha = excluded.fecha, pagina_id = excluded.pagina_id$$,
  'Se guarda el ánimo y la página del día'
);
select results_eq(
  $$select animo::integer, pagina_id from public.diario$$,
  $$values (4, '00000000-0000-0000-0000-0000000008a2'::uuid)$$,
  'Un solo registro por día con su ánimo y su página'
);

-- 4-5. Reglas: no días futuros, ánimo de 1 a 5
select throws_ok(
  $$insert into public.diario (fecha, animo) values ((now() at time zone 'America/Lima')::date + 1, 3)$$,
  'P0001', null, 'No se anota un día que aún no llega'
);
select throws_ok(
  $$insert into public.diario (fecha, animo) values ((now() at time zone 'America/Lima')::date - 1, 6)$$,
  '23514', null, 'El ánimo va de 1 a 5'
);

-- 6. Marcar una página como curso y anotarle un examen
select lives_ok(
  $$update public.paginas set curso = true where id = '00000000-0000-0000-0000-0000000008a1';
    insert into public.fechas_importantes (titulo, fecha, pagina_id) values ('Examen final', current_date + 10, '00000000-0000-0000-0000-0000000008a1')$$,
  'A marca su curso y le anota un examen'
);

-- Como B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- 7. B no ve el diario de A
select is((select count(*)::integer from public.diario), 0, 'B no ve el diario de A');

-- 8-9. B no puede ligar su diario ni un examen a páginas de A
select throws_ok(
  $$insert into public.diario (fecha, pagina_id) values ((now() at time zone 'America/Lima')::date, '00000000-0000-0000-0000-0000000008a2')$$,
  '23503', null, 'B no puede ligar su diario a una página de A'
);
select throws_ok(
  $$insert into public.fechas_importantes (titulo, fecha, pagina_id) values ('Espía', current_date, '00000000-0000-0000-0000-0000000008a1')$$,
  '23503', null, 'B no puede anotar exámenes en un curso de A'
);

-- 10. B no puede marcar como curso una página de A
update public.paginas set curso = false where id = '00000000-0000-0000-0000-0000000008a1';
reset role;
select ok((select curso from public.paginas where id = '00000000-0000-0000-0000-0000000008a1'), 'B no cambia los cursos de A');

-- 11. Sin sesión no se lee el diario
set local role anon;
select throws_ok($$select * from public.diario$$, '42501', null, 'Sin sesión no se lee el diario');
reset role;

select * from finish();
rollback;
