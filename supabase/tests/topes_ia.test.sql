-- Pruebas de los topes de IA (pgTAP): los decide la base y no se pueden saltar.
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

-- 1-3. Reservar, y esperar 10 s entre usos
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select ok(public.reservar_ia('captura') > 0, 'A reserva un uso de captura');
select throws_like($$select public.reservar_ia('dividir')$$, 'ESPERA:%', 'Hay que esperar 10 s entre usos');
select throws_ok($$select public.reservar_ia('inventada')$$, 'P0001', 'Función desconocida', 'Solo funciones conocidas');
reset role;

-- 4. Los errores no cuentan para los topes (solo hacen esperar 15 s)
update private.uso_ia set creado = now() - interval '1 hour', estado = 'error';
insert into private.uso_ia (user_id, funcion, estado, creado)
  select '00000000-0000-0000-0000-00000000000a', 'captura', 'error', now() - interval '1 hour' from generate_series(1, 30);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select ok(public.reservar_ia('captura') > 0, 'Los errores no gastan usos');
reset role;

-- 5. Tope por función: captura 8 al día
update private.uso_ia set creado = now() - interval '1 hour', estado = 'ok' where estado = 'reservado';
insert into private.uso_ia (user_id, funcion, estado, creado)
  select '00000000-0000-0000-0000-00000000000a', 'captura', 'ok', now() - interval '1 hour' from generate_series(1, 7);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$select public.reservar_ia('captura')$$, 'P0001', 'TOPE_FUNCION', 'Captura: máximo 8 al día');
select ok(public.reservar_ia('dividir') > 0, 'Otra función todavía se puede usar');
reset role;

-- 7. Tope por persona: 15 al día
update private.uso_ia set creado = now() - interval '1 hour', estado = 'ok' where estado = 'reservado';
insert into private.uso_ia (user_id, funcion, estado, creado)
  select '00000000-0000-0000-0000-00000000000a', 'mejorar', 'ok', now() - interval '1 hour' from generate_series(1, 6);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$select public.reservar_ia('resumir')$$, 'P0001', 'TOPE_PERSONA', 'Máximo 15 usos al día por persona');
select is((public.mi_uso_ia() ->> 'usados')::integer, 15, 'El medidor cuenta los 15 usos');

-- 9. Nadie marca los usos de otra persona
reset role;
select set_config('prueba.id_ajeno', (select max(id)::text from private.uso_ia), true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok(
  $$select public.terminar_ia(current_setting('prueba.id_ajeno')::bigint, false)$$,
  'Intentar marcar un uso ajeno no falla, pero no hace nada'
);
reset role;
select is((select count(*)::integer from private.uso_ia where estado = 'error' and funcion = 'mejorar'), 0, 'El uso de A sigue igual');

-- 11. Freno general de la app
update private.ajustes set valor = '15' where clave = 'ia_tope_global';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$select public.reservar_ia('captura')$$, 'P0001', 'TOPE_GLOBAL', 'El freno general detiene a todos');
reset role;

-- 12. Sin sesión no hay IA
set local role anon;
select throws_ok($$select public.reservar_ia('captura')$$, '42501', null, 'Sin sesión no se reserva');
reset role;

select * from finish();
rollback;
