import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const migration = read(
  'supabase/migrations/20260818021416_operator_profile_photo_moderation.sql'
);
const access = read('lib/operator/access.ts');
const action = read('app/actions/photo-moderation.ts');
const page = read('app/internal/photo-moderation/page.tsx');
const workspace = read('components/operator/PhotoModerationWorkspace.tsx');

describe('operator profile photo moderation', () => {
  it('fails closed behind a server-only confirmed-email allowlist', () => {
    assert.match(access, /import 'server-only'/);
    assert.match(access, /FORGE_OPERATOR_EMAILS/);
    assert.match(access, /email_confirmed_at/);
    assert.doesNotMatch(access, /NEXT_PUBLIC_/);
  });

  it('hides the operator route from unauthorized members', () => {
    assert.match(page, /redirect\('\/login\?redirectTo=\/internal\/photo-moderation'\)/);
    assert.match(page, /isForgeOperatorUser\(user\)/);
    assert.match(page, /notFound\(\)/);
  });

  it('rechecks operator authorization inside the server action', () => {
    assert.match(action, /supabase\.auth\.getUser\(\)/);
    assert.match(action, /isForgeOperatorUser\(user\)/);
    assert.match(action, /createServiceClient\(\)/);
    assert.match(action, /rpc\('review_profile_photo'/);
  });

  it('exports only an async function from the use-server action module', () => {
    assert.doesNotMatch(action, /export const INITIAL_PHOTO_MODERATION_ACTION_STATE/);
    assert.match(workspace, /const INITIAL_PHOTO_MODERATION_ACTION_STATE/);
  });

  it('requires a bounded reason for rejected photos', () => {
    assert.match(action, /decision === 'rejected'/);
    assert.match(action, /rejectionReason\.length < 3/);
    assert.match(action, /rejectionReason\.length > 500/);
    assert.match(workspace, /maxLength=\{500\}/);
  });

  it('records current review fields and an append-only audit event', () => {
    assert.match(migration, /add column if not exists reviewed_at/);
    assert.match(migration, /add column if not exists reviewed_by/);
    assert.match(migration, /add column if not exists rejection_reason/);
    assert.match(migration, /create table if not exists public\.profile_photo_moderation_events/);
    assert.match(migration, /insert into public\.profile_photo_moderation_events/);
  });

  it('keeps moderation writes service-role-only', () => {
    assert.match(
      migration,
      /revoke all on function public\.review_profile_photo[\s\S]*from public, anon, authenticated/
    );
    assert.match(
      migration,
      /grant execute on function public\.review_profile_photo[\s\S]*to service_role/
    );
    assert.match(
      migration,
      /revoke all on table public\.profile_photo_moderation_events from public, anon, authenticated/
    );
  });

  it('resets review evidence when photo content changes', () => {
    assert.match(migration, /new\.storage_path is distinct from old\.storage_path/);
    assert.match(migration, /new\.moderation_status := 'pending'/);
    assert.match(migration, /new\.reviewed_at := null/);
    assert.match(migration, /new\.reviewed_by := null/);
    assert.match(migration, /new\.rejection_reason := null/);
  });

  it('renders approve and reject controls for pending private photos', () => {
    assert.match(workspace, /value="approved"/);
    assert.match(workspace, /value="rejected"/);
    assert.match(workspace, /photo\.signedUrl/);
    assert.match(workspace, /Operator only/);
  });
});
