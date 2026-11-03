-- =========================================================
-- Orbe · Inicio y fin: tareas, fechas importantes y exámenes con fecha y hora de inicio y de fin.
-- Lo que ya existía (fecha, hora) pasa a ser el inicio: nada guardado cambia.
-- Fin vacío = termina el mismo día. El fin nunca va antes del inicio.
-- =========================================================

-- ---------- Tareas ----------
alter table public.tareas
  add column fecha_fin date,
  add column hora_fin time,
  -- Solo se guarda si es un día posterior al inicio (el mismo día se guarda vacío).
  add constraint fecha_fin_despues check (fecha_fin is null or (fecha is not null and fecha_fin > fecha)),
  add constraint hora_fin_con_hora check (hora_fin is null or hora is not null),
  -- El mismo día, la hora de fin va después de la de inicio.
  add constraint hora_fin_despues check (hora_fin is null or fecha_fin is not null or hora_fin > hora);

grant update (fecha_fin, hora_fin) on public.tareas to authenticated;

-- La regla de siempre (subtareas, repetición, aviso, papelera) más el plazo:
-- sin fecha no hay fin, sin hora no hay hora de fin y el fin igual al inicio se guarda vacío.
-- La siguiente vez de una tarea que se repite conserva su duración.
create or replace function private.antes_de_guardar_tarea()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  nueva uuid;
  siguiente date;
begin
  if new.padre_id is not null and exists (
    select 1 from public.tareas where id = new.padre_id and padre_id is not null
  ) then
    raise exception 'Las subtareas no pueden tener subtareas';
  end if;

  if new.fecha is null or new.fecha_fin = new.fecha then
    new.fecha_fin = null;
  end if;
  if new.hora is null then
    new.hora_fin = null;
  end if;

  if new.estado = 'hecha' and (tg_op = 'INSERT' or old.estado <> 'hecha') then
    new.hecha_en = now();
    if tg_op = 'UPDATE' and new.repetir is not null and new.fecha is not null then
      siguiente = private.siguiente_fecha(new.fecha, new.repetir, (now() at time zone 'America/Lima')::date);
      insert into public.tareas (user_id, lista_id, titulo, notas, prioridad, fecha, hora, fecha_fin, hora_fin, aviso, repetir, orden)
      values (
        new.user_id, new.lista_id, new.titulo, new.notas, new.prioridad,
        siguiente, new.hora,
        case when new.fecha_fin is null then null else siguiente + (new.fecha_fin - new.fecha) end,
        new.hora_fin, new.aviso, new.repetir, new.orden
      )
      returning id into nueva;
      insert into public.tareas (user_id, padre_id, titulo, notas, prioridad)
        select user_id, nueva, titulo, notas, prioridad from public.tareas
        where padre_id = new.id and borrado_en is null order by creado;
      new.repetir = null;
    end if;
  elsif new.estado <> 'hecha' then
    new.hecha_en = null;
  end if;

  -- El aviso llega a la hora de inicio.
  if new.fecha is not null and new.hora is not null and new.aviso is not null
     and new.estado <> 'hecha' and new.padre_id is null and new.borrado_en is null then
    new.avisar_en = ((new.fecha + new.hora) at time zone 'America/Lima') - make_interval(mins => new.aviso);
  else
    new.avisar_en = null;
  end if;
  if tg_op = 'INSERT' or new.avisar_en is distinct from old.avisar_en then
    new.avisado_en = case when new.avisar_en < now() - interval '1 minute' then now() end;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizado = now();
  end if;
  return new;
end;
$$;

-- Para la Agenda: tareas que terminan dentro o después del rango que se mira.
create index tareas_fecha_fin_idx on public.tareas (user_id, fecha_fin) where fecha_fin is not null;

-- ---------- Fechas importantes y exámenes ----------
alter table public.fechas_importantes
  add column hora time,
  add column fecha_fin date,
  add column hora_fin time,
  add constraint fecha_fin_despues check (fecha_fin is null or fecha_fin > fecha),
  add constraint hora_fin_con_hora check (hora_fin is null or hora is not null),
  add constraint hora_fin_despues check (hora_fin is null or fecha_fin is not null or hora_fin > hora);

-- ---------- Atajo de Siri: ahora también con fin ----------
-- Igual que capturar_con_clave, más fecha y hora de fin. Un fin que no tiene sentido se ignora
-- (mejor guardar la tarea sin fin que perder lo que se dictó).
create or replace function public.anotar_con_clave(
  p_clave text,
  p_titulo text,
  p_fecha date default null,
  p_hora time default null,
  p_fecha_fin date default null,
  p_hora_fin time default null,
  p_prioridad integer default 0,
  p_lista text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  k public.claves_atajo%rowtype;
  ahora timestamptz := now();
  titulo text := left(btrim(coalesce(p_titulo, '')), 200);
  lista uuid;
  v_hora time := case when p_fecha is not null then p_hora end;
  v_fecha_fin date := case when p_fecha is not null and p_fecha_fin > p_fecha then p_fecha_fin end;
  v_hora_fin time;
begin
  if p_clave is null or char_length(p_clave) not between 20 and 100 then
    raise exception 'CLAVE_INVALIDA';
  end if;
  select * into k from public.claves_atajo
    where hash = encode(extensions.digest(p_clave, 'sha256'), 'hex')
    for update;
  if not found then
    raise exception 'CLAVE_INVALIDA';
  end if;

  if k.ventana is null or k.ventana < ahora - interval '1 hour' then
    update public.claves_atajo set ventana = ahora, usos_ventana = 1, ultimo_uso = ahora where id = k.id;
  elsif k.usos_ventana >= 30 then
    raise exception 'DEMASIADAS';
  else
    update public.claves_atajo set usos_ventana = usos_ventana + 1, ultimo_uso = ahora where id = k.id;
  end if;

  if titulo = '' then
    raise exception 'SIN_TEXTO';
  end if;

  if v_hora is not null and p_hora_fin is not null and (v_fecha_fin is not null or p_hora_fin > v_hora) then
    v_hora_fin = p_hora_fin;
  end if;

  if p_lista is not null and btrim(p_lista) <> '' then
    select id into lista from public.listas
      where user_id = k.user_id and lower(btrim(nombre)) = lower(btrim(p_lista))
      limit 1;
  end if;

  insert into public.tareas (user_id, titulo, fecha, hora, fecha_fin, hora_fin, prioridad, lista_id)
  values (k.user_id, titulo, p_fecha, v_hora, v_fecha_fin, v_hora_fin, greatest(0, least(3, coalesce(p_prioridad, 0))), lista);
  return titulo;
end;
$$;

revoke all on function public.anotar_con_clave(text, text, date, time, date, time, integer, text) from public;
grant execute on function public.anotar_con_clave(text, text, date, time, date, time, integer, text) to anon, authenticated;
-- La versión anterior queda sin uso: nadie puede llamarla.
revoke all on function public.capturar_con_clave(text, text, date, time, integer, text) from public, anon, authenticated;
