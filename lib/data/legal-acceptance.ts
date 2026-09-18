import { createClient } from '@/lib/supabase/server';
import {
  LEGAL_DOCUMENT_KEYS,
  isLegalDocumentKey,
  type LegalDocumentKey,
} from '@/lib/legal/documents';

export type LegalAcceptanceStatus = {
  accepted: boolean;
  acceptedKeys: LegalDocumentKey[];
  unavailable: boolean;
  message?: string;
};

export async function loadCurrentLegalAcceptance(): Promise<LegalAcceptanceStatus> {
  const supabase = await createClient();
  const { data: versions, error: versionsError } = await supabase
    .from('legal_document_versions')
    .select('id, document_key')
    .eq('is_current', true);

  if (versionsError || !versions || versions.length !== LEGAL_DOCUMENT_KEYS.length) {
    console.error('current legal acceptance lookup failed');
    return {
      accepted: false,
      acceptedKeys: [],
      unavailable: true,
      message: 'Forge could not verify the current legal versions. Please try again.',
    };
  }

  const { data: acceptances, error: acceptancesError } = await supabase
    .from('member_legal_acceptances')
    .select('document_version_id')
    .in('document_version_id', versions.map((version) => version.id));

  if (acceptancesError || !acceptances) {
    console.error('current legal acceptance lookup failed');
    return {
      accepted: false,
      acceptedKeys: [],
      unavailable: true,
      message: 'Forge could not verify the current legal versions. Please try again.',
    };
  }

  const acceptedVersionIds = new Set(
    acceptances.map((acceptance) => acceptance.document_version_id)
  );
  const acceptedKeys = versions
    .filter((version) => acceptedVersionIds.has(version.id))
    .map((version) => version.document_key)
    .filter(isLegalDocumentKey);

  return {
    accepted: acceptedKeys.length === LEGAL_DOCUMENT_KEYS.length,
    acceptedKeys,
    unavailable: false,
  };
}
