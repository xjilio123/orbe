-- Pruebas de inicio y fin: tareas, fechas importantes y atajo de Siri (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into private.correos_permitidos (email) values ('a@prueba.local');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- 1. Una tarea con inicio y fin en días distintos
select lives_ok(
  $$insert into public.tareas (id, user_id, titulo, fecha, hora, fecha_fin, hora_fin, aviso) values
    ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-00000000000a', 'Viaje', '2030-03-10', '22:00', '2030-03-12', '08:00', 0)$$,
  'Se guarda una tarea de varios días con horas'
);

-- 2. El aviso llega a la hora de inicio
select is(
  (select avisar_en from public.tareas where id = '00000000-0000-0000-0000-0000000005a1'),
  '2030-03-11 03:00:00+00'::timestamptz, 'El aviso es a la hora de inicio (Lima)'
);

-- 3. La persona puede cambiar el fin (permiso de columna)
update public.tareas set fecha_fin = '2030-03-13' where id = '00000000-0000-0000-0000-0000000005a1';
select is((select fecha_fin from public.tareas where id = '00000000-0000-0000-0000-0000000005a1'), '2030-03-13'::date, 'Se puede mover el fin');

-- 4. Fin el mismo día que el inicio se guarda vacío
insert into public.tareas (id, user_id, titulo, fecha, hora, fecha_fin, hora_fin) values
  ('00000000-0000-0000-0000-0000000005a2', '00000000-0000-0000-0000-00000000000a', 'Reunión', '2030-03-10', '15:00', '2030-03-10', '17:00');
select ok((select fecha_fin is null from public.tareas where id = '00000000-0000-0000-0000-0000000005a2'), 'El mismo día no guarda fecha de fin');
select is((select hora_fin from public.tareas where id = '00000000-0000-0000-0000-0000000005a2'), '17:00'::time, 'Guarda la hora de fin');

-- 6. El fin no puede ir antes del inicio
select throws_ok(
  $$insert into public.tareas (user_id, titulo, fecha, fecha_fin) values ('00000000-0000-0000-0000-00000000000a', 'x', '2030-03-10', '2030-03-09')$$,
  '23514', null, 'La fecha de fin no puede ser antes del inicio'
);

-- 7. El mismo día, la hora de fin va después de la de inicio
select throws_ok(
  $$insert into public.tareas (user_id, titulo, fecha, hora, hora_fin) values ('00000000-0000-0000-0000-00000000000a', 'x', '2030-03-10', '15:00', '14:00')$$,
  '23514', null, 'El mismo día la hora de fin va después'
);

-- 8-9. Sin hora no hay hora de fin; sin fecha no hay fin
update public.tareas set hora = null where id = '00000000-0000-0000-0000-0000000005a2';
select ok((select hora_fin is null from public.tareas where id = '00000000-0000-0000-0000-0000000005a2'), 'Quitar la hora quita la hora de fin');
update public.tareas set fecha = null, hora = null where id = '00000000-0000-0000-0000-0000000005a1';
select ok((select fecha_fin is null from public.tareas where id = '00000000-0000-0000-0000-0000000005a1'), 'Quitar la fecha quita el fin');

-- 10-11. Una tarea que se repite conserva su duración
insert into public.tareas (id, user_id, titulo, fecha, hora, fecha_fin, hora_fin, repetir) values
  ('00000000-0000-0000-0000-0000000005a3', '00000000-0000-0000-0000-00000000000a', 'Turno', current_date + 1, '20:00', current_date + 2, '06:00', 'semanal');
update public.tareas set estado = 'hecha' where id = '00000000-0000-0000-0000-0000000005a3';
select results_eq(
  $$select fecha, fecha_fin from public.tareas where titulo = 'Turno' and estado = 'pendiente'$$,
  $$values (current_date + 8, current_date + 9)$$,
  'La siguiente vez empieza y termina una semana después'
);
select is((select hora_fin from public.tareas where titulo = 'Turno' and estado = 'pendiente'), '06:00'::time, 'Y conserva la hora de fin');

-- 12-13. Fechas importantes y exámenes con rango
select lives_ok(
  $$insert into public.fechas_importantes (titulo, fecha, hora, fecha_fin, hora_fin) values ('Viaje a Cusco', '2030-05-10', '06:00', '2030-05-15', '20:00')$$,
  'Una fecha importante puede durar varios días'
);
select throws_ok(
  $$insert into public.fechas_importantes (titulo, fecha, hora, hora_fin) values ('Examen', '2030-05-10', '11:00', '09:00')$$,
  '23514', null, 'En una fecha importante el fin no va antes del inicio'
);

-- 14-17. Atajo de Siri con fin
insert into public.claves_atajo (nombre, hash, pista)
  values ('iPhone', encode(extensions.digest('orbe_clave_de_prueba_para_pgtap_0005', 'sha256'), 'hex'), '0005');
set local role anon;
select set_config('request.jwt.claims', '', true);
select is(
  public.anotar_con_clave('orbe_clave_de_prueba_para_pgtap_0005', 'Clase', current_date + 1, '15:00', null, '17:00'),
  'Clase', 'El atajo anota con hora de fin'
);
select lives_ok(
  $$select public.anotar_con_clave('orbe_clave_de_prueba_para_pgtap_0005', 'Fin raro', current_date + 3, '15:00', current_date + 1, '14:00')$$,
  'Un fin sin sentido no impide anotar'
);
reset role;
select results_eq(
  $$select hora_fin from public.tareas where titulo = 'Clase'$$,
  $$values ('17:00'::time)$$,
  'La tarea del atajo guarda la hora de fin'
);
select results_eq(
  $$select fecha_fin, hora_fin from public.tareas where titulo = 'Fin raro'$$,
  $$values (null::date, null::time)$$,
  'Un fin antes del inicio se ignora en vez de perder la tarea'
);

select * from finish();
rollback;
