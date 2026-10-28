-- Pruebas de la Fase 3: papelera e historial de páginas (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

insert into public.tareas (id, user_id, titulo, fecha, hora) values
  ('00000000-0000-0000-0000-0000000004a1', '00000000-0000-0000-0000-00000000000a', 'Reunión', '2030-01-10', '09:00');
insert into public.paginas (id, user_id, titulo, contenido) values
  ('00000000-0000-0000-0000-0000000004b1', '00000000-0000-0000-0000-00000000000a', 'Notas', '[{"id":"bloque1","tipo":"p","texto":"v0"}]');

-- 1-2. La dueña manda su tarea a la papelera y deja de avisar
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$update public.tareas set borrado_en = now() where id = '00000000-0000-0000-0000-0000000004a1'$$,
  'La dueña puede mandar su tarea a la papelera'
);
reset role;
select ok((select avisar_en is null from public.tareas where id = '00000000-0000-0000-0000-0000000004a1'), 'Una tarea en la papelera no avisa');
update public.tareas set borrado_en = null where id = '00000000-0000-0000-0000-0000000004a1';
select ok((select avisar_en is not null from public.tareas where id = '00000000-0000-0000-0000-0000000004a1'), 'Al restaurarla vuelve a avisar');

-- 4-5. Historial: guarda cómo estaba, pero no en cada guardado automático
update public.paginas set contenido = '[{"id":"bloque1","tipo":"p","texto":"v1"}]' where id = '00000000-0000-0000-0000-0000000004b1';
select is(
  (select contenido -> 0 ->> 'texto' from public.versiones_pagina where pagina_id = '00000000-0000-0000-0000-0000000004b1'),
  'v0', 'Al editar se guarda la versión anterior'
);
update public.paginas set contenido = '[{"id":"bloque1","tipo":"p","texto":"v2"}]' where id = '00000000-0000-0000-0000-0000000004b1';
select is(
  (select count(*)::integer from public.versiones_pagina where pagina_id = '00000000-0000-0000-0000-0000000004b1'),
  1, 'Dos guardados seguidos no llenan el historial'
);

-- 6. Nunca más de 10 versiones por página
do $$
begin
  for i in 3..20 loop
    update public.versiones_pagina set creado = creado - interval '1 hour' where pagina_id = '00000000-0000-0000-0000-0000000004b1';
    update public.paginas set contenido = jsonb_build_array(jsonb_build_object('id', 'bloque1', 'tipo', 'p', 'texto', 'v' || i))
      where id = '00000000-0000-0000-0000-0000000004b1';
  end loop;
end;
$$;
select is(
  (select count(*)::integer from public.versiones_pagina where pagina_id = '00000000-0000-0000-0000-0000000004b1'),
  10, 'Se conservan solo las últimas 10 versiones'
);

-- 7-8. Nadie escribe versiones a mano ni ve las de otra persona
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.versiones_pagina (pagina_id, user_id, hueco, titulo, icono, contenido)
    values ('00000000-0000-0000-0000-0000000004b1', '00000000-0000-0000-0000-00000000000a', 0, 'x', '', '[]')$$,
  '42501', null, 'Las versiones solo las escribe la base'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::integer from public.versiones_pagina), 0, 'Nadie ve el historial de otra persona');

-- 9. B no puede mandar a la papelera lo de A
update public.tareas set borrado_en = now() where id = '00000000-0000-0000-0000-0000000004a1';
reset role;
select ok((select borrado_en is null from public.tareas where id = '00000000-0000-0000-0000-0000000004a1'), 'Nadie borra lo de otra persona');

select * from finish();
rollback;
