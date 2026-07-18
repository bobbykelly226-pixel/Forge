import type { CompatibilityEvaluator, CompatibilityPersonInput } from '../types';
import {
  evaluation,
  hasOpenness,
  insufficient,
  normalizeSlug,
  opennessIncludesAny,
  opennessIsUnknown,
} from '../helpers';

function normalizeDrinking(value: string | null): string | null {
  const slug = normalizeSlug(value);
  if (!slug) return null;
  if (slug === 'occasionally') return 'rarely';
  return slug;
}

function drinkingBand(value: string | null): 'none' | 'light' | 'social' | 'heavy' | 'recovery' | null {
  const slug = normalizeDrinking(value);
  if (!slug) return null;
  if (slug === 'never') return 'none';
  if (slug === 'rarely') return 'light';
  if (slug === 'socially') return 'social';
  if (slug === 'regularly') return 'heavy';
  if (slug === 'sober' || slug === 'in_recovery') return 'recovery';
  return null;
}

function partnerAcceptsBehavior(
  preferences: string[],
  behavior: string
): 'accept' | 'reject' | 'unknown' {
  if (opennessIsUnknown(preferences)) return 'unknown';
  if (preferences.includes('open_to_any')) return 'accept';

  const mapped = behavior === 'occasionally' ? 'rarely' : behavior;

  if (mapped === 'never') {
    return opennessIncludesAny(preferences, ['does_not_drink', 'in_recovery', 'drinks_rarely'])
      ? 'accept'
      : 'accept';
  }

  if (mapped === 'rarely') {
    if (preferences.length === 1 && preferences[0] === 'does_not_drink') return 'reject';
    return opennessIncludesAny(preferences, [
      'drinks_rarely',
      'drinks_socially',
      'drinks_regularly',
      'open_to_any',
    ])
      ? 'accept'
      : 'reject';
  }

  if (mapped === 'socially') {
    if (preferences.length === 1 && preferences[0] === 'does_not_drink') return 'reject';
    return opennessIncludesAny(preferences, [
      'drinks_socially',
      'drinks_regularly',
      'open_to_any',
    ])
      ? 'accept'
      : 'reject';
  }

  if (mapped === 'regularly') {
    if (
      preferences.length === 1 &&
      (preferences[0] === 'does_not_drink' || preferences[0] === 'drinks_rarely')
    ) {
      return 'reject';
    }
    return opennessIncludesAny(preferences, ['drinks_regularly', 'open_to_any'])
      ? 'accept'
      : 'reject';
  }

  return 'unknown';
}

function compareSide(
  opennessOwner: CompatibilityPersonInput,
  behaviorOwner: CompatibilityPersonInput
): 'accept' | 'reject' | 'unknown' | 'no_openness' {
  const behavior = normalizeDrinking(behaviorOwner.drinking);
  if (!behavior) return 'unknown';
  if (!hasOpenness(opennessOwner.drinkingPartnerPreferences)) return 'no_openness';
  return partnerAcceptsBehavior(opennessOwner.drinkingPartnerPreferences, behavior);
}

export const drinkingEvaluator: CompatibilityEvaluator = {
  key: 'drinking',
  label: 'Drinking',
  evaluate(viewer, partner) {
    const viewerDrinking = normalizeDrinking(viewer.drinking);
    const partnerDrinking = normalizeDrinking(partner.drinking);

    if (!viewerDrinking || !partnerDrinking) {
      return insufficient(
        'drinking',
        this.label,
        'Drinking answers need to be completed by both people before Forge can assess this lifestyle area.'
      );
    }

    const viewerAcceptsPartner = compareSide(viewer, partner);
    const partnerAcceptsViewer = compareSide(partner, viewer);

    if (viewerAcceptsPartner === 'reject' || partnerAcceptsViewer === 'reject') {
      return evaluation({
        categoryKey: 'drinking',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'One person’s drinking habits sit outside the other’s stated partner comfort. Treat this as a practical boundary, not a personal judgment.',
        viewerSummary: viewerDrinking,
        partnerSummary: partnerDrinking,
      });
    }

    if (viewerDrinking === partnerDrinking) {
      return evaluation({
        categoryKey: 'drinking',
        categoryLabel: this.label,
        status: 'strong_alignment',
        explanation: 'Your drinking answers match.',
        viewerSummary: viewerDrinking,
        partnerSummary: partnerDrinking,
      });
    }

    if (viewerAcceptsPartner === 'accept' || partnerAcceptsViewer === 'accept') {
      return evaluation({
        categoryKey: 'drinking',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'Your drinking habits differ, but available partner comfort answers suggest the difference can work.',
        viewerSummary: viewerDrinking,
        partnerSummary: partnerDrinking,
      });
    }

    const viewerBand = drinkingBand(viewerDrinking);
    const partnerBand = drinkingBand(partnerDrinking);
    const bands = new Set([viewerBand, partnerBand]);

    if (
      bands.has('none') &&
      (bands.has('heavy') || bands.has('social'))
    ) {
      return evaluation({
        categoryKey: 'drinking',
        categoryLabel: this.label,
        status: bands.has('heavy') ? 'important_difference' : 'worth_discussing',
        explanation: bands.has('heavy')
          ? 'One of you does not drink while the other drinks regularly. This is an important lifestyle difference to understand early.'
          : 'One of you does not drink while the other drinks socially. This is worth discussing with care.',
        viewerSummary: viewerDrinking,
        partnerSummary: partnerDrinking,
      });
    }

    if (
      (viewerBand === 'light' && partnerBand === 'social') ||
      (viewerBand === 'social' && partnerBand === 'light') ||
      (viewerBand === 'none' && partnerBand === 'light') ||
      (viewerBand === 'light' && partnerBand === 'none')
    ) {
      return evaluation({
        categoryKey: 'drinking',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'Your drinking frequencies are nearby. Many couples navigate this comfortably when expectations are clear.',
        viewerSummary: viewerDrinking,
        partnerSummary: partnerDrinking,
      });
    }

    return evaluation({
      categoryKey: 'drinking',
      categoryLabel: this.label,
      status: 'worth_discussing',
      explanation:
        'Your drinking answers differ. Talking through what feels comfortable day to day would help.',
      viewerSummary: viewerDrinking,
      partnerSummary: partnerDrinking,
    });
  },
};
