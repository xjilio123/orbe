-- Pruebas de la Fase 2: repetición, avisos push y calendario (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

-- 1-3. Siguiente fecha
select is(private.siguiente_fecha('2026-10-30', 'laborables', '2026-10-30'), '2026-11-02'::date, 'De lunes a viernes: el viernes pasa al lunes');
select is(private.siguiente_fecha('2026-01-31', 'mensual', '2026-02-01'), '2026-02-28'::date, 'Mensual: el 31 pasa al último día de febrero');
select is(private.siguiente_fecha('2026-10-20', 'diaria', '2026-10-27'), '2026-10-28'::date, 'Atrasada: la siguiente es después de hoy');

-- 4-7. Marcar una tarea que se repite crea la siguiente con sus subtareas sin marcar
insert into public.tareas (id, user_id, titulo, fecha, hora, repetir) values
  ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-00000000000a', 'Gimnasio', current_date + 1, '07:00', 'semanal');
insert into public.tareas (user_id, padre_id, titulo, estado) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003a1', 'Llevar toalla', 'hecha');
update public.tareas set estado = 'hecha' where id = '00000000-0000-0000-0000-0000000003a1';

select is(
  (select count(*)::integer from public.tareas where titulo = 'Gimnasio' and padre_id is null),
  2, 'Al marcarla nace la siguiente'
);
select is(
  (select fecha from public.tareas where titulo = 'Gimnasio' and estado = 'pendiente'),
  current_date + 8, 'La siguiente es una semana después'
);
select is(
  (select count(*)::integer from public.tareas s join public.tareas p on p.id = s.padre_id
   where p.titulo = 'Gimnasio' and p.estado = 'pendiente' and s.estado = 'pendiente'),
  1, 'Sus subtareas se copian sin marcar'
);
update public.tareas set estado = 'pendiente' where id = '00000000-0000-0000-0000-0000000003a1';
update public.tareas set estado = 'hecha' where id = '00000000-0000-0000-0000-0000000003a1';
select is(
  (select count(*)::integer from public.tareas where titulo = 'Gimnasio' and padre_id is null),
  2, 'Desmarcar y volver a marcar no crea duplicados'
);

-- 8-10. Hora del aviso en Lima
insert into public.tareas (id, user_id, titulo, fecha, hora, aviso) values
  ('00000000-0000-0000-0000-0000000003a2', '00000000-0000-0000-0000-00000000000a', 'Reunión', '2030-01-10', '09:00', 15);
select is(
  (select avisar_en from public.tareas where id = '00000000-0000-0000-0000-0000000003a2'),
  '2030-01-10 13:45:00+00'::timestamptz, 'Avisa 15 min antes, en hora de Lima'
);
update public.tareas set aviso = null where id = '00000000-0000-0000-0000-0000000003a2';
select ok((select avisar_en is null from public.tareas where id = '00000000-0000-0000-0000-0000000003a2'), 'Sin aviso no hay hora de aviso');
insert into public.tareas (id, user_id, titulo, fecha, hora) values
  ('00000000-0000-0000-0000-0000000003a3', '00000000-0000-0000-0000-00000000000a', 'Algo de ayer', current_date - 1, '09:00');
select ok((select avisado_en is not null from public.tareas where id = '00000000-0000-0000-0000-0000000003a3'), 'Lo que ya pasó no avisa tarde');

-- 11-12. Reglas de repetición
select throws_ok(
  $$insert into public.tareas (user_id, titulo, repetir) values ('00000000-0000-0000-0000-00000000000a', 'x', 'diaria')$$,
  '23514', null, 'Para repetir hace falta una fecha'
);
select throws_ok(
  $$insert into public.tareas (user_id, padre_id, titulo, fecha, repetir) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003a2', 'x', '2030-01-10', 'diaria')$$,
  '23514', null, 'Las subtareas no se repiten'
);

-- 13. Cada aviso se toma una sola vez
-- Tarea para "ahora mismo" en Lima: su aviso ya toca.
insert into public.tareas (id, user_id, titulo, fecha, hora) values (
  '00000000-0000-0000-0000-0000000003a4', '00000000-0000-0000-0000-00000000000a', 'Ahora',
  (now() at time zone 'America/Lima')::date, (now() at time zone 'America/Lima')::time
);
select is(
  (select count(*)::integer from private.tomar_avisos() where url = '/tareas/00000000-0000-0000-0000-0000000003a4')
  + (select count(*)::integer from private.tomar_avisos() where url = '/tareas/00000000-0000-0000-0000-0000000003a4'),
  1, 'Dos llamadas seguidas no mandan el mismo aviso dos veces'
);

-- 14-18. Suscripciones push como la persona A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$select public.guardar_suscripcion_push('https://web.push.apple.com/QAbc123', repeat('A', 87), repeat('b', 22), 'iPhone')$$,
  'Guardar la suscripción de un iPhone'
);
select throws_ok(
  $$select public.guardar_suscripcion_push('https://evil.example.com/push', repeat('A', 87), repeat('b', 22), 'x')$$,
  '23514', null, 'Solo servicios de push conocidos'
);
select throws_ok(
  $$insert into public.suscripciones_push (endpoint, p256dh, auth) values ('https://fcm.googleapis.com/x', repeat('A', 87), repeat('b', 22))$$,
  '42501', null, 'No se insertan suscripciones directo, solo con la función'
);
select is(public.probar_avisos(), 'enviado', 'La prueba de avisos sale');
select is(public.probar_avisos(), 'espera', 'Una segunda prueba en el mismo minuto espera');

-- 19. B no ve las suscripciones de A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::integer from public.suscripciones_push), 0, 'Nadie ve los dispositivos de otra persona');
reset role;

-- 20. Google Calendar: solo direcciones de calendar.google.com
select throws_ok(
  $$update public.perfiles set calendario_ics = 'https://169.254.169.254/latest/meta-data' where id = '00000000-0000-0000-0000-00000000000a'$$,
  '23514', null, 'El calendario solo acepta direcciones de Google'
);

select * from finish();
rollback;
