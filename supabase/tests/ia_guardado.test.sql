-- Pruebas del plan del día y el resumen semanal guardados (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.ia_guardado (clave, fecha, datos) values ('plan', current_date, '{"bloques": [], "consejo": "x"}')
    on conflict (user_id, clave) do update set datos = excluded.datos$$,
  'A guarda su plan del día'
);
select throws_ok(
  $$insert into public.ia_guardado (user_id, clave, fecha, datos) values ('00000000-0000-0000-0000-00000000000b', 'plan', current_date, '{}')$$,
  '42501', null, 'Nadie guarda un plan a nombre de otra persona'
);
select throws_ok(
  $$insert into public.ia_guardado (clave, fecha, datos) values ('otra-cosa', current_date, '{}')$$,
  '23514', null, 'Solo plan o semana'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::integer from public.ia_guardado), 0, 'B no ve el plan de A');
reset role;

select * from finish();
rollback;
