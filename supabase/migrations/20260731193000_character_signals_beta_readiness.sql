-- Character Signals beta readiness
-- Positive-only, meaningful-interaction gated, recipient-controlled recognition.

alter table public.character_signals
  add column if not exists connection_id uuid references public.connections (id) on delete cascade;

alter table public.character_signals
  drop constraint if exists character_signals_key_format;

alter table public.character_signals
  add constraint character_signals_approved_key check (
    signal_key in (
      'respectful_communicator',
      'great_listener',
      'clear_intentions',
      'kind_conversation',
      'genuine_and_present',
      'consistent_follow_through',
      'respectful_in_person',
      'handled_mismatch_respectfully'
    )
  );

alter table public.character_signals
  add constraint character_signals_interaction_required check (interaction_type is not null);

alter table public.character_signals
  add constraint character_signals_key_matches_interaction check (
    (interaction_type = 'in_app' and signal_key in (
      'respectful_communicator', 'great_listener', 'clear_intentions',
      'kind_conversation', 'genuine_and_present', 'handled_mismatch_respectfully'
    ))
    or
    (interaction_type = 'in_person' and signal_key in (
      'great_listener', 'clear_intentions', 'genuine_and_present',
      'consistent_follow_through', 'respectful_in_person',
      'handled_mismatch_respectfully'
    ))
  );

create unique index if not exists character_signals_one_per_pair_idx
  on public.character_signals (giver_id, receiver_id);

create index if not exists character_signals_receiver_status_key_idx
  on public.character_signals (receiver_id, status, signal_key);

create table if not exists public.character_signal_display_preferences (
  receiver_id uuid not null references auth.users (id) on delete cascade,
  signal_key text not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (receiver_id, signal_key),
  constraint character_signal_display_preference_key check (
    signal_key in (
      'respectful_communicator',
      'great_listener',
      'clear_intentions',
      'kind_conversation',
      'genuine_and_present',
      'consistent_follow_through',
      'respectful_in_person',
      'handled_mismatch_respectfully'
    )
  )
);

comment on table public.character_signal_display_preferences is
  'Private recipient-controlled visibility for aggregate Character Signals.';

alter table public.character_signals enable row level security;
alter table public.character_signal_display_preferences enable row level security;

drop policy if exists "Participants read character signals" on public.character_signals;
drop policy if exists "Giver creates character signal" on public.character_signals;
drop policy if exists "Receiver responds to character signal" on public.character_signals;

revoke all on table public.character_signals from public, anon, authenticated;
revoke all on table public.character_signal_display_preferences from public, anon, authenticated;

