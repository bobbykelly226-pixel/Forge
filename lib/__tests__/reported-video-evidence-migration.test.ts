import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../../supabase/migrations/20260916221606_reported_video_evidence.sql', import.meta.url),
  'utf8'
);

test('reported video evidence is private, bounded, and service-only', () => {
  assert.match(migration, /create table public\.reported_video_evidence/);
  assert.match(migration, /alter table public\.reported_video_evidence enable row level security/);
  assert.match(migration, /revoke all on table public\.reported_video_evidence from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.reported_video_evidence to service_role/);
  assert.match(migration, /'reported-video-evidence'[\s\S]*false,[\s\S]*10485760/);
  assert.match(migration, /array\['video\/mp4', 'video\/webm'\]/);
  assert.doesNotMatch(migration, /create policy[\s\S]*reported-video-evidence/);
});

test('preserved source identifiers survive message and account cleanup', () => {
  assert.match(migration, /source_attachment_id uuid not null/);
  assert.match(migration, /source_message_id uuid not null/);
  assert.match(migration, /source_sender_id uuid not null/);
  assert.doesNotMatch(migration, /source_(?:attachment|message|sender)_id uuid[^,\n]*references/);
  assert.match(migration, /report_id uuid not null references public\.user_reports \(id\) on delete restrict/);
});
