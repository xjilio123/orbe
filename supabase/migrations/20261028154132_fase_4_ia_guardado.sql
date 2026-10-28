-- =========================================================
-- Orbe · Fase 4 · Resultados de IA que se muestran en Hoy (plan del día y resumen semanal)
-- Una fila por persona y tipo, que se reemplaza: volver a abrir Hoy no gasta otro uso de IA.
-- =========================================================

create table public.ia_guardado (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  clave text not null check (clave in ('plan', 'semana')),
  fecha date not null,
  datos jsonb not null check (jsonb_typeof(datos) = 'object' and pg_column_size(datos) <= 65536),
  creado timestamptz not null default now(),
  primary key (user_id, clave)
);

alter table public.ia_guardado enable row level security;
create policy "ia_guardado_select_propio" on public.ia_guardado
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ia_guardado_insert_propio" on public.ia_guardado
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ia_guardado_update_propio" on public.ia_guardado
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.ia_guardado from anon;
revoke delete on public.ia_guardado from authenticated;
