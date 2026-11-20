-- Moments are open for voting as soon as they are created.
-- Expiration is derived from expires_at; only the host can close early.

create or replace function public.create_guest_moment(
  p_token text,
  p_vibe_id uuid,
  p_plan_ids uuid[],
  p_title text,
  p_invite_token text,
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

  if p_invite_token is null
     or length(p_invite_token) < 40
     or length(p_invite_token) > 128 then
    raise exception 'Invalid Moment invitation token' using errcode = '22023';
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

  select * into guest
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

  select count(*) into valid_plan_count
    from public.plans
   where id = any(p_plan_ids)
     and vibe_id = p_vibe_id
     and is_active;

  if valid_plan_count <> cardinality(p_plan_ids) then
    raise exception 'One or more selected plans are unavailable for this Vibe'
      using errcode = '22023';
  end if;

  insert into public.rooms (
    host_user_id, vibe_id, title, invite_token_hash, status, expires_at
  )
  values (
    guest.id, p_vibe_id, normalized_title,
    encode(sha256(convert_to(p_invite_token, 'UTF8')), 'hex'),
    'voting', p_expires_at
  )
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

  update public.users set last_seen_at = now() where id = guest.id;
  return created_room.id;
end;
$$;

revoke all on function public.create_guest_moment(text, uuid, uuid[], text, text, timestamptz)
  from public, authenticated;
grant execute on function public.create_guest_moment(text, uuid, uuid[], text, text, timestamptz)
  to anon;

-- Existing draft/ready rooms become immediately votable as well.
update public.rooms
   set status = 'voting'
 where status in ('draft', 'ready')
   and expires_at > now();

-- The old activation step is no longer part of the lifecycle.
drop function if exists public.start_guest_moment_voting(text, uuid);

create or replace function public.submit_guest_moment_vote(
  p_token text,
  p_room_id uuid,
  p_plan_id uuid,
  p_action public.vote_action
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  target_participant public.room_participants;
  target_room public.rooms;
begin
  select * into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now();

  if not found then
    raise exception 'Guest identity not found or expired' using errcode = '28000';
  end if;

  select * into target_room
    from public.rooms
   where id = p_room_id
     and status = 'voting'
     and expires_at > now()
   for update;

  if not found then
    raise exception 'Moment is not accepting votes' using errcode = 'check_violation';
  end if;

  select * into target_participant
    from public.room_participants
   where room_id = p_room_id
     and user_id = guest.id;

  if not found then
    raise exception 'Join this Moment before voting' using errcode = '42501';
  end if;

  insert into public.votes (room_id, room_participant_id, plan_id, action)
  values (p_room_id, target_participant.id, p_plan_id, p_action);

  update public.users set last_seen_at = now() where id = guest.id;
  return true;
end;
$$;

-- Keep expired Moments visible in the dashboard with an accurate derived status.
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

  select * into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now();

  if not found then return null; end if;

  update public.users set last_seen_at = now() where id = guest.id;

  select coalesce(jsonb_agg(room_row order by (room_row->>'created_at') desc), '[]'::jsonb)
    into hosted
    from (
      select jsonb_build_object(
        'id', r.id,
        'vibe_name', v.name,
        'status', case
          when r.expires_at <= now() and r.status not in ('completed', 'expired') then 'expired'
          else r.status::text
        end,
        'created_at', r.created_at,
        'expires_at', r.expires_at,
        'participant_count', (select count(*) from public.room_participants rp where rp.room_id = r.id),
        'plan_count', (select count(*) from public.room_plans rpl where rpl.room_id = r.id),
        'kind', 'hosted'
      ) as room_row
      from public.rooms r
      join public.vibes v on v.id = r.vibe_id
      where r.host_user_id = guest.id
      order by r.created_at desc
      limit 50
    ) rooms_query;

  select coalesce(jsonb_agg(room_row order by (room_row->>'created_at') desc), '[]'::jsonb)
    into joined
    from (
      select jsonb_build_object(
        'id', r.id,
        'vibe_name', v.name,
        'status', case
          when r.expires_at <= now() and r.status not in ('completed', 'expired') then 'expired'
          else r.status::text
        end,
        'created_at', r.created_at,
        'expires_at', r.expires_at,
        'participant_count', (select count(*) from public.room_participants rp where rp.room_id = r.id),
        'plan_count', (select count(*) from public.room_plans rpl where rpl.room_id = r.id),
        'kind', 'joined'
      ) as room_row
      from public.room_participants mine
      join public.rooms r on r.id = mine.room_id
      join public.vibes v on v.id = r.vibe_id
      where mine.user_id = guest.id
        and r.host_user_id <> guest.id
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

revoke all on function public.get_guest_dashboard(text) from public, authenticated;
grant execute on function public.get_guest_dashboard(text) to anon;

-- The detail RPC returns expired rooms too, but voting remains blocked by expiry checks.
create or replace function public.get_guest_moment(
  p_token text,
  p_room_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  target_room public.rooms;
  target_participant public.room_participants;
  result jsonb;
  total_plans integer;
  my_vote_count integer;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    return null;
  end if;

  select * into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now();

  if not found then return null; end if;

  select * into target_room
    from public.rooms
   where id = p_room_id;

  if not found then return null; end if;

  select * into target_participant
    from public.room_participants
   where room_id = target_room.id
     and user_id = guest.id;

  if not found then return null; end if;

  select count(*) into total_plans
    from public.room_plans rp
   where rp.room_id = target_room.id;

  select count(*) into my_vote_count
    from public.votes v
   where v.room_id = target_room.id
     and v.room_participant_id = target_participant.id;

  select jsonb_build_object(
    'id', target_room.id,
    'title', target_room.title,
    'status', case
      when target_room.expires_at <= now() and target_room.status not in ('completed', 'expired') then 'expired'
      else target_room.status::text
    end,
    'expires_at', target_room.expires_at,
    'created_at', target_room.created_at,
    'vibe_name', v.name,
    'is_host', target_room.host_user_id = guest.id,
    'participant_count', (select count(*) from public.room_participants rp where rp.room_id = target_room.id),
    'plan_count', total_plans,
    'my_vote_count', my_vote_count,
    'has_voted', total_plans > 0 and my_vote_count = total_plans,
    'my_boost_used', target_participant.boost_used_at is not null,
    'plans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', rp.plan_id,
          'position', rp.position,
          'title', rp.snapshot->>'title',
          'category', rp.snapshot->>'category',
          'neighborhood', rp.snapshot->>'neighborhood',
          'budget_label', rp.snapshot->>'budget_label',
          'image_key', rp.snapshot->>'image_key',
          'short_insight', rp.snapshot->>'short_insight',
          'description', rp.snapshot->>'description',
          'my_vote', (
            select votes.action from public.votes votes
             where votes.room_id = rp.room_id
               and votes.plan_id = rp.plan_id
               and votes.room_participant_id = target_participant.id
          )
        ) order by rp.position
      )
      from public.room_plans rp
      where rp.room_id = target_room.id
    ), '[]'::jsonb)
  ) into result
  from public.vibes v
  where v.id = target_room.vibe_id;

  update public.users set last_seen_at = now() where id = guest.id;
  return result;
end;
$$;

revoke all on function public.get_guest_moment(text, uuid) from public, authenticated;
grant execute on function public.get_guest_moment(text, uuid) to anon;
