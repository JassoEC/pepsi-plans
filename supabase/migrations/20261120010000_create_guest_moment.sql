-- Persist a guest-created Moment atomically.
-- The browser supplies the 24-hour expiry; the database validates it and
-- commits the room, host participant, and selected plans as one transaction.

create or replace function public.create_guest_moment(
  p_token text,
  p_vibe_id uuid,
  p_plan_ids uuid[],
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
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    raise exception 'Invalid guest identity token' using errcode = '22023';
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
    select 1
      from public.vibes
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

  insert into public.rooms (host_user_id, vibe_id, status, expires_at)
  values (guest.id, p_vibe_id, 'draft', p_expires_at)
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

revoke all on function public.create_guest_moment(text, uuid, uuid[], timestamptz)
  from public, authenticated;
grant execute on function public.create_guest_moment(text, uuid, uuid[], timestamptz)
  to anon;
