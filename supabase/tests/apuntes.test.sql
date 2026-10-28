-- Pruebas de seguridad y de espacio de apuntes y adjuntos (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');

insert into public.paginas (id, user_id, titulo) values
  ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-00000000000a', 'Raíz de A'),
  ('00000000-0000-0000-0000-0000000003a2', '00000000-0000-0000-0000-00000000000a', 'Hija de A');
update public.paginas set padre_id = '00000000-0000-0000-0000-0000000003a1' where id = '00000000-0000-0000-0000-0000000003a2';

-- 1-2. RLS activo
select ok((select relrowsecurity from pg_class where oid = 'public.paginas'::regclass), 'RLS activo en paginas');
select ok((select relrowsecurity from pg_class where oid = 'public.adjuntos'::regclass), 'RLS activo en adjuntos');

-- 3. Sin ciclos: la raíz no puede ir dentro de su propia hija
select throws_ok(
  $$update public.paginas set padre_id = '00000000-0000-0000-0000-0000000003a2' where id = '00000000-0000-0000-0000-0000000003a1'$$,
  'P0001', 'Una página no puede ir dentro de sí misma', 'No se pueden crear ciclos de páginas'
);

-- 4. Contenido debe ser una lista de bloques
select throws_ok(
  $$update public.paginas set contenido = '{"x":1}' where id = '00000000-0000-0000-0000-0000000003a1'$$,
  '23514', null, 'El contenido siempre es una lista'
);

-- 5. Adjunto válido en la carpeta del dueño
insert into public.adjuntos (user_id, pagina_id, ruta, tipo, tamano) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003a1',
   '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000004a1.webp', 'image/webp', 300000);
select is((select count(*) from public.adjuntos), 1::bigint, 'Se registra un adjunto válido');

-- 6. La ruta no puede apuntar a la carpeta de otra persona
select throws_ok(
  $$insert into public.adjuntos (user_id, pagina_id, ruta, tipo, tamano) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003a1',
     '00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000004a2.webp', 'image/webp', 10)$$,
  '23514', null, 'Un adjunto solo vive en la carpeta de su dueño'
);

-- 7. Rutas con trucos no entran
select throws_ok(
  $$insert into public.adjuntos (user_id, pagina_id, ruta, tipo, tamano) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003a1', '../secreto.webp', 'image/webp', 10)$$,
  '23514', null, 'No se aceptan rutas con ../'
);

-- 8. Candado de espacio: 30 MB por persona
insert into public.adjuntos (user_id, pagina_id, ruta, tipo, tamano)
  select '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003a1',
    '00000000-0000-0000-0000-00000000000a/' || lpad(n::text, 8, '0') || '-0000-0000-0000-000000000000.pdf', 'application/pdf', 4194304
  from generate_series(1, 7) as n;
select throws_ok(
  $$insert into public.adjuntos (user_id, pagina_id, ruta, tipo, tamano) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003a1',
     '00000000-0000-0000-0000-00000000000a/99999999-0000-0000-0000-000000000000.pdf', 'application/pdf', 4194304)$$,
  'P0001', 'Sin espacio: llegaste a los 30 MB de archivos', 'No se puede pasar de 30 MB de archivos'
);

-- ---------- Como usuario B ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- 9-10. B no ve páginas ni adjuntos de A
select is_empty($$select * from public.paginas$$, 'B no ve las páginas de A');
select is_empty($$select * from public.adjuntos$$, 'B no ve los adjuntos de A');

-- 11. B no puede colgar una página suya dentro de una de A
select throws_ok(
  $$insert into public.paginas (user_id, padre_id, titulo) values
    ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000003a1', 'Intrusa')$$,
  '23503', null, 'B no puede usar una página de A como padre'
);

-- 12. B no puede registrar un adjunto en la página de A
select throws_ok(
  $$insert into public.adjuntos (user_id, pagina_id, ruta, tipo, tamano) values
    ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000003a1',
     '00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000004b1.webp', 'image/webp', 10)$$,
  '23503', null, 'B no puede adjuntar archivos a páginas de A'
);

-- 13. El medidor de B solo cuenta lo suyo
select is((select archivos from public.mi_espacio()), 0::bigint, 'El medidor de B no ve el espacio de A');

-- 14. Los adjuntos no se editan desde la app
insert into public.paginas (id, user_id, titulo) values ('00000000-0000-0000-0000-0000000003b1', '00000000-0000-0000-0000-00000000000b', 'De B');
insert into public.adjuntos (id, user_id, pagina_id, ruta, tipo, tamano) values
  ('00000000-0000-0000-0000-0000000004b2', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000003b1',
   '00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000004b2.webp', 'image/webp', 10);
select throws_ok(
  $$update public.adjuntos set tamano = 1 where id = '00000000-0000-0000-0000-0000000004b2'$$,
  '42501', null, 'Nadie puede achicar el tamaño declarado de un adjunto'
);

reset role;

-- 15. Sin sesión no se puede usar el medidor
set local role anon;
select throws_ok($$select * from public.mi_espacio()$$, '42501', null, 'Sin sesión no hay medidor');
reset role;

select * from finish();
rollback;
