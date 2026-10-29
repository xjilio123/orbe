-- Pruebas de checklists reutilizables y biblioteca (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');
insert into public.checklists (id, user_id, nombre) values
  ('00000000-0000-0000-0000-000000000aa1', '00000000-0000-0000-0000-00000000000a', 'Mercado');
insert into public.checklist_items (user_id, checklist_id, texto, hecho) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000aa1', 'Pan', true),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000aa1', 'Leche', true);
insert into public.biblioteca (id, user_id, titulo, total) values
  ('00000000-0000-0000-0000-000000000ab1', '00000000-0000-0000-0000-00000000000a', 'Atomic Habits', 320);

-- 1-3. RLS activo
select ok((select relrowsecurity from pg_class where oid = 'public.checklists'::regclass), 'RLS activo en checklists');
select ok((select relrowsecurity from pg_class where oid = 'public.checklist_items'::regclass), 'RLS activo en checklist_items');
select ok((select relrowsecurity from pg_class where oid = 'public.biblioteca'::regclass), 'RLS activo en biblioteca');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- 4. Desmarcar todo para reusar la lista
update public.checklist_items set hecho = false where checklist_id = '00000000-0000-0000-0000-000000000aa1' and hecho;
select is((select count(*)::integer from public.checklist_items where hecho), 0, 'Desmarcar todo deja la lista lista para reusar');

-- 5-6. Al terminar un libro se anota la fecha y el avance queda completo
update public.biblioteca set estado = 'terminado', nota = 5 where id = '00000000-0000-0000-0000-000000000ab1';
select ok((select terminado_en is not null from public.biblioteca where id = '00000000-0000-0000-0000-000000000ab1'), 'Terminar anota la fecha');
select is((select progreso from public.biblioteca where id = '00000000-0000-0000-0000-000000000ab1'), 320, 'Terminar completa el avance');

-- 7. La nota va de 1 a 5
select throws_ok(
  $$update public.biblioteca set nota = 6 where id = '00000000-0000-0000-0000-000000000ab1'$$,
  '23514', null, 'La nota va de 1 a 5'
);

-- 8. La fecha de término solo la pone la base
select throws_ok(
  $$update public.biblioteca set terminado_en = '2020-01-01' where id = '00000000-0000-0000-0000-000000000ab1'$$,
  '42501', null, 'La app no puede cambiar la fecha de término a mano'
);

-- Como B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- 9. B no ve nada de A
select is(
  (select count(*)::integer from public.checklists) + (select count(*)::integer from public.checklist_items) + (select count(*)::integer from public.biblioteca),
  0, 'B no ve las checklists, ítems ni biblioteca de A'
);

-- 10. B no puede agregar ítems a una checklist de A
select throws_ok(
  $$insert into public.checklist_items (checklist_id, texto) values ('00000000-0000-0000-0000-000000000aa1', 'Espía')$$,
  '23503', null, 'B no puede agregar ítems a una checklist de A'
);

-- 11. B no puede marcar ítems de A
update public.checklist_items set hecho = true where checklist_id = '00000000-0000-0000-0000-000000000aa1';
reset role;
select is((select count(*)::integer from public.checklist_items where hecho), 0, 'B no marca los ítems de A');

-- 12. Sin sesión no se lee la biblioteca
set local role anon;
select throws_ok($$select * from public.biblioteca$$, '42501', null, 'Sin sesión no se lee la biblioteca');
reset role;

select * from finish();
rollback;
