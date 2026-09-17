import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../../supabase/migrations/20260917015310_conversation_video_view_once.sql', import.meta.url),
  'utf8'
);
const recorder = readFileSync(
  new URL('../../components/conversations/VideoRecorder.tsx', import.meta.url),
  'utf8'
);
const player = readFileSync(
  new URL('../../components/conversations/VideoMessage.tsx', import.meta.url),
  'utf8'
);
const action = readFileSync(
  new URL('../../app/actions/view-once-video.ts', import.meta.url),
  'utf8'
);
const validationRoute = readFileSync(
  new URL('../../app/api/conversation-video/validate/route.ts', import.meta.url),
  'utf8'
);

test('view once is stored only on video attachments and retains a viewed marker', () => {
  assert.match(migration, /add column view_once boolean not null default false/);
  assert.match(migration, /add column viewed_at timestamptz/);
  assert.match(migration, /not view_once or mime_type in \('video\/mp4', 'video\/webm'\)/);
  assert.doesNotMatch(migration, /delete from public\.message_attachments/);
  assert.doesNotMatch(migration, /storage\.objects[\s\S]*delete/);
});

test('member storage access cannot bypass server mediated View Once opening', () => {
  assert.match(migration, /Authorized participants read reusable conversation attachments/);
  assert.match(migration, /public\.forge_storage_path_is_reusable_attachment\(name\)/);
  assert.match(migration, /where a\.storage_path = p_path[\s\S]*and not a\.view_once/);
  assert.match(migration, /revoke all on function public\.forge_storage_path_is_reusable_attachment\(text\)[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /or v_attachment\.view_once[\s\S]*Attachment is unavailable/);
  assert.match(validationRoute, /get_video_upload_for_validation[\s\S]*createServiceClient\(\)[\s\S]*admin\.storage/);
});

test('the recipient claims first playback atomically and cannot claim it twice', () => {
  assert.match(migration, /create or replace function public\.open_view_once_video/);
  assert.match(migration, /where id = p_attachment_id[\s\S]*for update/);
  assert.match(migration, /v_attachment\.sender_id = v_uid/);
  assert.match(migration, /if v_attachment\.viewed_at is not null/);
  assert.match(migration, /set viewed_at = v_viewed_at/);
  assert.match(migration, /revoke all on function public\.open_view_once_video\(uuid\) from public, anon/);
  assert.match(migration, /grant execute on function public\.open_view_once_video\(uuid\) to authenticated/);
});

test('the server issues only a short private playback URL', () => {
  assert.match(action, /\.rpc\('open_view_once_video'/);
  assert.match(action, /createServiceClient\(\)/);
  assert.match(action, /\.createSignedUrl\(path, 45\)/);
  assert.doesNotMatch(action, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
});

test('the recorder explains both delivery choices and capture limitation', () => {
  assert.match(recorder, /Keep in conversation/);
  assert.match(recorder, /View Once/);
  assert.match(recorder, /They may still be able to record their screen/);
});

test('the player replaces completed View Once media with a viewed marker', () => {
  assert.match(player, /Open View Once video/);
  assert.match(player, /onEnded=\{\(\) => \{ if \(viewOnce\)/);
  assert.match(player, /Video viewed/);
  assert.match(player, /no longer available/);
});
