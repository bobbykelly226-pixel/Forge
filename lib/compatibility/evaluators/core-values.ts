import type { CompatibilityEvaluator } from '../types';
import { evaluation, insufficient } from '../helpers';

export const coreValuesEvaluator: CompatibilityEvaluator = {
  key: 'core_values',
  label: 'Core values',
  evaluate(viewer, partner) {
    const viewerValues = [...new Set(viewer.coreValues.map((value) => value.trim()).filter(Boolean))];
    const partnerValues = [
      ...new Set(partner.coreValues.map((value) => value.trim()).filter(Boolean)),
    ];

    if (viewerValues.length === 0 || partnerValues.length === 0) {
      return insufficient(
        'core_values',
        this.label,
        'Important Alignment Factors (core values) need answers from both people before Forge can compare them.'
      );
    }

    const shared = viewerValues.filter((value) => partnerValues.includes(value));
    const overlapRatio =
      shared.length / Math.min(viewerValues.length, partnerValues.length);

    if (shared.length === 0) {
      return evaluation({
        categoryKey: 'core_values',
        categoryLabel: this.label,
        status: 'worth_discussing',
        explanation:
          'Your listed values do not currently overlap. That does not make either of you wrong — it is worth learning what matters most to each of you.',
        supportingDetails: [],
      });
    }

    if (overlapRatio >= 0.6 || shared.length >= 3) {
      return evaluation({
        categoryKey: 'core_values',
        categoryLabel: this.label,
        status: 'strong_alignment',
        explanation: `You share meaningful values such as ${shared.slice(0, 3).join(', ')}.`,
        supportingDetails: shared,
      });
    }

    return evaluation({
      categoryKey: 'core_values',
      categoryLabel: this.label,
      status: 'compatible_difference',
      explanation: `You share some values (${shared.slice(0, 2).join(', ')}) while each bringing different priorities too.`,
      supportingDetails: shared,
    });
  },
};
