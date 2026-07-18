import type { CompatibilityEvaluator, CompatibilityPersonInput } from '../types';
import {
  evaluation,
  hasOpenness,
  insufficient,
  normalizeSlug,
  opennessIncludesAny,
  opennessIsUnknown,
} from '../helpers';

function smokingBand(value: string | null): 'none' | 'light' | 'active' | null {
  const slug = normalizeSlug(value);
  if (!slug) return null;
  if (slug === 'never') return 'none';
  if (slug === 'trying_to_quit' || slug === 'occasionally') return 'light';
  if (slug === 'regularly') return 'active';
  return null;
}

function partnerAcceptsBehavior(
  preferences: string[],
  behavior: string
): 'accept' | 'reject' | 'unknown' {
  if (opennessIsUnknown(preferences)) return 'unknown';
  if (preferences.includes('open_to_any')) return 'accept';

  // Non-smokers are generally acceptable unless someone only listed active-use prefs
  // without does_not_use — still treat never as accept.
  if (behavior === 'never') return 'accept';

  if (behavior === 'trying_to_quit') {
    if (opennessIncludesAny(preferences, ['trying_to_quit', 'does_not_use', 'open_to_any'])) {
      return 'accept';
    }
    if (preferences.some((value) => value.endsWith('_occasionally') || value.endsWith('_regularly'))) {
      return 'accept';
    }
    return preferences.includes('does_not_use') && preferences.length === 1
      ? 'reject'
      : 'unknown';
  }

  const occasionalKeys = [
    'cigarettes_occasionally',
    'cigars_occasionally',
    'vapes_occasionally',
    'cannabis_occasionally',
    'hookah_occasionally',
    'trying_to_quit',
  ];
  const regularKeys = [
    'cigarettes_regularly',
    'cigars_regularly',
    'vapes_regularly',
    'cannabis_regularly',
    'hookah_regularly',
  ];

  if (behavior === 'occasionally') {
    if (preferences.length === 1 && preferences[0] === 'does_not_use') return 'reject';
    return opennessIncludesAny(preferences, [...occasionalKeys, ...regularKeys])
      ? 'accept'
      : 'reject';
  }

  if (behavior === 'regularly') {
    if (preferences.length === 1 && preferences[0] === 'does_not_use') return 'reject';
    return opennessIncludesAny(preferences, regularKeys) ? 'accept' : 'reject';
  }

  return 'unknown';
}

function compareSide(
  opennessOwner: CompatibilityPersonInput,
  behaviorOwner: CompatibilityPersonInput
): 'accept' | 'reject' | 'unknown' | 'no_openness' {
  const behavior = normalizeSlug(behaviorOwner.smoking);
  if (!behavior) return 'unknown';
  if (!hasOpenness(opennessOwner.smokingPartnerPreferences)) return 'no_openness';
  return partnerAcceptsBehavior(opennessOwner.smokingPartnerPreferences, behavior);
}

export const smokingEvaluator: CompatibilityEvaluator = {
  key: 'smoking',
  label: 'Smoking',
  evaluate(viewer, partner) {
    const viewerSmoking = normalizeSlug(viewer.smoking);
    const partnerSmoking = normalizeSlug(partner.smoking);

    if (!viewerSmoking || !partnerSmoking) {
      return insufficient(
        'smoking',
        this.label,
        'Smoking answers need to be completed by both people before Forge can assess this lifestyle area.'
      );
    }

    const viewerAcceptsPartner = compareSide(viewer, partner);
    const partnerAcceptsViewer = compareSide(partner, viewer);

    if (viewerAcceptsPartner === 'reject' || partnerAcceptsViewer === 'reject') {
      return evaluation({
        categoryKey: 'smoking',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'One person’s smoking habits sit outside the other’s stated partner comfort. This is a practical boundary to respect — not a judgment of either person.',
        viewerSummary: viewerSmoking,
        partnerSummary: partnerSmoking,
      });
    }

    if (viewerSmoking === partnerSmoking) {
      return evaluation({
        categoryKey: 'smoking',
        categoryLabel: this.label,
        status: 'strong_alignment',
        explanation: 'Your smoking answers match.',
        viewerSummary: viewerSmoking,
        partnerSummary: partnerSmoking,
      });
    }

    if (viewerAcceptsPartner === 'accept' || partnerAcceptsViewer === 'accept') {
      return evaluation({
        categoryKey: 'smoking',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'Your smoking habits are not identical, but available partner comfort answers suggest this difference can work.',
        viewerSummary: viewerSmoking,
        partnerSummary: partnerSmoking,
      });
    }

    const viewerBand = smokingBand(viewerSmoking);
    const partnerBand = smokingBand(partnerSmoking);

    if (viewerBand && partnerBand && viewerBand === partnerBand) {
      return evaluation({
        categoryKey: 'smoking',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'Your smoking patterns are in a similar range. Partner comfort details would refine this further.',
        viewerSummary: viewerSmoking,
        partnerSummary: partnerSmoking,
      });
    }

    if (
      (viewerBand === 'none' && partnerBand === 'active') ||
      (partnerBand === 'none' && viewerBand === 'active')
    ) {
      return evaluation({
        categoryKey: 'smoking',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'One of you does not smoke while the other smokes regularly. This is an important lifestyle difference to understand early.',
        viewerSummary: viewerSmoking,
        partnerSummary: partnerSmoking,
      });
    }

    return evaluation({
      categoryKey: 'smoking',
      categoryLabel: this.label,
      status: 'worth_discussing',
      explanation:
        'Your smoking answers differ. Sharing what you are comfortable with in a partner would make this clearer.',
      viewerSummary: viewerSmoking,
      partnerSummary: partnerSmoking,
    });
  },
};
