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