create or replace function public.protect_character_signals_system_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.giver_id := auth.uid();
      new.status := 'pending';
      new.responded_at := null;
    end if;
    if new.giver_id = new.receiver_id then
      raise exception 'character_signals: cannot signal yourself';
    end if;
    return new;
  end if;

  if new.giver_id is distinct from old.giver_id
     or new.receiver_id is distinct from old.receiver_id
     or new.connection_id is distinct from old.connection_id
     or new.signal_key is distinct from old.signal_key
     or new.interaction_type is distinct from old.interaction_type
     or new.interaction_context is distinct from old.interaction_context then
    raise exception 'character_signals: recognition fields are immutable';
  end if;

  new.created_at := old.created_at;
  if auth.uid() is not null then
    if not (
      auth.uid() = old.receiver_id
      and old.status = 'pending'
      and new.status in ('approved', 'declined')
    ) then
      if new.status is distinct from old.status then
        raise exception 'character_signals: status change not permitted';
      end if;
    else
      new.responded_at := coalesce(new.responded_at, now());
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.forge_character_signal_eligible_connection(
  p_giver_id uuid,
  p_receiver_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.id
  from public.connections c
  join public.profiles giver on giver.id = p_giver_id
  join public.profiles receiver on receiver.id = p_receiver_id
  where c.status = 'active'
    and ((c.user_a_id = p_giver_id and c.user_b_id = p_receiver_id)
      or (c.user_a_id = p_receiver_id and c.user_b_id = p_giver_id))
    and giver.age >= 18
    and receiver.age >= 18
    and giver.status <> 'deactivated'
    and receiver.status <> 'deactivated'
    and not public.forge_users_blocked(p_giver_id, p_receiver_id)
    and exists (
      select 1
      from public.conversations conversation
      where conversation.connection_id = c.id
        and exists (
          select 1 from public.messages message
          where message.conversation_id = conversation.id
            and message.sender_id = p_giver_id
        )
        and exists (
          select 1 from public.messages message
          where message.conversation_id = conversation.id
            and message.sender_id = p_receiver_id
        )
    )
  order by c.created_at desc
  limit 1
$$;

revoke all on function public.forge_character_signal_eligible_connection(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.give_character_signal(
  p_receiver_id uuid,
  p_signal_key text,
  p_interaction_type public.character_signal_interaction
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_connection_id uuid;
  v_signal_id uuid;
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return jsonb_build_object('ok', false, 'message', 'Sign in to give a Character Signal.');
  end if;
  if p_receiver_id is null or p_receiver_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'Choose an eligible Forge connection.');
  end if;
  if p_signal_key not in (
    'respectful_communicator', 'great_listener', 'clear_intentions',
    'kind_conversation', 'genuine_and_present', 'consistent_follow_through',
    'respectful_in_person', 'handled_mismatch_respectfully'
  ) then
    return jsonb_build_object('ok', false, 'message', 'Choose an approved positive quality.');
  end if;
  if (p_interaction_type = 'in_app' and p_signal_key not in (
      'respectful_communicator', 'great_listener', 'clear_intentions',
      'kind_conversation', 'genuine_and_present', 'handled_mismatch_respectfully'
    )) or (p_interaction_type = 'in_person' and p_signal_key not in (
      'great_listener', 'clear_intentions', 'genuine_and_present',
      'consistent_follow_through', 'respectful_in_person',
      'handled_mismatch_respectfully'
    )) then
    return jsonb_build_object('ok', false, 'message', 'That quality does not match the interaction type.');
  end if;

  v_connection_id := public.forge_character_signal_eligible_connection(v_uid, p_receiver_id);
  if v_connection_id is null then
    return jsonb_build_object(
      'ok', false,
      'message', 'Character Signals unlock after both people have participated in a Forge conversation.'
    );
  end if;

  if exists (
    select 1 from public.character_signals
    where giver_id = v_uid and receiver_id = p_receiver_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'message', 'You have already recognized this connection during beta.'
    );
  end if;

  insert into public.character_signals (
    giver_id, receiver_id, connection_id, signal_key, interaction_type, interaction_context
  ) values (
    v_uid,
    p_receiver_id,
    v_connection_id,
    p_signal_key,
    p_interaction_type,
    case when p_interaction_type = 'in_person'
      then 'Member confirmed an in-person interaction'
      else 'Verified two-way Forge conversation'
    end
  ) returning id into v_signal_id;

  return jsonb_build_object('ok', true, 'signal_id', v_signal_id);
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'message', 'You have already recognized this connection during beta.'
    );
end;
$$;

create or replace function public.respond_my_character_signal(
  p_signal_id uuid,
  p_visibility text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_signal public.character_signals%rowtype;
  v_count integer;
  v_is_public boolean;
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return jsonb_build_object('ok', false, 'message', 'Sign in to manage Character Signals.');
  end if;
  if p_visibility not in ('public', 'private', 'decline') then
    return jsonb_build_object('ok', false, 'message', 'Choose a valid visibility option.');
  end if;

  select * into v_signal
  from public.character_signals
  where id = p_signal_id and receiver_id = v_uid and status = 'pending'
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'This recognition is no longer awaiting review.');
  end if;

  if p_visibility = 'decline' then
    update public.character_signals
    set status = 'declined', responded_at = now()
    where id = p_signal_id;
    return jsonb_build_object(
      'ok', true,
      'message', 'Recognition declined. It will not count or appear on your profile.'
    );
  end if;

  update public.character_signals
  set status = 'approved', responded_at = now()
  where id = p_signal_id;

  select count(*)::integer into v_count
  from public.character_signals
  where receiver_id = v_uid
    and signal_key = v_signal.signal_key
    and status = 'approved';

  v_is_public := p_visibility = 'public' and v_count >= 3;
  insert into public.character_signal_display_preferences (
    receiver_id, signal_key, is_public, updated_at
  ) values (v_uid, v_signal.signal_key, v_is_public, now())
  on conflict (receiver_id, signal_key) do update
    set is_public = excluded.is_public, updated_at = excluded.updated_at;

  return jsonb_build_object(
    'ok', true,
    'confirmation_count', v_count,
    'is_public', v_is_public,
    'message', case
      when v_is_public then 'This Character Signal is now visible on your profile.'
      when v_count < 3 then 'Recognition accepted privately. Three independent confirmations are required for public display.'
      else 'Recognition accepted and kept private.'
    end
  );
end;
$$;

create or replace function public.set_my_character_signal_visibility(
  p_signal_key text,
  p_is_public boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return jsonb_build_object('ok', false, 'message', 'Sign in to manage Character Signals.');
  end if;
  select count(*)::integer into v_count
  from public.character_signals
  where receiver_id = v_uid and signal_key = p_signal_key and status = 'approved';
  if v_count = 0 then
    return jsonb_build_object('ok', false, 'message', 'No approved recognition was found.');
  end if;
  if p_is_public and v_count < 3 then
    return jsonb_build_object(
      'ok', false,
      'message', 'Three independent confirmations are required for public display.'
    );
  end if;
  insert into public.character_signal_display_preferences (
    receiver_id, signal_key, is_public, updated_at
  ) values (v_uid, p_signal_key, p_is_public, now())
  on conflict (receiver_id, signal_key) do update
    set is_public = excluded.is_public, updated_at = excluded.updated_at;
  return jsonb_build_object(
    'ok', true,
    'message', case when p_is_public
      then 'This Character Signal is now visible on your profile.'
      else 'This Character Signal is now private.'
    end
  );
end;
$$;

create or replace function public.list_my_character_signals()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_signals jsonb;
  v_history jsonb;
  v_recipients jsonb;
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return jsonb_build_object('ok', false, 'message', 'Sign in to view Character Signals.');
  end if;

  with approved as (
    select cs.signal_key, count(*)::integer as confirmation_count,
      coalesce(pref.is_public, false) as is_public
    from public.character_signals cs
    left join public.character_signal_display_preferences pref
      on pref.receiver_id = cs.receiver_id and pref.signal_key = cs.signal_key
    where cs.receiver_id = v_uid and cs.status = 'approved'
    group by cs.signal_key, pref.is_public
  ), pending as (
    select cs.id, cs.signal_key,
      coalesce((select count(*) from public.character_signals approved_signal
        where approved_signal.receiver_id = v_uid
          and approved_signal.signal_key = cs.signal_key
          and approved_signal.status = 'approved'), 0)::integer + 1 as confirmation_count,
      split_part(trim(coalesce(profile.full_name, 'Forge member')), ' ', 1) as recognized_by
    from public.character_signals cs
    left join public.profiles profile on profile.id = cs.giver_id
    where cs.receiver_id = v_uid and cs.status = 'pending'
  ), combined as (
    select 'aggregate-' || approved.signal_key as id, approved.signal_key,
      approved.confirmation_count,
      case
        when approved.confirmation_count < 3 then 'growing'
        when approved.is_public then 'public'
        else 'hidden'
      end as display_status,
      null::text as recognized_by,
      false as can_publish_after_approval
    from approved
    union all
    select pending.id::text, pending.signal_key, pending.confirmation_count, 'pending',
      pending.recognized_by, pending.confirmation_count >= 3
    from pending
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'signalId', signal_key,
    'confirmationCount', confirmation_count,
    'status', display_status,
    'recognizedBy', recognized_by,
    'canPublishAfterApproval', can_publish_after_approval
  ) order by case when display_status = 'pending' then 0 else 1 end, signal_key), '[]'::jsonb)
  into v_signals from combined;

  with activity as (
    select cs.id::text as id, 'given'::text as kind, cs.signal_key,
      case when cs.interaction_type = 'in_person'
        then 'After meeting in person' else 'After an in-app conversation' end as context_label,
      cs.created_at,
      split_part(trim(coalesce(profile.full_name, 'Forge member')), ' ', 1) as recipient_name
    from public.character_signals cs
    left join public.profiles profile on profile.id = cs.receiver_id
    where cs.giver_id = v_uid
    union all
    select cs.id::text, 'received', cs.signal_key,
      case when cs.interaction_type = 'in_person'
        then 'After meeting in person' else 'After an in-app conversation' end,
      coalesce(cs.responded_at, cs.created_at), null::text
    from public.character_signals cs
    where cs.receiver_id = v_uid and cs.status = 'approved'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'kind', kind,
    'signalId', signal_key,
    'contextLabel', context_label,
    'createdAt', created_at,
    'recipientFirstName', recipient_name
  ) order by created_at desc), '[]'::jsonb)
  into v_history from activity;

  with eligible as (
    select distinct on (peer.id)
      peer.id,
      split_part(trim(coalesce(peer.full_name, 'Forge member')), ' ', 1) as first_name
    from public.connections connection
    join public.profiles peer on peer.id = case
      when connection.user_a_id = v_uid then connection.user_b_id else connection.user_a_id end
    where connection.status = 'active'
      and (connection.user_a_id = v_uid or connection.user_b_id = v_uid)
      and public.forge_character_signal_eligible_connection(v_uid, peer.id) = connection.id
      and not exists (
        select 1 from public.character_signals existing
        where existing.giver_id = v_uid and existing.receiver_id = peer.id
      )
    order by peer.id, connection.created_at desc
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'firstName', first_name,
    'defaultInteractionType', 'in_app',
    'contextLabel', 'Two-way Forge conversation'
  ) order by first_name), '[]'::jsonb)
  into v_recipients from eligible;

  return jsonb_build_object(
    'ok', true,
    'signals', v_signals,
    'history', v_history,
    'recipients', v_recipients
  );
