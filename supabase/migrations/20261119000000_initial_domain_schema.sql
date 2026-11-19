-- Initial Pepsi Plans domain schema.
-- Temporary browser identities are application-managed; they are not Supabase Auth users.

create type public.room_status as enum (
  'draft',
  'ready',
  'voting',
  'completed',
  'expired'
);

create type public.vote_action as enum (
  'dislike',
  'like',
  'boost'
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  identity_token_hash text not null unique
    check (identity_token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table public.vibes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_key text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint vibes_validity_window
    check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references public.users(id) on delete restrict,
  vibe_id uuid not null references public.vibes(id) on delete restrict,
  status public.room_status not null default 'draft',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  constraint rooms_completed_at_matches_status
    check (status <> 'completed' or completed_at is not null)
);

create table public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete restrict,
  boost_used_at timestamptz,
  joined_at timestamptz not null default now(),
  constraint room_participants_room_user_unique unique (room_id, user_id),
  constraint room_participants_id_room_unique unique (id, room_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  vibe_id uuid not null references public.vibes(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text not null check (char_length(btrim(category)) between 1 and 40),
  neighborhood text,
  budget_label text,
  image_key text,
  short_insight text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.room_plans (
  room_id uuid not null references public.rooms(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  position smallint not null check (position between 1 and 10),
  -- Immutable copy of the plan content when the room enters voting.
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (room_id, plan_id),
  constraint room_plans_position_unique unique (room_id, position)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  room_participant_id uuid not null,
  plan_id uuid not null,
  action public.vote_action not null,
  created_at timestamptz not null default now(),
  constraint votes_participant_room_fk
    foreign key (room_participant_id, room_id)
    references public.room_participants(id, room_id) on delete cascade,
  constraint votes_room_plan_fk
    foreign key (room_id, plan_id)
    references public.room_plans(room_id, plan_id) on delete cascade,
  constraint votes_one_per_participant_and_plan
    unique (room_participant_id, plan_id)
);

-- A participant can use at most one Boost per room. The partial unique index
-- is the final concurrency-safe guard; the trigger also records its use.
create unique index votes_one_boost_per_participant
  on public.votes (room_participant_id)
  where action = 'boost';

create index rooms_host_user_id_idx on public.rooms(host_user_id);
create index rooms_vibe_id_idx on public.rooms(vibe_id);
create index plans_vibe_id_idx on public.plans(vibe_id);
create index rooms_status_expires_at_idx on public.rooms(status, expires_at);
create index room_participants_user_id_idx on public.room_participants(user_id);
create index room_plans_plan_id_idx on public.room_plans(plan_id);
create index votes_room_id_idx on public.votes(room_id);
create index votes_plan_id_idx on public.votes(plan_id);

create or replace function public.validate_vote_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.room_status;
begin
  select r.status
    into current_status
    from public.rooms as r
   where r.id = new.room_id
   for update;

  if current_status is distinct from 'voting'::public.room_status then
    raise exception 'Votes can only be submitted while a room is voting'
      using errcode = 'check_violation';
  end if;

  if new.action = 'boost' then
    update public.room_participants
       set boost_used_at = now()
     where id = new.room_participant_id
       and room_id = new.room_id
       and boost_used_at is null;

    if not found then
      raise exception 'This participant has already used their Boost'
        using errcode = 'unique_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger votes_validate_before_insert
before insert on public.votes
for each row execute function public.validate_vote_insert();

-- RLS is enabled on every application table. Only the public plan catalog is
-- readable through the publishable key. Room and vote operations are server-only
-- until the temporary-identity authorization layer is implemented.
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.plans enable row level security;
alter table public.vibes enable row level security;
alter table public.room_plans enable row level security;
alter table public.votes enable row level security;

revoke all on public.users, public.rooms, public.room_participants,
  public.plans, public.room_plans, public.votes, public.vibes
  from public, anon, authenticated;

grant select on public.plans, public.vibes to anon, authenticated;
grant all on public.users, public.rooms, public.room_participants,
  public.plans, public.room_plans, public.votes, public.vibes
  to service_role;

create policy "Active plans are readable by everyone"
  on public.plans
  for select
  to anon, authenticated
  using (is_active);

create policy "Active Vibes are readable by everyone"
  on public.vibes
  for select
  to anon, authenticated
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

revoke all on function public.validate_vote_insert()
  from public, anon, authenticated;
),
  description text,
  image_key text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint vibes_validity_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references public.users(id) on delete restrict,
  vibe_id uuid not null references public.vibes(id) on delete restrict,
  status public.room_status not null default 'draft',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  constraint rooms_completed_at_matches_status
    check (status <> 'completed' or completed_at is not null)
);

create table public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete restrict,
  boost_used_at timestamptz,
  joined_at timestamptz not null default now(),
  constraint room_participants_room_user_unique unique (room_id, user_id),
  constraint room_participants_id_room_unique unique (id, room_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text not null check (char_length(btrim(category)) between 1 and 40),
  neighborhood text,
  budget_label text,
  image_key text,
  short_insight text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.room_plans (
  room_id uuid not null references public.rooms(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  position smallint not null check (position between 1 and 10),
  -- Immutable copy of the plan content when the room enters voting.
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (room_id, plan_id),
  constraint room_plans_position_unique unique (room_id, position)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  room_participant_id uuid not null,
  plan_id uuid not null,
  action public.vote_action not null,
  created_at timestamptz not null default now(),
  constraint votes_participant_room_fk
    foreign key (room_participant_id, room_id)
    references public.room_participants(id, room_id) on delete cascade,
  constraint votes_room_plan_fk
    foreign key (room_id, plan_id)
    references public.room_plans(room_id, plan_id) on delete cascade,
  constraint votes_one_per_participant_and_plan
    unique (room_participant_id, plan_id)
);

-- A participant can use at most one Boost per room. The partial unique index
-- is the final concurrency-safe guard; the trigger also records its use.
create unique index votes_one_boost_per_participant
  on public.votes (room_participant_id)
  where action = 'boost';

create index rooms_host_user_id_idx on public.rooms(host_user_id);
create index rooms_status_expires_at_idx on public.rooms(status, expires_at);
create index room_participants_user_id_idx on public.room_participants(user_id);
create index room_plans_plan_id_idx on public.room_plans(plan_id);
create index votes_room_id_idx on public.votes(room_id);
create index votes_plan_id_idx on public.votes(plan_id);

create or replace function public.validate_vote_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.room_status;
begin
  select r.status
    into current_status
    from public.rooms as r
   where r.id = new.room_id
   for update;

  if current_status is distinct from 'voting'::public.room_status then
    raise exception 'Votes can only be submitted while a room is voting'
      using errcode = 'check_violation';
  end if;

  if new.action = 'boost' then
    update public.room_participants
       set boost_used_at = now()
     where id = new.room_participant_id
       and room_id = new.room_id
       and boost_used_at is null;

    if not found then
      raise exception 'This participant has already used their Boost'
        using errcode = 'unique_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger votes_validate_before_insert
before insert on public.votes
for each row execute function public.validate_vote_insert();

-- RLS is enabled on every application table. Only the public plan catalog is
-- readable through the publishable key. Room and vote operations are server-only
-- until the temporary-identity authorization layer is implemented.
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.plans enable row level security;
alter table public.room_plans enable row level security;
alter table public.votes enable row level security;

revoke all on public.users, public.rooms, public.room_participants,
  public.plans, public.room_plans, public.votes
  from public, anon, authenticated;

grant select on public.plans to anon, authenticated;
grant all on public.users, public.rooms, public.room_participants,
  public.plans, public.room_plans, public.votes
  to service_role;

create policy "Active plans are readable by everyone"
  on public.plans
  for select
  to anon, authenticated
  using (is_active);

revoke all on function public.validate_vote_insert()
  from public, anon, authenticated;
