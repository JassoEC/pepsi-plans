-- Add a host-defined title to each Moment.
alter table public.rooms
  add column title text;

update public.rooms r
   set title = v.name
  from public.vibes v
 where v.id = r.vibe_id
   and r.title is null;

alter table public.rooms
  alter column title set not null;

alter table public.rooms
  add constraint rooms_title_length
  check (char_length(btrim(title)) between 1 and 60);

drop function public.create_guest_moment(text, uuid, uuid[], timestamptz);

create function public.create_guest_moment(
  p_token text,
  p_vibe_id uuid,
  p_plan_ids uuid[],
  p_title text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  created_room public.rooms;
  valid_plan_count integer;
  normalized_title text := btrim(p_title);
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    raise exception 'Invalid guest identity token' using errcode = '22023';
  end if;

  if normalized_title is null or char_length(normalized_title) not between 3 and 60 then
    raise exception 'Moment title must contain between 3 and 60 characters'
      using errcode = '22023';
  end if;

  if p_plan_ids is null
     or cardinality(p_plan_ids) not between 2 and 10
     or (select count(distinct selected.plan_id)
           from unnest(p_plan_ids) as selected(plan_id)) <> cardinality(p_plan_ids) then
    raise exception 'A Moment requires between 2 and 10 unique plans'
      using errcode = '22023';
  end if;

  if p_expires_at is null
     or p_expires_at <= now()
     or p_expires_at > now() + interval '24 hours 1 minute' then
    raise exception 'Moment expiration must be within the next 24 hours'
      using errcode = '22023';
  end if;

  select *
    into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now()
   for update;

  if not found then
    raise exception 'Guest identity not found or expired' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.vibes
     where id = p_vibe_id
       and is_active
       and (starts_at is null or starts_at <= now())
       and (ends_at is null or ends_at > now())
  ) then
    raise exception 'Selected Vibe is not available' using errcode = '22023';
  end if;

  select count(*)
    into valid_plan_count
    from public.plans
   where id = any(p_plan_ids)
     and vibe_id = p_vibe_id
     and is_active;

  if valid_plan_count <> cardinality(p_plan_ids) then
    raise exception 'One or more selected plans are unavailable for this Vibe'
      using errcode = '22023';
  end if;

  insert into public.rooms (host_user_id, vibe_id, title, status, expires_at)
  values (guest.id, p_vibe_id, normalized_title, 'draft', p_expires_at)
  returning * into created_room;

  insert into public.room_participants (room_id, user_id)
  values (created_room.id, guest.id);

  insert into public.room_plans (room_id, plan_id, position, snapshot)
  select
    created_room.id,
    selected.plan_id,
    selected.position::smallint,
    jsonb_build_object(
      'title', plan.title,
      'category', plan.category,
      'neighborhood', plan.neighborhood,
      'budget_label', plan.budget_label,
      'image_key', plan.image_key,
      'short_insight', plan.short_insight,
      'description', plan.description
    )
  from unnest(p_plan_ids) with ordinality as selected(plan_id, position)
  join public.plans plan
    on plan.id = selected.plan_id
   and plan.vibe_id = p_vibe_id
   and plan.is_active;

  update public.users
     set last_seen_at = now()
   where id = guest.id;

  return created_room.id;
end;
$$;

revoke all on function public.create_guest_moment(text, uuid, uuid[], text, timestamptz)
  from public, authenticated;
grant execute on function public.create_guest_moment(text, uuid, uuid[], text, timestamptz)
  to anon;

-- Include the host-provided title in both dashboard room collections.
-- Temporary guest identity and dashboard access for shared rooms.
-- The browser only receives an opaque random token; the database stores its SHA-256 hash.

create or replace function public.register_guest_identity(p_token text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  normalized_name text := btrim(p_name);
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    raise exception 'Invalid guest identity token' using errcode = '22023';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 1 and 32 then
    raise exception 'Nickname must contain between 1 and 32 characters' using errcode = '22023';
  end if;

  insert into public.users (name, identity_token_hash, expires_at)
  values (
    normalized_name,
    encode(sha256(convert_to(p_token, 'UTF8')), 'hex'),
    now() + interval '30 days'
  )
  on conflict (identity_token_hash) do update
    set name = excluded.name,
        last_seen_at = now(),
        expires_at = now() + interval '30 days'
  returning * into guest;

  return jsonb_build_object('id', guest.id, 'name', guest.name);
end;
$$;

create or replace function public.get_guest_dashboard(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  hosted jsonb;
  joined jsonb;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    return null;
  end if;

  select *
    into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now();

  if not found then
    return null;
  end if;

  update public.users set last_seen_at = now()
   where id = guest.id;

  select coalesce(jsonb_agg(room_row order by (room_row->>'created_at') desc), '[]'::jsonb)
    into hosted
    from (
      select jsonb_build_object(
        'id', r.id,
        'title', r.title,
        'vibe_name', v.name,
        'status', r.status,
        'created_at', r.created_at,
        'expires_at', r.expires_at,
        'participant_count', (
          select count(*) from public.room_participants rp where rp.room_id = r.id
        ),
        'plan_count', (
          select count(*) from public.room_plans rpl where rpl.room_id = r.id
        ),
        'kind', 'hosted'
      ) as room_row
      from public.rooms r
      join public.vibes v on v.id = r.vibe_id
      where r.host_user_id = guest.id
        and r.status <> 'expired'
      order by r.created_at desc
      limit 50
    ) rooms_query;

  select coalesce(jsonb_agg(room_row order by (room_row->>'created_at') desc), '[]'::jsonb)
    into joined
    from (
      select jsonb_build_object(
        'id', r.id,
        'title', r.title,
        'vibe_name', v.name,
        'status', r.status,
        'created_at', r.created_at,
        'expires_at', r.expires_at,
        'participant_count', (
          select count(*) from public.room_participants rp where rp.room_id = r.id
        ),
        'plan_count', (
          select count(*) from public.room_plans rpl where rpl.room_id = r.id
        ),
        'kind', 'joined'
      ) as room_row
      from public.room_participants mine
      join public.rooms r on r.id = mine.room_id
      join public.vibes v on v.id = r.vibe_id
      where mine.user_id = guest.id
        and r.host_user_id <> guest.id
        and r.status <> 'expired'
      order by r.created_at desc
      limit 50
    ) rooms_query;

  return jsonb_build_object(
    'user', jsonb_build_object('id', guest.id, 'name', guest.name),
    'hosted', hosted,
    'joined', joined
  );
end;
$$;

revoke all on function public.register_guest_identity(text, text) from public, authenticated;
revoke all on function public.get_guest_dashboard(text) from public, authenticated;
grant execute on function public.register_guest_identity(text, text) to anon;
grant execute on function public.get_guest_dashboard(text) to anon;

