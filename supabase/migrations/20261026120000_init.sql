-- WeMeet: modelo de datos (Postgres en Supabase)
-- Se pega tal cual en el SQL Editor de Supabase.
--
-- Cuenta = Supabase Auth (auth.users). Escribir un nombre para responder NO es una cuenta: las respuestas sin cuenta
-- tienen user_id null. Perfil, tags, plantillas y avisos de una cuenta cuelgan de auth.users.
-- La app habla con la base solo desde el servidor (clave service role); el navegador nunca la toca.

-- ---------------------------------------------------------------------------------------------------------------
-- Reuniones
-- ---------------------------------------------------------------------------------------------------------------

create table events (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null check (slug ~ '^[a-z0-9]{4,12}$'),  -- corto, va en el link: /e/x7k2
  title         text not null check (char_length(btrim(title)) between 1 and 80),
  owner_id      uuid references auth.users(id) on delete set null,       -- null si lo creó alguien sin cuenta
  owner_token   text not null,                          -- secreto del creador (cookie): sirve para cerrar la reunión sin cuenta
  timezone      text not null default 'America/Santiago',  -- zona horaria IANA de la reunión
  days          date[] not null check (cardinality(days) >= 1),  -- días elegidos, en la zona de la reunión (pueden pasar de 7)
  start_time    time not null default '09:00',          -- hora de inicio de cada día
  end_time      time not null default '18:00',          -- hora de término; '24:00' es válido ("todo el día")
  slot_minutes  smallint not null default 30 check (slot_minutes in (10, 15, 20, 30, 60)),
  max_key       smallint not null default 0 check (max_key between 0 and 2),  -- integrantes clave que admite
  status        text not null default 'open' check (status in ('open', 'closed')),
  chosen_start  timestamptz,                            -- se llena al cerrar; el bloque dura slot_minutes
  created_at    timestamptz not null default now(),
  closed_at     timestamptz,
  check (end_time > start_time),
  check ((status = 'closed') = (closed_at is not null))
);
-- No hay fecha límite para responder: se descartó (ver registro de decisiones).

-- Horarios que nadie puede marcar (almuerzo, clases). Una regla vale para uno o más de los días de la reunión.
create table blocked_ranges (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  days       date[] not null check (cardinality(days) >= 1),   -- subconjunto de events.days (lo valida la API)
  start_time time not null,
  end_time   time not null,
  check (end_time > start_time)
);

-- Quien respondió. La identidad es el nombre dentro de la reunión: escribir el mismo nombre (sin importar mayúsculas)
-- carga y edita esa respuesta. Es una decisión de diseño (sin contraseñas); el riesgo se acota con límite de peticiones.
create table participants (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  is_key     boolean not null default false,            -- integrante clave
  user_id    uuid references auth.users(id) on delete set null,  -- null si respondió sin cuenta; con cuenta, la reunión sale en su perfil
  created_at timestamptz not null default now(),        -- "Respondida el …" en el perfil
  updated_at timestamptz not null default now()
);
create unique index participants_event_name on participants (event_id, lower(btrim(name)));

-- Una fila por bloque en que la persona puede. Se guarda el instante exacto,
-- así cada quien lo ve en su propia zona horaria.
create table availability (
  participant_id uuid not null references participants(id) on delete cascade,
  slot_start     timestamptz not null,
  primary key (participant_id, slot_start)
);

-- ---------------------------------------------------------------------------------------------------------------
-- Cuenta: tags, plantillas y avisos (todo exige cuenta)
-- ---------------------------------------------------------------------------------------------------------------

-- Los tags son de cada cuenta. Existen mientras estén en alguna reunión o plantilla (un trigger borra los huérfanos).
create table tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name    text not null check (char_length(name) between 1 and 24 and name = btrim(name))
);
create unique index tags_user_name on tags (user_id, lower(name));  -- "ihc" y "IHC" son el mismo tag

-- Un tag puesto por su dueño a una reunión (creada o respondida por esa cuenta).
create table event_tags (
  event_id   uuid not null references events(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, tag_id)
);

-- Plantillas de la cuenta: lo que se repite de una reunión (los días y la zona horaria no).
create table templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 50),
  slot_minutes smallint not null check (slot_minutes in (10, 15, 20, 30, 60)),
  start_time  time not null,
  end_time    time not null,
  max_key     smallint not null default 0 check (max_key between 0 and 2),
  blocked     jsonb not null default '[]',               -- [{"start":"13:00","end":"14:00"}]; valen para todos los días
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_time > start_time),
  check (jsonb_typeof(blocked) = 'array')
);
create unique index templates_user_name on templates (user_id, lower(btrim(name)));

