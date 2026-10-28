-- WeMeet: límite de peticiones y tope de respuestas por reunión.
-- Se pega tal cual en el SQL Editor de Supabase, después de 20261028120000_funciones.sql.

-- ---------------------------------------------------------------------------------------------------------------
-- Límite de peticiones: un contador por "clave" (la ruta y la IP de quien pide, ya convertida en un código) en una ventana de
-- tiempo. Es una función de la base y no una variable en memoria porque Vercel corre en funciones sin memoria compartida.
-- ---------------------------------------------------------------------------------------------------------------

create table rate_limits (
  clave      text primary key,
  hits       integer not null default 0,
  expires_at timestamptz not null
);
alter table rate_limits enable row level security;  -- sin políticas: solo el servidor (service role) la usa
create index on rate_limits (expires_at);

-- Cuenta una petición de `p_clave`. Devuelve true si todavía está dentro del límite (`p_max` por ventana de `p_ventana_segundos`).
-- Pasada la ventana, el contador parte de cero. Es atómica: dos peticiones a la vez no se saltan el límite.
create function rate_limit(p_clave text, p_max integer, p_ventana_segundos integer) returns boolean language plpgsql as $$
declare
  v_hits integer;
begin
  insert into rate_limits (clave, hits, expires_at)
  values (p_clave, 1, now() + make_interval(secs => p_ventana_segundos))
  on conflict (clave) do update set
    hits       = case when rate_limits.expires_at <= now() then 1 else rate_limits.hits + 1 end,
    expires_at = case when rate_limits.expires_at <= now() then now() + make_interval(secs => p_ventana_segundos) else rate_limits.expires_at end
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;

revoke execute on function rate_limit(text, integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- La limpieza diaria también borra los contadores vencidos.
-- ---------------------------------------------------------------------------------------------------------------

create or replace function purge_stale_events() returns integer language plpgsql as $$
declare
  v_borradas integer;
begin
  delete from rate_limits where expires_at < now();

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

-- ---------------------------------------------------------------------------------------------------------------
-- Tope de respuestas por reunión: 300. Editar una respuesta que ya existe sigue permitido; solo se frena a quien llegaría
-- como persona nueva. Es lo que impide llenar una reunión de nombres falsos.
-- ---------------------------------------------------------------------------------------------------------------

create or replace function save_response(
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
    if (select count(*) from participants where event_id = p_event) >= 300 then
      raise exception 'Esta reunión alcanzó el máximo de 300 respuestas';
    end if;
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

revoke execute on function save_response(uuid, text, boolean, uuid, timestamptz[]) from public, anon, authenticated;