end;
$$;

create or replace function public.list_public_character_signals(p_receiver_ids uuid[])
returns table (receiver_id uuid, signal_key text, confirmation_count bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return;
  end if;
  if coalesce(array_length(p_receiver_ids, 1), 0) > 50 then
    raise exception 'A maximum of 50 profiles can be requested.';
  end if;
  return query
    select cs.receiver_id, cs.signal_key, count(*)
    from public.character_signals cs
    join public.character_signal_display_preferences pref
      on pref.receiver_id = cs.receiver_id
      and pref.signal_key = cs.signal_key
      and pref.is_public
    join public.profiles profile on profile.id = cs.receiver_id
    where cs.receiver_id = any(coalesce(p_receiver_ids, array[]::uuid[]))
      and cs.status = 'approved'
      and not public.forge_users_blocked(v_uid, cs.receiver_id)
      and (
        cs.receiver_id = v_uid
        or (profile.status = 'active' and profile.is_discoverable)
        or exists (
          select 1 from public.connections connection
          where connection.status = 'active'
            and ((connection.user_a_id = v_uid and connection.user_b_id = cs.receiver_id)
              or (connection.user_a_id = cs.receiver_id and connection.user_b_id = v_uid))
        )
      )
    group by cs.receiver_id, cs.signal_key
    having count(*) >= 3;
end;
$$;

revoke all on function public.give_character_signal(uuid, text, public.character_signal_interaction)
  from public, anon;
revoke all on function public.respond_my_character_signal(uuid, text)
  from public, anon;
revoke all on function public.set_my_character_signal_visibility(text, boolean)
  from public, anon;
revoke all on function public.list_my_character_signals()
  from public, anon;
revoke all on function public.list_public_character_signals(uuid[])
  from public, anon;

grant execute on function public.give_character_signal(uuid, text, public.character_signal_interaction)
  to authenticated;
grant execute on function public.respond_my_character_signal(uuid, text)
  to authenticated;
grant execute on function public.set_my_character_signal_visibility(text, boolean)
  to authenticated;
grant execute on function public.list_my_character_signals()
  to authenticated;
grant execute on function public.list_public_character_signals(uuid[])
  to authenticated;

comment on function public.give_character_signal(uuid, text, public.character_signal_interaction) is
  'Creates one positive recognition per giver/receiver pair after a verified two-way Forge conversation.';
comment on function public.list_public_character_signals(uuid[]) is
  'Returns only recipient-approved aggregates with at least three independent confirmations.';
