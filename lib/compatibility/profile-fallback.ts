import type { CompatibilityEngineResult } from '@/lib/compatibility/types';

/**
 * Profile fields can provide useful context while questionnaire coverage is low,
 * but they are too small a sample to justify Forge's strongest label.
 */
export function constrainProfileFallbackAlignment(
  result: CompatibilityEngineResult
): CompatibilityEngineResult {
  if (result.alignment.key !== 'strong_alignment') {
    return {
      ...result,
      dataNote:
        result.dataNote ??
        'This early view uses public profile details while both Compatibility Profiles are still incomplete.',
    };
  }

  return {
    ...result,
    alignment: {
      key: 'promising_alignment',
      label: 'Promising Alignment',
      summary:
        'Your public profile details show encouraging common ground. Forge needs more completed Compatibility Profile answers before it can responsibly call this Strong Alignment.',
    },
    dataNote:
      'This early view uses public profile details while both Compatibility Profiles are still incomplete.',
  };
}
