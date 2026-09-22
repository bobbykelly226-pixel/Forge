import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  CURRENT_LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_KEYS,
  hasAllRequiredLegalAcknowledgements,
  isLegalDocumentKey,
} from '@/lib/legal/documents';

const foundationMigration = readFileSync(
  'supabase/migrations/20260821165451_versioned_legal_and_sensitive_data_acceptance.sql',
  'utf8'
);
const streamlinedMigration = readFileSync(
  'supabase/migrations/20260911194006_streamline_legal_document_acceptance.sql',
  'utf8'
);
const proxy = readFileSync('proxy.ts', 'utf8');
const acceptancePage = readFileSync('app/legal/acceptance/page.tsx', 'utf8');
const acceptanceAction = readFileSync('app/actions/legal-acceptance.ts', 'utf8');
const acceptanceForm = readFileSync('components/legal/LegalAcceptanceForm.tsx', 'utf8');
const acceptanceButton = readFileSync(
  'components/legal/LegalDocumentAcceptanceAction.tsx',
  'utf8'
);
const acceptanceLoader = readFileSync('lib/data/legal-acceptance.ts', 'utf8');
const legalDocumentShell = readFileSync('components/legal/LegalDocumentShell.tsx', 'utf8');
const termsPage = readFileSync('app/terms/page.tsx', 'utf8');
const privacyPage = readFileSync('app/privacy/page.tsx', 'utf8');

describe('versioned legal and sensitive-data acceptance', () => {
  it('defines one current version for every required document', () => {
    assert.deepEqual(
      CURRENT_LEGAL_DOCUMENTS.map((document) => document.key),
      [...LEGAL_DOCUMENT_KEYS]
    );
    assert.equal(new Set(CURRENT_LEGAL_DOCUMENTS.map((document) => document.version)).size, 1);
    assert.equal(CURRENT_LEGAL_DOCUMENTS[0]?.version, '2026-08-21');
  });

  it('uses exact affirmative action copy for all four documents', () => {
    assert.deepEqual(
      CURRENT_LEGAL_DOCUMENTS.map((document) => document.acceptanceAction),
      [
        'I Agree to the Terms of Service',
        'I Acknowledge the Privacy Policy',
        'I Agree to the Community Standards',
        'I Consent to Sensitive Data Processing',
      ]
    );
  });

  it('recognizes only the four legal document keys', () => {
    for (const key of LEGAL_DOCUMENT_KEYS) assert.equal(isLegalDocumentKey(key), true);
    assert.equal(isLegalDocumentKey('unknown'), false);
  });

  it('requires all four distinct acknowledgements', () => {
    assert.equal(hasAllRequiredLegalAcknowledgements([...LEGAL_DOCUMENT_KEYS]), true);
    assert.equal(hasAllRequiredLegalAcknowledgements(['terms', 'privacy']), false);
    assert.equal(
      hasAllRequiredLegalAcknowledgements(['terms', 'privacy', 'community_standards', 'terms']),
      false
    );
  });

  it('stores server-timestamped, version-specific acceptance evidence', () => {
    assert.match(foundationMigration, /accepted_at timestamptz not null default now\(\)/);
    assert.match(foundationMigration, /unique \(user_id, document_version_id\)/);
    assert.match(streamlinedMigration, /where version\.document_key = p_document_key[\s\S]*and version\.is_current/);
    assert.match(streamlinedMigration, /v_source constant text := 'legal_document_review'/);
  });

  it('uses an authenticated, least-privilege, hardened per-document RPC', () => {
    assert.match(streamlinedMigration, /v_user_id uuid := \(select auth\.uid\(\)\)/);
    assert.match(streamlinedMigration, /security definer[\s\S]*set search_path = ''/);
    assert.match(streamlinedMigration, /revoke all on function public\.accept_current_legal_document\(text\) from public, anon/);
    assert.match(streamlinedMigration, /grant execute on function public\.accept_current_legal_document\(text\) to authenticated/);
  });

  it('makes repeat acceptance idempotent', () => {
    assert.match(streamlinedMigration, /on conflict \(user_id, document_version_id\) do nothing/);
  });

  it('rejects unknown keys in both the server action and database function', () => {
    assert.match(acceptanceAction, /isLegalDocumentKey\(documentKey\)/);
    assert.match(streamlinedMigration, /if p_document_key not in/);
    assert.match(streamlinedMigration, /Unknown legal document/);
  });

  it('gates member features while leaving operator routes separate', () => {
    assert.match(proxy, /isMemberFeatureRoute = isProtectedRoute && !pathname\.startsWith\('\/internal'\)/);
    assert.match(proxy, /has_current_legal_acceptance/);
    assert.match(proxy, /redirectUrl\.pathname = '\/legal\/acceptance'/);
  });

  it('loads persisted current-version acceptance state for each document', () => {
    assert.match(acceptanceLoader, /from\('legal_document_versions'\)/);
    assert.match(acceptanceLoader, /from\('member_legal_acceptances'\)/);
    assert.match(acceptanceLoader, /acceptedKeys/);
    assert.match(acceptancePage, /initialAcceptedKeys=\{status\.acceptedKeys\}/);
  });

  it('shows all documents with Accepted or Not reviewed state', () => {
    assert.match(acceptanceForm, /CURRENT_LEGAL_DOCUMENTS\.map/);
    assert.match(acceptanceForm, /isAccepted \? 'Accepted' : 'Not reviewed'/);
    assert.match(acceptanceForm, /isAccepted \? 'Review again' : 'Review and accept'/);
  });

  it('locks Continue to Forge until every current document is accepted', () => {
    assert.match(acceptanceForm, /const allAccepted = CURRENT_LEGAL_DOCUMENTS\.every/);
    assert.match(acceptanceForm, /Continue to Forge/);
    assert.match(
      acceptanceForm,
      /allAccepted[\s\S]*<a[\s\S]*href=\{redirectTo\}[\s\S]*Continue to Forge/
    );
    assert.match(acceptanceForm, /type="button"[\s\S]*disabled/);
    assert.doesNotMatch(acceptancePage, /if \(status\.accepted\)[\s\S]*redirect\(redirectTo\)/);
  });

  it('accepts at the end of each document and automatically returns to the gate', () => {
    assert.match(acceptanceButton, /acceptCurrentLegalDocument\(documentKey\)/);
    assert.match(acceptanceButton, /router\.replace\(returnTo\)/);
    assert.match(acceptanceButton, /candidate\.pathname !== '\/legal\/acceptance'/);
    assert.match(legalDocumentShell, /<LegalDocumentAcceptanceAction documentKey=\{documentKey\} \/>/);
    assert.match(termsPage, /<LegalDocumentAcceptanceAction documentKey=\{document\.key\} \/>/);
    assert.match(privacyPage, /<LegalDocumentAcceptanceAction documentKey=\{document\.key\} \/>/);
  });

  it('shows the same current versions on the public legal pages', () => {
    assert.match(termsPage, /getLegalDocument\('terms'\)/);
    assert.match(privacyPage, /getLegalDocument\('privacy'\)/);
    assert.match(termsPage, /Version \{document\.version\}/);
    assert.match(privacyPage, /Version \{document\.version\}/);
  });
});
