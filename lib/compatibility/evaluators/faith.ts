import type { CompatibilityEvaluator } from '../types';
import { evaluation, insufficient, normalizeSlug } from '../helpers';

const IMPORTANCE_RANK: Record<string, number> = {
  very_important: 4,
  important: 3,
  somewhat_important: 2,
  not_important: 1,
};

export const faithEvaluator: CompatibilityEvaluator = {
  key: 'faith',
  label: 'Faith',
  evaluate(viewer, partner) {
    const viewerImportance = normalizeSlug(viewer.faithImportance);
    const partnerImportance = normalizeSlug(partner.faithImportance);
    const viewerIdentity = normalizeSlug(viewer.faithIdentity);
    const partnerIdentity = normalizeSlug(partner.faithIdentity);

    if (!viewerImportance || !partnerImportance) {
      return insufficient(
        'faith',
        this.label,
        'Faith importance needs answers from both people before Forge can assess alignment here.',
        { isHighImpact: true }
      );
    }

    const viewerRank = IMPORTANCE_RANK[viewerImportance] ?? 0;
    const partnerRank = IMPORTANCE_RANK[partnerImportance] ?? 0;
    const gap = Math.abs(viewerRank - partnerRank);

    if (viewerIdentity && partnerIdentity && viewerIdentity === partnerIdentity) {
      if (gap <= 1) {
        return evaluation({
          categoryKey: 'faith',
          categoryLabel: this.label,
          status: 'strong_alignment',
          explanation: 'You share a faith identity and similar importance around faith in daily life.',
          isHighImpact: true,
        });
      }
      return evaluation({
        categoryKey: 'faith',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'You share a faith identity, though faith plays a different day-to-day role for each of you.',
        isHighImpact: true,
      });
    }

    if (gap === 0) {
      return evaluation({
        categoryKey: 'faith',
        categoryLabel: this.label,
        status: 'strong_alignment',
        explanation: 'Faith carries a similar level of importance for both of you.',
        isHighImpact: true,
      });
    }

    if (gap === 1) {
      return evaluation({
        categoryKey: 'faith',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'Faith matters to both of you at nearby levels. The details are worth learning with curiosity.',
        isHighImpact: true,
      });
    }

    if (gap === 2) {
      return evaluation({
        categoryKey: 'faith',
        categoryLabel: this.label,
        status: 'worth_discussing',
        explanation:
          'Faith plays a noticeably different role in each of your lives. A respectful conversation would help you understand what that means day to day.',
        isHighImpact: true,
        viewerSummary: viewerImportance,
        partnerSummary: partnerImportance,
      });
    }

    return evaluation({
      categoryKey: 'faith',
      categoryLabel: this.label,
      status: 'important_difference',
      explanation:
        'Faith appears central for one of you and far less so for the other. This is an important difference to understand early — without judging either person.',
      isHighImpact: true,
      viewerSummary: viewerImportance,
      partnerSummary: partnerImportance,
    });
  },
};
