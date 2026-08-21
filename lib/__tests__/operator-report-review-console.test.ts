import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const migration = read('supabase/migrations/20260821133523_operator_report_review_console.sql');
const databaseTest = read('supabase/tests/operator_report_review_console.test.sql');
const page = read('app/internal/report-review/page.tsx');
const action = read('app/actions/report-review.ts');
const loader = read('lib/operator/report-review.ts');
const workspace = read('components/operator/ReportReviewWorkspace.tsx');
const appealAction = read('app/actions/safety-appeal.ts');

describe('operator report-review console', () => {
  it('requires an authenticated allowlisted AAL2 operator before loading case data', () => {
    assert.match(page, /supabase\.auth\.getUser\(\)/);
    assert.match(page, /isForgeOperatorUser\(user\)/);
    assert.match(page, /mfa\.status !== 'verified'/);
    assert.match(page, /operator-security\?redirectTo=\/internal\/report-review/);
    assert.match(page, /loadOperatorReportReview/);
  });

  it('rechecks authorization and MFA inside every operator mutation', () => {
    assert.match(action, /supabase\.auth\.getUser\(\)/);
    assert.match(action, /isForgeOperatorUser\(user\)/);
    assert.match(action, /mfa\.status !== 'verified'/);
    assert.match(action, /rpc\('review_safety_report'/);
  });

  it('keeps case state, audit history, and enforcement records private', () => {
    assert.match(migration, /alter table public\.operator_report_cases enable row level security/);
    assert.match(migration, /alter table public\.operator_report_events enable row level security/);
    assert.match(migration, /alter table public\.operator_member_enforcements enable row level security/);
    assert.match(migration, /revoke all on table public\.operator_report_cases from public, anon, authenticated/);
    assert.match(databaseTest, /members cannot read operator events/);
  });

  it('uses service-role-only atomic review RPCs and append-only events', () => {
    assert.match(migration, /create or replace function public\.review_safety_report/);
    assert.match(migration, /insert into public\.operator_report_events/);
    assert.match(migration, /operator_report_events_immutable/);
    assert.match(migration, /operator_member_enforcements_limit_update/);
    assert.match(migration, /grant execute on function public\.review_safety_report[\s\S]*to service_role/);
    assert.match(migration, /revoke all on function public\.review_safety_report[\s\S]*from public, anon, authenticated/);
  });

  it('provides bounded private evidence links and never exposes storage paths to the browser', () => {
    assert.match(loader, /REPORT_EVIDENCE_URL_TTL_SECONDS = 5 \* 60/);
    assert.match(loader, /createSignedUrl/);
    assert.doesNotMatch(workspace, /storagePath|storage_path/);
    assert.match(workspace, /Signed links expire after five minutes/);
  });

  it('supports the required case states and enforcement actions', () => {
    for (const status of ['pending', 'reviewing', 'resolved', 'dismissed']) {
      assert.match(migration, new RegExp(`'${status}'`));
    }
    for (const enforcement of ['warn', 'restrict', 'suspend', 'remove', 'safety_block']) {
      assert.match(action, new RegExp(`'${enforcement}'`));
      assert.match(workspace, new RegExp(`value="${enforcement}"`));
    }
    assert.match(migration, /operator suspension\/removal/);
    assert.match(migration, /enforcement\.action in \('suspend', 'remove'\)/);
  });

  it('preserves reports and evidence during enforcement', () => {
    assert.doesNotMatch(migration, /delete from public\.(user_reports|report_evidence)/);
    assert.match(migration, /submitted report and evidence preserved/i);
  });

  it('records member notification outcomes and offers guarded appeal intake', () => {
    assert.match(action, /record_safety_member_notification/);
    assert.match(migration, /create table if not exists public\.safety_report_appeals/);
    assert.match(appealAction, /rpc\('submit_safety_report_appeal'/);
    assert.match(migration, /report\.reported_user_id = v_uid/);
  });
});
