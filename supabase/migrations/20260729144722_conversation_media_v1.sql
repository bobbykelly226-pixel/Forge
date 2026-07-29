-- Forge Conversation Media V1
-- Canonical private attachment model. UI activation follows in the application release.

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (mime_type in (
    'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  )),
  file_size bigint not null check (file_size between 1 and 10485760),
  attachment_kind text not null check (attachment_kind in ('photo', 'file')),
  width integer null,
  height integer null,
  position smallint not null default 0 check (position between 0 and 3),
  created_at timestamptz not null default now(),
  constraint message_attachments_dimensions check (
    (
      attachment_kind = 'photo'
      and width between 1 and 12000
      and height between 1 and 12000
    )
    or (attachment_kind = 'file' and width is null and height is null)
  )
);

create index if not exists message_attachments_message_position_idx
  on public.message_attachments (message_id, position, id);
create index if not exists message_attachments_conversation_idx
  on public.message_attachments (conversation_id, created_at desc);

alter table public.message_attachments enable row level security;
revoke all on public.message_attachments from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'conversation-attachments', 'conversation-attachments', false, 10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.forge_can_access_conversation_attachments(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    join public.connections conn on conn.id = c.connection_id
    join public.conversation_participants cp
      on cp.conversation_id = c.id and cp.user_id = p_user_id
    where c.id = p_conversation_id
      and c.status = 'active'
      and conn.status = 'active'
      and not public.forge_users_blocked(
        p_user_id,
        case when conn.user_a_id = p_user_id then conn.user_b_id else conn.user_a_id end
      )
  );
$$;

revoke all on function public.forge_can_access_conversation_attachments(uuid, uuid)
  from public, anon, authenticated;

drop policy if exists "Active participants read conversation attachments" on storage.objects;
create policy "Active participants read conversation attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'conversation-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and public.forge_can_access_conversation_attachments(
    ((storage.foldername(name))[1])::uuid,
    (select auth.uid())
  )
);

drop policy if exists "Active participants upload conversation attachments" on storage.objects;
create policy "Active participants upload conversation attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'conversation-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.forge_can_access_conversation_attachments(
    ((storage.foldername(name))[1])::uuid,
    (select auth.uid())
  )
);

drop policy if exists "Senders delete unsent conversation attachments" on storage.objects;
create policy "Senders delete unsent conversation attachments"
on storage.objects for delete to authenticated
using (
  bucket_id = 'conversation-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.forge_can_access_conversation_attachments(
    ((storage.foldername(name))[1])::uuid,
    (select auth.uid())
  )
  and not exists (
    select 1 from public.message_attachments a where a.storage_path = name
  )
);

