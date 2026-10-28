-- Pruebas de la búsqueda (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

insert into public.paginas (id, user_id, titulo, contenido) values
  ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-00000000000a', 'Presupuesto de la canción',
   '[{"id":"bloque1","tipo":"p","texto":"Guitarra nueva"},{"id":"bloque2","tipo":"p","texto":"Estudio de grabación en Miraflores"}]'),
  ('00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-00000000000b', 'Presupuesto secreto de B', '[]');
insert into public.tareas (id, user_id, titulo, notas) values
  ('00000000-0000-0000-0000-0000000005a2', '00000000-0000-0000-0000-00000000000a', 'Llamar al dentista', 'Pedir cita para el viernes'),
  ('00000000-0000-0000-0000-0000000005a3', '00000000-0000-0000-0000-00000000000a', 'Presupuesto viejo', '');
update public.tareas set borrado_en = now() where id = '00000000-0000-0000-0000-0000000005a3';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is((select count(*)::integer from public.buscar('presu cancion')), 1, 'Busca por prefijo y sin tildes');
select is((select count(*)::integer from public.buscar('PRESU')), 1, 'Solo encuentra lo tuyo y no lo que está en la papelera');
select is((select tipo from public.buscar('dent')), 'tarea', 'Encuentra tareas por su título');
select is((select count(*)::integer from public.buscar('viernes')), 1, 'Busca también en las notas de las tareas');
select is((select detalle from public.buscar('grabacion')), 'Estudio de grabación en Miraflores', 'Muestra el bloque donde aparece');
select is((select count(*)::integer from public.buscar('   ')), 0, 'Sin palabras no devuelve nada');
select lives_ok($$select * from public.buscar($x$') or 1=1; -- & | ! :*$x$)$$, 'Los símbolos raros no rompen la búsqueda');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::integer from public.buscar('cancion')), 0, 'B no encuentra nada de A');
reset role;

set local role anon;
select throws_ok($$select * from public.buscar('presu')$$, '42501', null, 'Sin sesión no se busca');
reset role;

select * from finish();
rollback;
