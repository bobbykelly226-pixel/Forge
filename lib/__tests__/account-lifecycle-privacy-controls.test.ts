import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('account lifecycle and privacy controls', () => {
  const migration = read('supabase/migrations/20260822120000_account_lifecycle_privacy_controls.sql');

  it('creates private lifecycle, recent-auth, export-token, and audit storage', () => {
    assert.match(migration, /create table if not exists public\.account_lifecycle_state/);
    assert.match(migration, /create table if not exists public\.account_lifecycle_events/);
    assert.match(migration, /create table if not exists public\.account_recent_auth_verifications/);
    assert.match(migration, /create table if not exists public\.account_export_tokens/);
    assert.match(migration, /enable row level security/g);
    assert.match(migration, /account_lifecycle_events_immutable/);
  });

  it('binds recent authentication to a live Supabase session', () => {
    assert.match(migration, /join auth\.sessions session/);
    assert.match(migration, /auth\.jwt\(\) ->> 'session_id'/);
    assert.match(migration, /verification\.expires_at > now\(\)/);
    assert.match(migration, /session\.not_after is null or session\.not_after > now\(\)/);
  });

  it('keeps pause reversible but blocks Discovery and sensitive actions', () => {
    assert.match(migration, /p_action not in \('pause', 'resume', 'deactivate', 'reactivate'\)/);
    assert.match(migration, /v_requires_recent_auth := p_action in \('deactivate', 'reactivate'\)/);
    assert.match(migration, /status not in \('paused', 'hidden', 'deactivated'\)/);
    assert.match(migration, /v_status in \('paused', 'deactivated', 'hidden'\)/);
  });

  it('preserves legal, safety, and audit evidence during deletion', () => {
    assert.match(migration, /if v_state\.legal_hold_active/);
    assert.match(migration, /delete from public\.profile_private_details/);
    assert.match(migration, /delete from public\.message_attachments/);
    assert.match(migration, /update public\.messages[\s\S]*\[Deleted by member\]/);
    assert.doesNotMatch(migration, /delete from public\.member_legal_acceptances/);
    assert.doesNotMatch(migration, /delete from public\.user_reports/);
    assert.doesNotMatch(migration, /delete from public\.operator_report_events/);
  });

  it('uses password confirmation, explicit delete confirmation, and soft Auth deletion', () => {
    const actions = read('app/actions/account-lifecycle.ts');
    assert.match(actions, /signInWithPassword/);
    assert.match(actions, /confirmation.*!== 'DELETE'/);
    assert.match(actions, /deleteUser\([\s\S]*true/);
    assert.match(actions, /signOut\(\{ scope: 'global' \}\)/);
  });

  it('presents member controls and MFA-protected operator governance separately', () => {
    const member = read('components/profile/AccountLifecyclePanel.tsx');
    const operatorPage = read('app/internal/account-governance/page.tsx');
    const operatorAction = read('app/actions/account-governance.ts');
    assert.match(member, /Pause your profile/);
    assert.match(member, /Download your data/);
    assert.match(member, /Permanently delete account/);
    assert.match(operatorPage, /getOperatorMfaState/);
    assert.match(operatorAction, /isForgeOperatorUser/);
    assert.match(operatorAction, /set_account_governance/);
  });
});
