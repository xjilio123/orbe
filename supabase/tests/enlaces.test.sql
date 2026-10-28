-- Pruebas de enlaces entre notas, backlinks y mapa (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

insert into public.paginas (id, user_id, titulo) values
  ('00000000-0000-0000-0000-0000000007a1', '00000000-0000-0000-0000-00000000000a', 'Window Functions'),
  ('00000000-0000-0000-0000-0000000007a3', '00000000-0000-0000-0000-00000000000a', 'Inglés');
insert into public.paginas (id, user_id, titulo, contenido) values
  ('00000000-0000-0000-0000-0000000007a2', '00000000-0000-0000-0000-00000000000a', 'SQL',
   '[{"id":"bloque-1","tipo":"p","texto":"Ver [[window   functions]] y [[Ingles|mi curso]]"},{"id":"bloque-2","tipo":"codigo","texto":"[[No cuenta]]"}]');
-- B tiene una página que enlaza a un título igual al de A: no debe cruzarse.
insert into public.paginas (id, user_id, titulo, contenido) values
  ('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-00000000000b', 'Espía',
   '[{"id":"bloque-1","tipo":"p","texto":"[[Window Functions]]"}]');

-- 1. La base calcula los enlaces sola (normalizados, sin los del código)
select is(
  (select array_agg(e order by e) from public.paginas, unnest(enlaces) as e where id = '00000000-0000-0000-0000-0000000007a2'),
  array['ingles', 'window functions'], 'Los enlaces se guardan normalizados y sin los bloques de código'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- 2. Con su sesión normal, una persona crea y renombra páginas (el índice de títulos no pide permisos extra)
select lives_ok(
  $$insert into public.paginas (titulo) values ('Nueva de A'); update public.paginas set titulo = 'Nueva de A (2)' where titulo = 'Nueva de A'$$,
  'Crear y renombrar páginas funciona con los permisos de la app'
);

-- 3-4. Backlinks de A: solo sus páginas
select results_eq(
  $$select id from public.paginas_que_enlazan('00000000-0000-0000-0000-0000000007a1')$$,
  $$values ('00000000-0000-0000-0000-0000000007a2'::uuid)$$,
  'Window Functions recibe el backlink de SQL (y no el de B)'
);
select is((select count(*)::integer from public.paginas_que_enlazan('00000000-0000-0000-0000-0000000007a3')), 1, 'Inglés recibe el backlink aunque se escribió sin tilde');

-- 4. Mapa: las dos conexiones de SQL
select is((select count(*)::integer from public.mis_enlaces()), 2, 'El mapa de A tiene 2 conexiones');

-- 5. Editar el texto actualiza los enlaces
update public.paginas set contenido = '[{"id":"bloque-1","tipo":"p","texto":"Solo [[Inglés]]"}]'
  where id = '00000000-0000-0000-0000-0000000007a2';
select is((select count(*)::integer from public.mis_enlaces()), 1, 'Al quitar un enlace, el mapa se actualiza');

-- 6. La app no puede escribir los enlaces a mano
select throws_ok(
  $$update public.paginas set enlaces = array['falso'] where id = '00000000-0000-0000-0000-0000000007a2'$$,
  '42501', null, 'Los enlaces solo los calcula la base'
);

-- 7. Lo que está en la papelera no aparece como backlink
update public.paginas set borrado_en = now() where id = '00000000-0000-0000-0000-0000000007a2';
select is((select count(*)::integer from public.paginas_que_enlazan('00000000-0000-0000-0000-0000000007a3')), 0, 'Una página en la papelera no cuenta como backlink');

-- 8-9. B no ve backlinks ni conexiones de A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::integer from public.paginas_que_enlazan('00000000-0000-0000-0000-0000000007a1')), 0, 'B no puede pedir los backlinks de una página de A');
select is((select count(*)::integer from public.mis_enlaces()), 0, 'B no ve el mapa de A (su enlace apunta a un título que no tiene)');
reset role;

-- 10. Sin sesión no se puede leer
set local role anon;
select throws_ok($$select * from public.mis_enlaces()$$, '42501', null, 'Sin sesión no se lee el mapa');
reset role;

select * from finish();
rollback;
