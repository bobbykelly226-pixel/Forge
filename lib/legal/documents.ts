export const LEGAL_DOCUMENT_KEYS = [
  'terms',
  'privacy',
  'community_standards',
  'sensitive_data_consent',
] as const;

export type LegalDocumentKey = (typeof LEGAL_DOCUMENT_KEYS)[number];

export type LegalDocumentDefinition = {
  key: LegalDocumentKey;
  title: string;
  shortTitle: string;
  version: string;
  effectiveDate: string;
  href: string;
  acknowledgement: string;
};

export const CURRENT_LEGAL_DOCUMENTS: readonly LegalDocumentDefinition[] = [
  {
    key: 'terms',
    title: 'Terms of Service',
    shortTitle: 'Terms',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    href: '/terms',
    acknowledgement: 'I have read and agree to the Forge Terms of Service.',
  },
  {
    key: 'privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    href: '/privacy',
    acknowledgement: 'I have read and acknowledge the Forge Privacy Policy.',
  },
  {
    key: 'community_standards',
    title: 'Community Standards',
    shortTitle: 'Community Standards',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    href: '/community-standards',
    acknowledgement: 'I agree to follow the Forge Community Standards.',
  },
  {
    key: 'sensitive_data_consent',
    title: 'Sensitive Data Consent',
    shortTitle: 'Sensitive Data',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    href: '/sensitive-data-consent',
    acknowledgement:
      'I consent to Forge processing the sensitive information I choose to provide for matching, profile, safety, and support features.',
  },
] as const;

const REQUIRED_KEYS = new Set<string>(LEGAL_DOCUMENT_KEYS);

export function hasAllRequiredLegalAcknowledgements(keys: readonly string[]): boolean {
  const acknowledged = new Set(keys);
  return acknowledged.size === REQUIRED_KEYS.size &&
    LEGAL_DOCUMENT_KEYS.every((key) => acknowledged.has(key));
}

export function getLegalDocument(key: LegalDocumentKey): LegalDocumentDefinition {
  const document = CURRENT_LEGAL_DOCUMENTS.find((candidate) => candidate.key === key);
  if (!document) {
    throw new Error(`Unknown legal document: ${key}`);
  }
  return document;
}
