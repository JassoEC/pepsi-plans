-- Stable, revocable invitation tokens and guest room access.
-- Existing one-way hashes are copied so previously shared invitations remain valid.

create table public.room_invite_tokens (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token_hash text not null unique
    check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index room_invite_tokens_room_id_idx
  on public.room_invite_tokens(room_id);

insert into public.room_invite_tokens (room_id, token_hash)
select id, invite_token_hash
  from public.rooms
 where invite_token_hash is not null
on conflict (token_hash) do nothing;

alter table public.room_invite_tokens enable row level security;
revoke all on public.room_invite_tokens from public, anon, authenticated;

create or replace function public.register_room_invite_token(
  p_token text,
  p_room_id uuid,
  p_invite_token text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  target_room public.rooms;
  token_digest text;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128
     or p_invite_token is null or length(p_invite_token) < 40
     or length(p_invite_token) > 128 then
    raise exception 'Invalid token' using errcode = '22023';
  end if;

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
     and host_user_id = guest.id
     and expires_at > now()
     and status <> 'expired'
   for update;

  if not found then
    raise exception 'Moment not found or host access denied' using errcode = '42501';
  end if;

  token_digest := encode(sha256(convert_to(p_invite_token, 'UTF8')), 'hex');

  insert into public.room_invite_tokens (room_id, token_hash)
  values (target_room.id, token_digest)
  on conflict (token_hash) do nothing;

  if not exists (
    select 1 from public.room_invite_tokens
     where room_id = target_room.id
       and token_hash = token_digest
       and revoked_at is null
  ) then
    raise exception 'Invitation token could not be registered'
      using errcode = '23505';
  end if;

  return true;
end;
$$;

create or replace function public.get_guest_moment_by_invite_token(
  p_invite_token text,
  p_guest_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_room public.rooms;
  guest_id uuid;
  result jsonb;
begin
  if p_invite_token is null or length(p_invite_token) < 40
     or length(p_invite_token) > 128 then
    return null;
  end if;

  select r.* into target_room
    from public.room_invite_tokens it
    join public.rooms r on r.id = it.room_id
   where it.token_hash = encode(sha256(convert_to(p_invite_token, 'UTF8')), 'hex')
     and it.revoked_at is null
     and r.expires_at > now()
     and r.status <> 'expired';

  if not found then
    return null;
  end if;

  if p_guest_token is not null and length(p_guest_token) between 32 and 128 then
    select id into guest_id
      from public.users
     where identity_token_hash = encode(sha256(convert_to(p_guest_token, 'UTF8')), 'hex')
       and expires_at > now();
  end if;

  select jsonb_build_object(
    'id', target_room.id,
    'title', target_room.title,
    'status', target_room.status,
    'expires_at', target_room.expires_at,
    'vibe_name', v.name,
    'is_participant', exists (
      select 1 from public.room_participants rp
       where rp.room_id = target_room.id and rp.user_id = guest_id
    ),
    'participant_count', (
      select count(*) from public.room_participants rp where rp.room_id = target_room.id
    ),
    'plans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'position', rp.position,
          'title', rp.snapshot->>'title',
          'category', rp.snapshot->>'category',
          'neighborhood', rp.snapshot->>'neighborhood',
          'budget_label', rp.snapshot->>'budget_label',
          'short_insight', rp.snapshot->>'short_insight',
          'description', rp.snapshot->>'description'
        ) order by rp.position
      )
      from public.room_plans rp
      where rp.room_id = target_room.id
    ), '[]'::jsonb)
  ) into result
  from public.vibes v
  where v.id = target_room.vibe_id;

  return result;
end;
$$;

create or replace function public.join_guest_moment(
  p_invite_token text,
  p_guest_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest public.users;
  target_room public.rooms;
begin
  if p_invite_token is null or length(p_invite_token) < 40
     or length(p_invite_token) > 128
     or p_guest_token is null or length(p_guest_token) < 32
     or length(p_guest_token) > 128 then
    raise exception 'Invalid invitation or guest token' using errcode = '22023';
  end if;

  select * into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_guest_token, 'UTF8')), 'hex')
     and expires_at > now()
   for update;

  if not found then
    raise exception 'Guest identity not found or expired' using errcode = '28000';
  end if;

  select r.* into target_room
    from public.room_invite_tokens it
    join public.rooms r on r.id = it.room_id
   where it.token_hash = encode(sha256(convert_to(p_invite_token, 'UTF8')), 'hex')
     and it.revoked_at is null
     and r.expires_at > now()
     and r.status <> 'expired'
   for update of r;

  if not found then
    raise exception 'Invitation is invalid or expired' using errcode = 'P0002';
  end if;

  insert into public.room_participants (room_id, user_id)
  values (target_room.id, guest.id)
  on conflict (room_id, user_id) do nothing;

  update public.users set last_seen_at = now() where id = guest.id;

  return target_room.id;
end;
$$;

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
  result jsonb;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    return null;
  end if;

  select * into guest
    from public.users
   where identity_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and expires_at > now();

  if not found then return null; end if;

  select r.* into target_room
    from public.rooms r
    join public.room_participants rp on rp.room_id = r.id
   where r.id = p_room_id
     and rp.user_id = guest.id
     and r.expires_at > now()
     and r.status <> 'expired';

  if not found then return null; end if;

  select jsonb_build_object(
    'id', target_room.id,
    'title', target_room.title,
    'status', target_room.status,
    'expires_at', target_room.expires_at,
    'vibe_name', v.name,
    'is_host', target_room.host_user_id = guest.id,
    'participant_count', (
      select count(*) from public.room_participants rp where rp.room_id = target_room.id
    ),
    'plans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'position', rp.position,
          'title', rp.snapshot->>'title',
          'category', rp.snapshot->>'category',
          'neighborhood', rp.snapshot->>'neighborhood',
          'budget_label', rp.snapshot->>'budget_label',
          'short_insight', rp.snapshot->>'short_insight',
          'description', rp.snapshot->>'description'
        ) order by rp.position
      )
      from public.room_plans rp
      where rp.room_id = target_room.id
    ), '[]'::jsonb)
  ) into result
  from public.vibes v
  where v.id = target_room.vibe_id;

  return result;
end;
$$;

revoke all on function public.register_room_invite_token(text, uuid, text)
  from public, authenticated;
revoke all on function public.get_guest_moment_by_invite_token(text, text)
  from public, authenticated;
revoke all on function public.join_guest_moment(text, text)
  from public, authenticated;
revoke all on function public.get_guest_moment(text, uuid)
  from public, authenticated;

grant execute on function public.register_room_invite_token(text, uuid, text) to anon;
grant execute on function public.get_guest_moment_by_invite_token(text, text) to anon;
grant execute on function public.join_guest_moment(text, text) to anon;
grant execute on function public.get_guest_moment(text, uuid) to anon;
