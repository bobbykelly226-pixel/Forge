import type { CompatibilityEvaluator } from '../types';
import { evaluation, insufficient, normalizeSlug } from '../helpers';

const SERIOUS = new Set(['marriage', 'serious_relationship']);
const EXPLORING = new Set(['intentional_dating', 'getting_to_know_someone']);

function labelFor(goal: string): string {
  switch (goal) {
    case 'marriage':
      return 'marriage';
    case 'serious_relationship':
      return 'a serious relationship';
    case 'intentional_dating':
      return 'intentional dating';
    case 'getting_to_know_someone':
      return 'getting to know someone';
    default:
      return goal.replaceAll('_', ' ');
  }
}

export const relationshipIntentionEvaluator: CompatibilityEvaluator = {
  key: 'relationship_intention',
  label: 'Relationship intentions',
  evaluate(viewer, partner) {
    const a = normalizeSlug(viewer.relationshipGoal);
    const b = normalizeSlug(partner.relationshipGoal);
    if (!a || !b) {
      return insufficient(
        'relationship_intention',
        this.label,
        'Relationship intentions need answers from both people before Forge can assess alignment here.',
        { isHighImpact: true }
      );
    }

    if (a === b) {
      return evaluation({
        categoryKey: 'relationship_intention',
        categoryLabel: this.label,
        status: 'strong_alignment',
        explanation: `You are both looking for ${labelFor(a)}.`,
        isHighImpact: true,
        viewerSummary: labelFor(a),
        partnerSummary: labelFor(b),
      });
    }

    if (SERIOUS.has(a) && SERIOUS.has(b)) {
      return evaluation({
        categoryKey: 'relationship_intention',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'You both want a committed path, even if one of you is more focused on marriage specifically.',
        isHighImpact: true,
        viewerSummary: labelFor(a),
        partnerSummary: labelFor(b),
      });
    }

    if (EXPLORING.has(a) && EXPLORING.has(b)) {
      return evaluation({
        categoryKey: 'relationship_intention',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'You are both still exploring connection, with room to clarify long-term direction together.',
        isHighImpact: true,
        viewerSummary: labelFor(a),
        partnerSummary: labelFor(b),
      });
    }

    if (
      (SERIOUS.has(a) && b === 'intentional_dating') ||
      (SERIOUS.has(b) && a === 'intentional_dating')
    ) {
      return evaluation({
        categoryKey: 'relationship_intention',
        categoryLabel: this.label,
        status: 'worth_discussing',
        explanation:
          'One of you is seeking a clearly committed relationship while the other is dating intentionally. This is worth clarifying early.',
        isHighImpact: true,
        viewerSummary: labelFor(a),
        partnerSummary: labelFor(b),
      });
    }

    return evaluation({
      categoryKey: 'relationship_intention',
      categoryLabel: this.label,
      status: 'important_difference',
      explanation:
        'Your relationship intentions point in different directions right now. Understanding what each of you wants is an important conversation.',
      isHighImpact: true,
      viewerSummary: labelFor(a),
      partnerSummary: labelFor(b),
    });
  },
};
