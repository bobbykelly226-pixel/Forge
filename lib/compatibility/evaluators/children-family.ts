import type { CompatibilityEvaluator } from '../types';
import { evaluation, insufficient, normalizeSlug } from '../helpers';

function wantsChildren(value: string | null): 'yes' | 'no' | 'flexible' | null {
  const slug = normalizeSlug(value);
  if (!slug) return null;
  if (slug === 'yes') return 'yes';
  if (slug === 'no') return 'no';
  if (slug === 'open' || slug === 'unsure') return 'flexible';
  return null;
}

export const childrenFamilyEvaluator: CompatibilityEvaluator = {
  key: 'children_family',
  label: 'Children and family',
  evaluate(viewer, partner) {
    const viewerWants = wantsChildren(viewer.children);
    const partnerWants = wantsChildren(partner.children);
    const viewerHas = normalizeSlug(viewer.hasChildren);
    const partnerHas = normalizeSlug(partner.hasChildren);
    const viewerOpenToKids = normalizeSlug(viewer.openToPartnerWithChildren);
    const partnerOpenToKids = normalizeSlug(partner.openToPartnerWithChildren);

    const hasFutureSignal = viewerWants != null && partnerWants != null;
    const hasBlendSignal =
      (viewerHas === 'yes' && partnerOpenToKids != null) ||
      (partnerHas === 'yes' && viewerOpenToKids != null);

    if (!hasFutureSignal && !hasBlendSignal) {
      return insufficient(
        'children_family',
        this.label,
        'Children and family goals need more answers from both people before Forge can assess alignment here.',
        { isHighImpact: true }
      );
    }

    // Direct conflict: one wants children, the other does not.
    if (viewerWants === 'yes' && partnerWants === 'no') {
      return evaluation({
        categoryKey: 'children_family',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'One of you wants children and the other does not. This is an important difference to understand with care — not a judgment of either person.',
        isHighImpact: true,
        viewerSummary: 'Wants children',
        partnerSummary: 'Does not want children',
      });
    }
    if (viewerWants === 'no' && partnerWants === 'yes') {
      return evaluation({
        categoryKey: 'children_family',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'One of you wants children and the other does not. This is an important difference to understand with care — not a judgment of either person.',
        isHighImpact: true,
        viewerSummary: 'Does not want children',
        partnerSummary: 'Wants children',
      });
    }

    // Partner already has children vs openness.
    if (partnerHas === 'yes' && viewerOpenToKids === 'no') {
      return evaluation({
        categoryKey: 'children_family',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'They have children, and your current answers say you are not open to a partner with children. That boundary deserves clear, respectful conversation.',
        isHighImpact: true,
        viewerSummary: 'Not open to partner with children',
        partnerSummary: 'Has children',
      });
    }
    if (viewerHas === 'yes' && partnerOpenToKids === 'no') {
      return evaluation({
        categoryKey: 'children_family',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'You have children, and their current answers say they are not open to a partner with children. That boundary deserves clear, respectful conversation.',
        isHighImpact: true,
        viewerSummary: 'Has children',
        partnerSummary: 'Not open to partner with children',
      });
    }

    if (
      viewerWants != null &&
      partnerWants != null &&
      (viewerWants === partnerWants ||
        viewerWants === 'flexible' ||
        partnerWants === 'flexible')
    ) {
      const bothFlexible = viewerWants === 'flexible' && partnerWants === 'flexible';
      const bothSame = viewerWants === partnerWants && !bothFlexible;
      return evaluation({
        categoryKey: 'children_family',
        categoryLabel: this.label,
        status: bothSame ? 'strong_alignment' : 'compatible_difference',
        explanation: bothSame
          ? 'Your answers about wanting children point in the same direction.'
          : 'Your family goals leave room for each other — one or both of you is still open or unsure.',
        isHighImpact: true,
      });
    }

    if (
      (partnerHas === 'yes' &&
        (viewerOpenToKids === 'yes' || viewerOpenToKids === 'open')) ||
      (viewerHas === 'yes' &&
        (partnerOpenToKids === 'yes' || partnerOpenToKids === 'open'))
    ) {
      return evaluation({
        categoryKey: 'children_family',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'Blending families looks possible based on your current answers about partners with children.',
        isHighImpact: true,
      });
    }

    if (hasFutureSignal) {
      return evaluation({
        categoryKey: 'children_family',
        categoryLabel: this.label,
        status: 'worth_discussing',
        explanation:
          'Your children and family answers are not identical. A thoughtful conversation would help clarify what each of you hopes for.',
        isHighImpact: true,
      });
    }

    return insufficient(
      'children_family',
      this.label,
      'Children and family goals need more answers from both people before Forge can assess alignment here.',
      { isHighImpact: true }
    );
  },
};
