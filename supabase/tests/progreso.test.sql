-- Pruebas de la Fase 5 (parte 1): hábitos, metas, fechas importantes y sesiones de foco (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

-- 1-5. RLS activo en todas las tablas nuevas
select ok((select relrowsecurity from pg_class where oid = 'public.habitos'::regclass), 'RLS activo en habitos');
select ok((select relrowsecurity from pg_class where oid = 'public.habitos_marcas'::regclass), 'RLS activo en habitos_marcas');
select ok((select relrowsecurity from pg_class where oid = 'public.metas'::regclass), 'RLS activo en metas');
select ok((select relrowsecurity from pg_class where oid = 'public.fechas_importantes'::regclass), 'RLS activo en fechas_importantes');
select ok((select relrowsecurity from pg_class where oid = 'public.sesiones_foco'::regclass), 'RLS activo en sesiones_foco');

-- Datos de A (como sistema)
insert into public.habitos (id, user_id, nombre, dias_semana) values
  ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-00000000000a', 'Leer', 7);
insert into public.habitos_marcas (habito_id, user_id, fecha)
  select '00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-00000000000a', (now() at time zone 'America/Lima')::date - d
  from generate_series(1, 3) as d;
insert into public.listas (id, user_id, nombre) values
  ('00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-00000000000a', 'Inglés');
insert into public.tareas (id, user_id, lista_id, titulo, estado) values
  ('00000000-0000-0000-0000-0000000005c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000005b1', 'Unidad 1', 'hecha'),
  ('00000000-0000-0000-0000-0000000005c2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000005b1', 'Unidad 2', 'hecha'),
  ('00000000-0000-0000-0000-0000000005c3', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000005b1', 'Unidad 3', 'pendiente');
insert into public.metas (id, user_id, titulo, anio, tipo, lista_id) values
  ('00000000-0000-0000-0000-0000000005d1', '00000000-0000-0000-0000-00000000000a', 'Aprobar el B2', 2026, 'lista', '00000000-0000-0000-0000-0000000005b1');
insert into public.metas (id, user_id, titulo, anio, tipo, objetivo, actual, unidad) values
  ('00000000-0000-0000-0000-0000000005d2', '00000000-0000-0000-0000-00000000000a', 'Leer 12 libros', 2026, 'numero', 12, 3, 'libros');

-- Como A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- 6. Racha diaria: 3 días seguidos hasta ayer (hoy aún no lo marca)
select is(
  (select racha from public.mis_habitos((now() at time zone 'America/Lima')::date)),
  3, 'La racha cuenta los días seguidos hasta ayer'
);

-- 7. Marcar hoy sube la racha
insert into public.habitos_marcas (habito_id, fecha) values ('00000000-0000-0000-0000-0000000005a1', (now() at time zone 'America/Lima')::date);
select is(
  (select racha from public.mis_habitos((now() at time zone 'America/Lima')::date)),
  4, 'Al marcar hoy, la racha sube a 4'
);

-- 8-9. No se marcan días futuros ni de hace más de un mes
select throws_ok(
  $$insert into public.habitos_marcas (habito_id, fecha) values ('00000000-0000-0000-0000-0000000005a1', (now() at time zone 'America/Lima')::date + 1)$$,
  'P0001', null, 'No se marca un día que aún no llega'
);
select throws_ok(
  $$insert into public.habitos_marcas (habito_id, fecha) values ('00000000-0000-0000-0000-0000000005a1', (now() at time zone 'America/Lima')::date - 40)$$,
  'P0001', null, 'No se marcan días de hace más de un mes'
);

-- 10. Meta de lista: el avance son las tareas hechas de la lista
select results_eq(
  $$select objetivo, actual from public.mis_metas(2026) where id = '00000000-0000-0000-0000-0000000005d1'$$,
  $$values (3::numeric, 2::numeric)$$,
  'La meta de lista cuenta 2 de 3 tareas hechas'
);

-- 11. Una meta de número necesita objetivo
select throws_ok(
  $$insert into public.metas (titulo, anio, tipo) values ('Sin objetivo', 2026, 'numero')$$,
  '23514', null, 'Una meta de número sin objetivo no entra'
);

-- 12. Sesión de foco que empieza en el futuro: no entra
select throws_ok(
  $$insert into public.sesiones_foco (inicio, minutos) values (now() + interval '1 hour', 25)$$,
  '23514', null, 'Una sesión no puede empezar en el futuro'
);
insert into public.sesiones_foco (tarea_id, inicio, minutos) values ('00000000-0000-0000-0000-0000000005c3', now() - interval '1 minute', 25);

-- 13. Estadísticas: 8 semanas y los minutos de esta semana
select is((select count(*)::integer from public.mis_estadisticas(8)), 8, 'Las estadísticas traen 8 semanas');
select is((select minutos from public.mis_estadisticas(8) order by semana desc limit 1), 25, 'Los 25 minutos de foco cuentan en esta semana');

-- Como B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- 15. B no ve los hábitos ni las metas de A
select is((select count(*)::integer from public.mis_habitos((now() at time zone 'America/Lima')::date)), 0, 'B no ve los hábitos de A');
select is((select count(*)::integer from public.mis_metas(2026)), 0, 'B no ve las metas de A');

-- 17. B no puede marcar el hábito de A (la llave compuesta lo impide)
select throws_ok(
  $$insert into public.habitos_marcas (habito_id, fecha) values ('00000000-0000-0000-0000-0000000005a1', (now() at time zone 'America/Lima')::date - 5)$$,
  '23503', null, 'B no puede marcar un hábito de A'
);

-- 18. B no puede ligar una sesión de foco a una tarea de A
select throws_ok(
  $$insert into public.sesiones_foco (tarea_id, inicio, minutos) values ('00000000-0000-0000-0000-0000000005c3', now(), 25)$$,
  '23503', null, 'B no puede usar una tarea de A en su foco'
);

-- 19. B no puede cambiar el avance de una meta de A
update public.metas set actual = 99 where id = '00000000-0000-0000-0000-0000000005d2';
reset role;
select is((select actual from public.metas where id = '00000000-0000-0000-0000-0000000005d2'), 3::numeric, 'B no cambia las metas de A');

-- 20. Sin sesión no se puede leer nada
set local role anon;
select throws_ok($$select * from public.mis_habitos(current_date)$$, '42501', null, 'Sin sesión no se leen hábitos');
reset role;

select * from finish();
rollback;
