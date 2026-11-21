-- Enrich the Moment detail payload for the social host/guest recap.
-- Positive votes (like + Pepsi Boost) define each plan's popularity bar.
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
    'participants', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', rp.id, 'nickname', participant.name)
        order by participant.name, rp.id
      )
      from public.room_participants rp
      join public.users participant on participant.id = rp.user_id
      where rp.room_id = target_room.id
    ), '[]'::jsonb),
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
          'vote_count', (
            select count(*) from public.votes votes
             where votes.room_id = rp.room_id
               and votes.plan_id = rp.plan_id
               and votes.action in ('like', 'boost')
          ),
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
