-- Host-led Moment detail and voting flow.
-- The host is already a room participant at creation, so they can vote like everyone else.

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
   where id = p_room_id
     and expires_at > now()
     and status <> 'expired';

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
    'status', target_room.status,
    'expires_at', target_room.expires_at,
    'created_at', target_room.created_at,
    'vibe_name', v.name,
    'is_host', target_room.host_user_id = guest.id,
    'participant_count', (
      select count(*) from public.room_participants rp where rp.room_id = target_room.id
    ),
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
            select v.action from public.votes v
             where v.room_id = rp.room_id
               and v.plan_id = rp.plan_id
               and v.room_participant_id = target_participant.id
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

create or replace function public.start_guest_moment_voting(
  p_token text,
  p_room_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  target_room public.rooms;
begin
  select * into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now();

  if not found then
    raise exception 'Guest identity not found or expired' using errcode = '28000';
  end if;

  update public.rooms
     set status = 'voting'
   where id = p_room_id
     and host_user_id = guest.id
     and status in ('draft', 'ready')
     and expires_at > now();

  if not found then
    raise exception 'Moment cannot be started or host access denied'
      using errcode = '42501';
  end if;

  return true;
end;
$$;

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

create or replace function public.close_guest_moment_voting(
  p_token text,
  p_room_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
begin
  select * into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now();

  if not found then
    raise exception 'Guest identity not found or expired' using errcode = '28000';
  end if;

  update public.rooms
     set status = 'completed',
         completed_at = now()
   where id = p_room_id
     and host_user_id = guest.id
     and status = 'voting'
     and expires_at > now();

  if not found then
    raise exception 'Moment cannot be completed or host access denied'
      using errcode = '42501';
  end if;

  return true;
end;
$$;

revoke all on function public.get_guest_moment(text, uuid) from public, authenticated;
revoke all on function public.start_guest_moment_voting(text, uuid) from public, authenticated;
revoke all on function public.submit_guest_moment_vote(text, uuid, uuid, public.vote_action) from public, authenticated;
revoke all on function public.close_guest_moment_voting(text, uuid) from public, authenticated;

grant execute on function public.get_guest_moment(text, uuid) to anon;
grant execute on function public.start_guest_moment_voting(text, uuid) to anon;
grant execute on function public.submit_guest_moment_vote(text, uuid, uuid, public.vote_action) to anon;
grant execute on function public.close_guest_moment_voting(text, uuid) to anon;