create or replace function public.get_conversation_attachment_access(p_attachment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_attachment public.message_attachments%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  select * into v_attachment from public.message_attachments where id = p_attachment_id;
  if v_attachment.id is null
     or not public.forge_can_access_conversation_attachments(v_attachment.conversation_id, v_uid)
  then
    return jsonb_build_object('ok', false, 'message', 'Attachment is unavailable.');
  end if;
  return jsonb_build_object('ok', true, 'attachment', to_jsonb(v_attachment));
end;
$$;

revoke all on function public.get_conversation_attachment_access(uuid) from public, anon;
grant execute on function public.get_conversation_attachment_access(uuid) to authenticated;

create or replace function public.send_conversation_message_with_attachments(
  p_conversation_id uuid,
  p_body text,
  p_client_message_id uuid default null,
  p_attachments jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_peer uuid;
  v_body text := trim(coalesce(p_body, ''));
  v_message public.messages%rowtype;
  v_attachment jsonb;
  v_count integer;
  v_position smallint;
  v_kind text;
  v_actor_name text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if jsonb_typeof(coalesce(p_attachments, '[]'::jsonb)) <> 'array' then
    return jsonb_build_object('ok', false, 'message', 'Attachments are invalid.');
  end if;
  v_count := jsonb_array_length(coalesce(p_attachments, '[]'::jsonb));
  if char_length(v_body) < 1 and v_count < 1 then
    return jsonb_build_object('ok', false, 'message', 'Add a message or attachment.');
  end if;
  if char_length(v_body) > 2000 or v_count > 4 then
    return jsonb_build_object('ok', false, 'message', 'Message or attachment limit exceeded.');
  end if;
  if not public.forge_can_access_conversation_attachments(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  if p_client_message_id is not null then
    select * into v_message from public.messages
    where conversation_id = p_conversation_id and client_message_id = p_client_message_id;
    if v_message.id is not null then
      return jsonb_build_object(
        'ok', true, 'message_id', v_message.id, 'created_at', v_message.created_at,
        'body', v_message.body, 'attachments', coalesce((
          select jsonb_agg(to_jsonb(a) order by a.position, a.id)
          from public.message_attachments a where a.message_id = v_message.id
        ), '[]'::jsonb), 'duplicate', true
      );
    end if;
  end if;

  for v_attachment in select value from jsonb_array_elements(p_attachments)
  loop
    v_kind := case when (v_attachment->>'mime_type') like 'image/%' then 'photo' else 'file' end;
    if (v_attachment->>'storage_path') not like p_conversation_id::text || '/' || v_uid::text || '/%'
       or (v_attachment->>'storage_path') like '%..%'
       or char_length(coalesce(v_attachment->>'file_name', '')) not between 1 and 255
       or (v_attachment->>'file_name') ~ '[[:cntrl:]/\\\\]'
       or (v_attachment->>'mime_type') not in (
         'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'text/plain'
       )
       or (v_attachment->>'file_size')::bigint not between 1 and 10485760
       or (v_kind = 'photo' and (
         (v_attachment->>'width')::integer not between 1 and 12000
         or (v_attachment->>'height')::integer not between 1 and 12000
       ))
       or not exists (
         select 1 from storage.objects o
         where o.bucket_id = 'conversation-attachments'
           and o.name = v_attachment->>'storage_path'
           and o.owner_id = v_uid::text
           and o.metadata->>'mimetype' = v_attachment->>'mime_type'
           and o.metadata->>'size' = v_attachment->>'file_size'
       )
    then
      return jsonb_build_object('ok', false, 'message', 'One or more uploads could not be verified.');
    end if;
  end loop;

  select case when conn.user_a_id = v_uid then conn.user_b_id else conn.user_a_id end
  into v_peer
  from public.conversations c join public.connections conn on conn.id = c.connection_id
  where c.id = p_conversation_id;

  perform set_config('forge.allow_system_writes', 'on', true);
  insert into public.messages (conversation_id, sender_id, body, client_message_id)
  values (p_conversation_id, v_uid, v_body, p_client_message_id)
  returning * into v_message;

  for v_attachment, v_position in
    select value, (ordinality - 1)::smallint
    from jsonb_array_elements(p_attachments) with ordinality
  loop
    v_kind := case when (v_attachment->>'mime_type') like 'image/%' then 'photo' else 'file' end;
    insert into public.message_attachments (
      message_id, conversation_id, sender_id, storage_path, file_name, mime_type,
      file_size, attachment_kind, width, height, position
    ) values (
      v_message.id, p_conversation_id, v_uid, v_attachment->>'storage_path',
      v_attachment->>'file_name', v_attachment->>'mime_type',
      (v_attachment->>'file_size')::bigint, v_kind,
      nullif(v_attachment->>'width', '')::integer,
      nullif(v_attachment->>'height', '')::integer, v_position
    );
  end loop;

  update public.conversations
  set last_message_at = v_message.created_at, updated_at = now()
  where id = p_conversation_id;
  update public.conversation_participants
  set last_read_at = v_message.created_at
  where conversation_id = p_conversation_id and user_id = v_uid;

  v_actor_name := public.forge_notification_actor_first_name(v_uid);
  perform public.forge_create_notification(
    v_peer, v_uid, 'new_message'::public.notification_type,
    case
      when v_count = 1 and (p_attachments->0->>'mime_type') like 'image/%'
        and char_length(v_body) = 0 then v_actor_name || ' sent you a photo.'
      when v_count > 0 and char_length(v_body) = 0 then v_actor_name || ' sent you a file.'
      else v_actor_name || ' sent you a message.'
    end,
    'message'::public.notification_entity_type, v_message.id,
    '/connections/c/' || p_conversation_id::text
  );

  return jsonb_build_object(
    'ok', true, 'message_id', v_message.id, 'created_at', v_message.created_at,
    'body', v_message.body, 'attachments', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.position, a.id)
      from public.message_attachments a where a.message_id = v_message.id
    ), '[]'::jsonb), 'duplicate', false
  );
end;
$$;

revoke all on function public.send_conversation_message_with_attachments(uuid, text, uuid, jsonb)
  from public, anon;
grant execute on function public.send_conversation_message_with_attachments(uuid, text, uuid, jsonb)
  to authenticated;
