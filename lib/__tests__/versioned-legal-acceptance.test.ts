import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  CURRENT_LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_KEYS,
  hasAllRequiredLegalAcknowledgements,
} from '@/lib/legal/documents';

const migration = readFileSync(
  'supabase/migrations/20260821165451_versioned_legal_and_sensitive_data_acceptance.sql',
  'utf8'
);
const proxy = readFileSync('proxy.ts', 'utf8');
const acceptancePage = readFileSync('app/legal/acceptance/page.tsx', 'utf8');
const acceptanceAction = readFileSync('app/actions/legal-acceptance.ts', 'utf8');
const acceptanceForm = readFileSync('components/legal/LegalAcceptanceForm.tsx', 'utf8');
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

  it('requires all four distinct acknowledgements', () => {
    assert.equal(hasAllRequiredLegalAcknowledgements([...LEGAL_DOCUMENT_KEYS]), true);
    assert.equal(hasAllRequiredLegalAcknowledgements(['terms', 'privacy']), false);
    assert.equal(
      hasAllRequiredLegalAcknowledgements(['terms', 'privacy', 'community_standards', 'terms']),
      false
    );
  });

  it('stores server-timestamped, version-specific acceptance evidence', () => {
    assert.match(migration, /create table public\.legal_document_versions/);
    assert.match(migration, /create table public\.member_legal_acceptances/);
    assert.match(migration, /accepted_at timestamptz not null default now\(\)/);
    assert.match(migration, /unique \(user_id, document_version_id\)/);
    assert.match(migration, /where is_current/);
  });

  it('uses RLS, least privilege, and authenticated user identity', () => {
    assert.match(migration, /member_legal_acceptances enable row level security/);
    assert.match(migration, /revoke all on table public\.member_legal_acceptances from public, anon, authenticated/);
    assert.match(migration, /v_user_id uuid := \(select auth\.uid\(\)\)/);
    assert.match(migration, /security definer[\s\S]*set search_path = pg_catalog, public/);
    assert.match(migration, /grant execute on function public\.accept_current_legal_documents\(\) to authenticated/);
    assert.match(migration, /v_source constant text := 'legal_acceptance_gate'/);
    assert.match(migration, /member_legal_acceptances_document_version_id_idx/);
    assert.doesNotMatch(migration, /grant insert on table public\.member_legal_acceptances to authenticated/);
  });

  it('gates member features while leaving operator routes separate', () => {
    assert.match(proxy, /isMemberFeatureRoute = isProtectedRoute && !pathname\.startsWith\('\/internal'\)/);
    assert.match(proxy, /has_current_legal_acceptance/);
    assert.match(proxy, /redirectUrl\.pathname = '\/legal\/acceptance'/);
  });

  it('authenticates, validates all acknowledgements, and records through the RPC', () => {
    assert.match(acceptancePage, /supabase\.auth\.getUser\(\)/);
    assert.match(acceptanceAction, /hasAllRequiredLegalAcknowledgements/);
    assert.match(acceptanceAction, /accept_current_legal_documents/);
    assert.match(acceptanceForm, /Accept and continue/);
    assert.match(acceptanceForm, /Open document in a new tab/);
  });

  it('shows the same current version on the public Terms and Privacy pages', () => {
    assert.match(termsPage, /getLegalDocument\('terms'\)/);
    assert.match(privacyPage, /getLegalDocument\('privacy'\)/);
    assert.match(termsPage, /Version \{document\.version\}/);
    assert.match(privacyPage, /Version \{document\.version\}/);
  });

  it('gives every legal document the established Forge legal-page styling', () => {
    assert.match(legalDocumentShell, /legal-document-content h2/);
    assert.match(legalDocumentShell, /font-size: 1\.875rem/);
    assert.match(legalDocumentShell, /legal-document-content ul/);
    assert.match(legalDocumentShell, /list-style-type: disc/);
    assert.match(legalDocumentShell, /forgedinlife-header-light\.png/);
    assert.match(legalDocumentShell, /© 2026 Forged In Life\. All rights reserved\./);
  });
});
