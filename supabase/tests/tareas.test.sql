-- Pruebas de seguridad y reglas de listas y tareas (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

-- Datos de A (como superusuario)
insert into public.listas (id, user_id, nombre) values
  ('00000000-0000-0000-0000-0000000001a1', '00000000-0000-0000-0000-00000000000a', 'Casa');
insert into public.tareas (id, user_id, lista_id, titulo) values
  ('00000000-0000-0000-0000-0000000002a1', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-0000000001a1', 'Pagar luz');

-- 1-2. RLS activo
select ok((select relrowsecurity from pg_class where oid = 'public.listas'::regclass), 'RLS activo en listas');
select ok((select relrowsecurity from pg_class where oid = 'public.tareas'::regclass), 'RLS activo en tareas');

-- 3. hecha_en se completa solo y se borra al reabrir
update public.tareas set estado = 'hecha' where id = '00000000-0000-0000-0000-0000000002a1';
select isnt((select hecha_en from public.tareas where id = '00000000-0000-0000-0000-0000000002a1'), null, 'Marcar como hecha guarda la fecha');
update public.tareas set estado = 'pendiente' where id = '00000000-0000-0000-0000-0000000002a1';
select is((select hecha_en from public.tareas where id = '00000000-0000-0000-0000-0000000002a1'), null, 'Reabrir borra la fecha de hecha');

-- 5. Subtareas de un solo nivel
insert into public.tareas (id, user_id, padre_id, titulo) values
  ('00000000-0000-0000-0000-0000000002a2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000002a1', 'Sub');
select throws_ok(
  $$insert into public.tareas (user_id, padre_id, titulo) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000002a2', 'Sub de sub')$$,
  'P0001', 'Las subtareas no pueden tener subtareas', 'Solo un nivel de subtareas'
);

-- 6. Una hora necesita fecha
select throws_ok(
  $$insert into public.tareas (user_id, titulo, hora) values ('00000000-0000-0000-0000-00000000000a', 'x', '10:00')$$,
  '23514', null, 'No hay hora sin fecha'
);

-- ---------- Como usuario B ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- 7. B no ve nada de A
select is_empty($$select * from public.tareas$$, 'B no ve las tareas de A');
select is_empty($$select * from public.listas$$, 'B no ve las listas de A');

-- 9. B no puede meter su tarea en la lista de A (llave compuesta)
select throws_ok(
  $$insert into public.tareas (user_id, lista_id, titulo) values
    ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000001a1', 'Intruso')$$,
  '23503', null, 'B no puede usar la lista de A'
);

-- 10. B no puede crear subtareas dentro de una tarea de A
select throws_ok(
  $$insert into public.tareas (user_id, padre_id, titulo) values
    ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000002a1', 'Intruso')$$,
  '23503', null, 'B no puede colgarse de una tarea de A'
);

-- 11. B no puede crear tareas a nombre de A
select throws_ok(
  $$insert into public.tareas (user_id, titulo) values ('00000000-0000-0000-0000-00000000000a', 'Falsa')$$,
  '42501', null, 'B no puede crear tareas a nombre de A'
);

-- 12. B no puede cambiar el dueño de su propia tarea
insert into public.tareas (id, user_id, titulo) values ('00000000-0000-0000-0000-0000000002b1', '00000000-0000-0000-0000-00000000000b', 'Mía');
select throws_ok(
  $$update public.tareas set user_id = '00000000-0000-0000-0000-00000000000a' where id = '00000000-0000-0000-0000-0000000002b1'$$,
  '42501', null, 'El dueño de una tarea no se puede cambiar'
);

-- 13. B intenta borrar todo: solo borra lo suyo (se verifica abajo)
delete from public.tareas;
reset role;

select is((select count(*) from public.tareas where user_id = '00000000-0000-0000-0000-00000000000a'), 2::bigint, 'B no pudo borrar tareas de A');

-- 14. Tope de listas por persona
insert into public.listas (user_id, nombre)
  select '00000000-0000-0000-0000-00000000000a', 'Lista ' || n from generate_series(1, 49) as n;
select throws_ok(
  $$insert into public.listas (user_id, nombre) values ('00000000-0000-0000-0000-00000000000a', 'Una más')$$,
  'P0001', 'Llegaste al máximo de 50 en listas', 'Máximo 50 listas por persona'
);

select * from finish();
rollback;
