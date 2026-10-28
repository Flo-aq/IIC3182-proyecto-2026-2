-- WeMeet: funciones que usa el servidor para guardar en un solo paso.
-- Se pega tal cual en el SQL Editor de Supabase, después de 20261026120000_init.sql.
--
-- Supabase no deja hacer varias consultas en una misma transacción desde la app, así que lo que tiene que guardarse
-- junto (una reunión con sus bloqueos; una respuesta con sus bloques) se hace dentro de una función.
-- Solo el servidor (service role) puede llamarlas: se les quita el permiso a todos los demás.

-- Crea la reunión y sus horarios bloqueados. p_blocked: [{"days": ["2026-11-03"], "start": "13:00", "end": "14:00"}].
-- Si el slug ya existe, falla con unique_violation y la app prueba con otro.
create function create_event(
  p_slug        text,
  p_title       text,
  p_owner_id    uuid,
  p_owner_token text,
  p_timezone    text,
  p_days        date[],
  p_start       time,
  p_end         time,
  p_slot        smallint,
  p_max_key     smallint,
  p_blocked     jsonb
) returns uuid language plpgsql as $$
declare
  v_id uuid;
begin
  insert into events (slug, title, owner_id, owner_token, timezone, days, start_time, end_time, slot_minutes, max_key)
  values (p_slug, p_title, p_owner_id, p_owner_token, p_timezone, p_days, p_start, p_end, p_slot, p_max_key)
  returning id into v_id;

  insert into blocked_ranges (event_id, days, start_time, end_time)
  select v_id,
         array(select jsonb_array_elements_text(b -> 'days'))::date[],
         (b ->> 'start')::time,
         (b ->> 'end')::time
  from jsonb_array_elements(coalesce(p_blocked, '[]'::jsonb)) as b;

  return v_id;
end $$;

-- Guarda la respuesta de una persona: la crea o la reemplaza (la identidad es el nombre, sin distinguir mayúsculas).
-- Si pide ser integrante clave y ya no quedan lugares, se guarda igual como participante normal (key_denied = true).
-- Una persona que ya existe mantiene su marca de integrante clave.
create function save_response(
  p_event   uuid,
  p_name    text,
  p_is_key  boolean,
  p_user    uuid,
  p_slots   timestamptz[]
) returns jsonb language plpgsql as $$
declare
  v_name    text := btrim(regexp_replace(p_name, '\s+', ' ', 'g'));
  v_part    uuid;
  v_is_key  boolean;
  v_created boolean := false;
  v_denied  boolean := false;
begin
  select id, is_key into v_part, v_is_key
  from participants
  where event_id = p_event and lower(btrim(name)) = lower(v_name);

  if v_part is null then
    begin
      insert into participants (event_id, name, is_key, user_id)
      values (p_event, v_name, coalesce(p_is_key, false), p_user)
      returning id, is_key into v_part, v_is_key;
      v_created := true;
    exception
      when unique_violation then
        -- Otra petición guardó el mismo nombre justo ahora: se edita esa.
        select id, is_key into v_part, v_is_key
        from participants
        where event_id = p_event and lower(btrim(name)) = lower(v_name);
      when others then
        if p_is_key and sqlerrm like '%máximo de integrantes clave%' then
          insert into participants (event_id, name, is_key, user_id)
          values (p_event, v_name, false, p_user)
          returning id, is_key into v_part, v_is_key;
          v_created := true;
          v_denied := true;
        else
          raise;
        end if;
    end;
  end if;

  if not v_created then
    update participants set updated_at = now(), user_id = coalesce(user_id, p_user) where id = v_part;
  end if;

  delete from availability where participant_id = v_part;
  insert into availability (participant_id, slot_start)
  select v_part, s from (select distinct unnest(p_slots) as s) as t;

  return jsonb_build_object('participant_id', v_part, 'is_key', v_is_key, 'created', v_created, 'key_denied', v_denied);
end $$;

-- Borra las reuniones sin actividad: pasaron 2 meses desde la última respuesta (o desde que se creó, si nadie respondió).
-- Se lleva consigo participantes, bloques, tags y avisos (on delete cascade). Devuelve cuántas borró.
create function purge_stale_events() returns integer language plpgsql as $$
declare
  v_borradas integer;
begin
  with viejas as (
    select e.id
    from events e
    where greatest(e.created_at, coalesce((select max(p.updated_at) from participants p where p.event_id = e.id), e.created_at))
          < now() - interval '2 months'
  ), borradas as (
    delete from events where id in (select id from viejas) returning 1
  )
  select count(*) into v_borradas from borradas;
  return v_borradas;
end $$;

revoke execute on function purge_stale_events() from public, anon, authenticated;
revoke execute on function create_event(text, text, uuid, text, text, date[], time, time, smallint, smallint, jsonb) from public, anon, authenticated;
revoke execute on function save_response(uuid, text, boolean, uuid, timestamptz[]) from public, anon, authenticated;
