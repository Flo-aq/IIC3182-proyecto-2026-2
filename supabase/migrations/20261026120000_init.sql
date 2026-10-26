-- WeMeet: modelo de datos (Postgres en Supabase)
-- Se pega tal cual en el SQL Editor de Supabase.

create table events (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,                  -- corto, va en el link: /e/x7k2
  title         text not null,
  owner_id      uuid references auth.users(id) on delete set null,  -- null si lo creó alguien sin login
  owner_token   text not null,                         -- cookie del creador, para poder cerrar sin login
  timezone      text not null default 'America/Santiago',  -- zona horaria IANA de la reunión
  days          date[] not null,                       -- días candidatos, en la zona horaria de la reunión
  start_time    time not null default '09:00',         -- hora de inicio de cada día
  end_time      time not null default '18:00',         -- hora de término de cada día
  slot_minutes  smallint not null default 30 check (slot_minutes in (10, 15, 20, 30, 60)),
  max_key       smallint not null default 2 check (max_key between 0 and 2),  -- integrantes clave permitidos
  deadline      timestamptz,
  status        text not null default 'open' check (status in ('open', 'closed')),
  chosen_start  timestamptz,                           -- se llena al cerrar; el bloque dura slot_minutes
  created_at    timestamptz not null default now(),
  closed_at     timestamptz,
  check (end_time > start_time)
);

-- Horarios que nadie puede marcar (almuerzo, feriados). day null = aplica a todos los días.
create table blocked_ranges (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  day        date,
  start_time time not null,
  end_time   time not null,
  label      text,
  check (end_time > start_time)
);

-- Integrante clave: alguien cuyo horario delimita la reunión (por ejemplo, profe o ayudante).
-- Solo puede haber hasta events.max_key por reunión.
create table participants (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null,
  is_key     boolean not null default false,
  user_id    uuid references auth.users(id) on delete set null,  -- null si respondió sin login
  token      text not null,                            -- cookie para volver a editar su respuesta
  created_at timestamptz not null default now(),
  unique (event_id, name)
);

-- Una fila por bloque en que la persona puede. Se guarda el instante exacto,
-- así cada quien lo ve en su propia zona horaria.
create table availability (
  participant_id uuid not null references participants(id) on delete cascade,
  slot_start     timestamptz not null,
  primary key (participant_id, slot_start)
);

-- Solo con login.
create table tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name    text not null,
  unique (user_id, name)
);

create table event_tags (
  event_id uuid not null references events(id) on delete cascade,
  tag_id   uuid not null references tags(id) on delete cascade,
  primary key (event_id, tag_id)
);

-- Plantillas guardadas (solo con login): zona horaria, hora de inicio y fin,
-- tamaño de bloque, horarios bloqueados y cantidad de integrantes clave.
create table templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  config     jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

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

create index on events (owner_id);
create index on participants (event_id);
create index on participants (user_id);
create index on blocked_ranges (event_id);

-- La app habla con la base solo desde el servidor (service role).
-- Con RLS activado y sin políticas, la clave pública no puede leer ni escribir nada.
alter table events         enable row level security;
alter table blocked_ranges enable row level security;
alter table participants   enable row level security;
alter table availability   enable row level security;
alter table tags           enable row level security;
alter table event_tags     enable row level security;
alter table templates      enable row level security;
