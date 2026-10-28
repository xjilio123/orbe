-- Pruebas de los vectores de búsqueda por significado (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

insert into private.correos_permitidos (email) values ('a@prueba.local'), ('b@prueba.local');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.local');
insert into public.paginas (id, user_id, titulo) values
  ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-00000000000a', 'SQL');
-- Como lo haría la Edge Function (conexión del sistema).
insert into public.vectores (pagina_id, user_id, trozo, texto, vector)
  values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-00000000000a', 0, 'SQL',
          (select array_agg(0.05::real) from generate_series(1, 384))::extensions.halfvec);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::integer from public.vectores), 1, 'A ve sus vectores');
select throws_ok(
  $$insert into public.vectores (pagina_id, user_id, trozo, texto, vector)
    values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-00000000000a', 1, 'x',
            (select array_agg(0.05::real) from generate_series(1, 384))::extensions.halfvec)$$,
  '42501', null, 'Nadie escribe vectores desde la app'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::integer from public.vectores), 0, 'B no ve los vectores de A');
reset role;

-- Al borrar la página para siempre se van sus vectores.
delete from public.paginas where id = '00000000-0000-0000-0000-0000000006a1';
select is((select count(*)::integer from public.vectores), 0, 'Los vectores se borran con su página');

select * from finish();
rollback;