create table template_tags (
  template_id uuid not null references templates(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (template_id, tag_id)
);

-- Avisos por correo ("Notificarme"). Un aviso no se edita: se quita (status 'cancelled') y se pide uno nuevo.
-- kind 'count': cuando respondan target_count personas. 'date' y 'datetime': en notify_at (para 'date', las 09:00 de
-- ese día en la zona de la reunión; lo calcula la API).
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,   -- null si lo pidió alguien sin cuenta
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  kind         text not null check (kind in ('count', 'date', 'datetime')),
  target_count integer check (target_count >= 1),
  notify_at    timestamptz,
  status       text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
  cancel_token text not null default replace(gen_random_uuid()::text, '-', ''),  -- va en el correo: quita el aviso sin cuenta
  created_at   timestamptz not null default now(),
  sent_at      timestamptz,
  check (
    (kind = 'count' and target_count is not null and notify_at is null) or
    (kind in ('date', 'datetime') and notify_at is not null and target_count is null)
  )
);
-- A lo más un aviso pendiente por correo y reunión, y uno por cuenta y reunión (el perfil muestra "Avisar" o "No avisar").
create unique index notifications_pending_email on notifications (event_id, lower(email)) where status = 'pending';
create unique index notifications_pending_user on notifications (event_id, user_id) where status = 'pending' and user_id is not null;

-- ---------------------------------------------------------------------------------------------------------------
-- Reglas que no se pueden saltar desde la app
-- ---------------------------------------------------------------------------------------------------------------

-- Máximo de integrantes clave por reunión.
create function check_key_limit() returns trigger language plpgsql as $$
begin
  if new.is_key and (
    select count(*) from participants p
    where p.event_id = new.event_id and p.is_key and p.id <> new.id
  ) >= (select max_key from events where id = new.event_id) then
    raise exception 'Esta reunión ya tiene el máximo de integrantes clave';
  end if;
  return new;
end $$;

create trigger participants_key_limit
  before insert or update of is_key on participants
  for each row execute function check_key_limit();

-- Hasta 30 tags por cuenta.
create function check_tags_per_user() returns trigger language plpgsql as $$
begin
  if (select count(*) from tags where user_id = new.user_id) >= 30 then
    raise exception 'Una cuenta puede tener hasta 30 tags';
  end if;
  return new;
end $$;

create trigger tags_user_limit before insert on tags
  for each row execute function check_tags_per_user();

-- Hasta 5 tags por reunión (de la misma cuenta) y por plantilla.
create function check_tags_per_event() returns trigger language plpgsql as $$
begin
  if (
    select count(*) from event_tags et join tags t on t.id = et.tag_id
    where et.event_id = new.event_id and t.user_id = (select user_id from tags where id = new.tag_id)
  ) >= 5 then
    raise exception 'Una reunión puede tener hasta 5 tags';
  end if;
  return new;
end $$;

create trigger event_tags_limit before insert on event_tags
  for each row execute function check_tags_per_event();

create function check_tags_per_template() returns trigger language plpgsql as $$
begin
  if (select count(*) from template_tags where template_id = new.template_id) >= 5 then
    raise exception 'Una plantilla puede tener hasta 5 tags';
  end if;
  return new;
end $$;

create trigger template_tags_limit before insert on template_tags
  for each row execute function check_tags_per_template();

-- Un tag deja de existir cuando ya no está en ninguna reunión ni plantilla.
create function purge_orphan_tag() returns trigger language plpgsql as $$
begin
  delete from tags t
  where t.id = old.tag_id
    and not exists (select 1 from event_tags where tag_id = t.id)
    and not exists (select 1 from template_tags where tag_id = t.id);
  return old;
end $$;

create trigger event_tags_purge after delete on event_tags
  for each row execute function purge_orphan_tag();
create trigger template_tags_purge after delete on template_tags
  for each row execute function purge_orphan_tag();

-- ---------------------------------------------------------------------------------------------------------------
-- Vista del perfil: una fila por reunión de la cuenta, creada o respondida (si la creó y la respondió, sale como creada).
-- ---------------------------------------------------------------------------------------------------------------

create view profile_events as
  select e.id as event_id, e.slug, e.title, e.owner_id as user_id, 'creada'::text as role, e.created_at as role_date,
         (select count(*) from participants p where p.event_id = e.id) as response_count
  from events e
  where e.owner_id is not null
  union all
  select e.id, e.slug, e.title, p.user_id, 'respondida', p.created_at,
         (select count(*) from participants q where q.event_id = e.id)
  from participants p join events e on e.id = p.event_id
  where p.user_id is not null and e.owner_id is distinct from p.user_id;

-- ---------------------------------------------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------------------------------------------

create index on events (owner_id);
create index on blocked_ranges (event_id);
create index on participants (event_id);
create index on participants (user_id);
create index on tags (user_id);
create index on event_tags (tag_id);
create index on template_tags (tag_id);
create index on templates (user_id);
create index on notifications (event_id);
create index on notifications (notify_at) where status = 'pending' and kind in ('date', 'datetime');

-- ---------------------------------------------------------------------------------------------------------------
-- Seguridad: con RLS activado y sin políticas, la clave pública no puede leer ni escribir nada;
-- solo el servidor (service role) accede. La vista se cierra a mano porque se salta el RLS de las tablas.
-- ---------------------------------------------------------------------------------------------------------------

alter table events          enable row level security;
alter table blocked_ranges  enable row level security;
alter table participants    enable row level security;
alter table availability    enable row level security;
alter table tags            enable row level security;
alter table event_tags      enable row level security;
alter table templates       enable row level security;
alter table template_tags   enable row level security;
alter table notifications   enable row level security;

revoke all on profile_events from anon, authenticated;
