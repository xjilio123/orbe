-- Pruebas del atajo de Siri: claves personales y capturar_con_clave (pgTAP).
-- La "clave" de estas pruebas es un texto de ejemplo: no existe fuera de esta transacción.
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');
insert into public.listas (user_id, nombre) values ('00000000-0000-0000-0000-00000000000a', 'Casa');

-- 1. RLS activo
select ok((select relrowsecurity from pg_class where oid = 'public.claves_atajo'::regclass), 'RLS activo en claves_atajo');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- 2. A crea su clave (solo con nombre, huella y pista)
select lives_ok(
  $$insert into public.claves_atajo (nombre, hash, pista)
    values ('iPhone', encode(extensions.digest('orbe_clave_de_prueba_para_pgtap_0001', 'sha256'), 'hex'), '0001')$$,
  'A crea una clave del atajo'
);

-- 3. No puede inflar su contador ni ponerse otro dueño
select throws_ok(
  $$insert into public.claves_atajo (nombre, hash, pista, usos_ventana)
    values ('x', encode(extensions.digest('orbe_otra_clave_de_prueba_000002', 'sha256'), 'hex'), '0002', -100)$$,
  '42501', null, 'La app no puede escribir el contador de usos'
);

-- Como B: no ve la clave de A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::integer from public.claves_atajo), 0, 'B no ve las claves de A');
reset role;

-- Sin sesión, como lo hace /api/atajo
set local role anon;
select set_config('request.jwt.claims', '', true);

-- 5-6. Con la clave válida, la tarea llega a A (con fecha, prioridad y lista)
select is(
  public.capturar_con_clave('orbe_clave_de_prueba_para_pgtap_0001', 'Pagar la luz', current_date + 1, '09:00', 2, 'casa'),
  'Pagar la luz', 'Con la clave se anota la tarea'
);
select throws_ok(
  $$select public.capturar_con_clave('orbe_clave_inventada_que_no_existe_9', 'x')$$,
  'P0001', 'CLAVE_INVALIDA', 'Una clave que no existe no anota nada'
);

-- 7. Sin texto no se anota
select throws_ok(
  $$select public.capturar_con_clave('orbe_clave_de_prueba_para_pgtap_0001', '   ')$$,
  'P0001', 'SIN_TEXTO', 'Sin texto no se anota'
);

-- 8. Anónimo no puede leer las claves ni las tareas
select throws_ok($$select * from public.claves_atajo$$, '42501', null, 'Sin sesión no se leen las claves');
reset role;

-- 9. La tarea es de A, con su lista
select results_eq(
  $$select t.user_id, t.prioridad::integer, l.nombre from public.tareas t join public.listas l on l.id = t.lista_id where t.titulo = 'Pagar la luz'$$,
  $$values ('00000000-0000-0000-0000-00000000000a'::uuid, 2, 'Casa')$$,
  'La tarea quedó para A, en su lista Casa y con prioridad'
);

-- 10. Freno: hasta 30 por hora
update public.claves_atajo set usos_ventana = 30, ventana = now();
set local role anon;
select throws_ok(
  $$select public.capturar_con_clave('orbe_clave_de_prueba_para_pgtap_0001', 'Una más')$$,
  'P0001', 'DEMASIADAS', 'Más de 30 por hora se frena'
);
reset role;

-- 11. Revocar la clave la deja sin efecto
delete from public.claves_atajo;
set local role anon;
select throws_ok(
  $$select public.capturar_con_clave('orbe_clave_de_prueba_para_pgtap_0001', 'Después de revocar')$$,
  'P0001', 'CLAVE_INVALIDA', 'Una clave revocada ya no sirve'
);
reset role;

select * from finish();
rollback;
