-- Pruebas de la matriz (cuadrante de tareas) y de las vistas guardadas (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');
insert into public.listas (id, user_id, nombre) values
  ('00000000-0000-0000-0000-0000000009a1', '00000000-0000-0000-0000-00000000000a', 'Trabajo');
insert into public.tareas (id, user_id, titulo) values
  ('00000000-0000-0000-0000-0000000009b1', '00000000-0000-0000-0000-00000000000a', 'Informe');

-- 1. RLS activo
select ok((select relrowsecurity from pg_class where oid = 'public.vistas_guardadas'::regclass), 'RLS activo en vistas_guardadas');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- 2-3. Mover a un cuadrante (1 a 4) y volver a "automático"
select lives_ok(
  $$update public.tareas set cuadrante = 2 where id = '00000000-0000-0000-0000-0000000009b1';
    update public.tareas set cuadrante = null where id = '00000000-0000-0000-0000-0000000009b1'$$,
  'A mueve su tarea de cuadrante y la devuelve a automático'
);
select throws_ok(
  $$update public.tareas set cuadrante = 5 where id = '00000000-0000-0000-0000-0000000009b1'$$,
  '23514', null, 'Solo hay 4 cuadrantes'
);

-- 4-5. Vistas guardadas: con nombre y config como objeto
select lives_ok(
  $$insert into public.vistas_guardadas (lista_id, nombre, config) values ('00000000-0000-0000-0000-0000000009a1', 'Urgentes', '{"orden":"prioridad","estado":"pendientes","prioridad":2}')$$,
  'A guarda una vista de su lista'
);
select throws_ok(
  $$insert into public.vistas_guardadas (lista_id, nombre, config) values ('00000000-0000-0000-0000-0000000009a1', 'Mala', '[1,2]')$$,
  '23514', null, 'La configuración debe ser un objeto'
);

-- Como B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- 6. B no ve las vistas de A
select is((select count(*)::integer from public.vistas_guardadas), 0, 'B no ve las vistas guardadas de A');

-- 7. B no puede guardar vistas en una lista de A
select throws_ok(
  $$insert into public.vistas_guardadas (lista_id, nombre) values ('00000000-0000-0000-0000-0000000009a1', 'Espía')$$,
  '23503', null, 'B no puede crear vistas en una lista de A'
);

-- 8. B no puede mover las tareas de A
update public.tareas set cuadrante = 4 where id = '00000000-0000-0000-0000-0000000009b1';
reset role;
select ok((select cuadrante is null from public.tareas where id = '00000000-0000-0000-0000-0000000009b1'), 'B no cambia el cuadrante de una tarea de A');

-- 9. Sin sesión no se leen vistas
set local role anon;
select throws_ok($$select * from public.vistas_guardadas$$, '42501', null, 'Sin sesión no se leen las vistas');
reset role;

select * from finish();
rollback;
