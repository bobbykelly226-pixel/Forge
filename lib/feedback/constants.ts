export const BETA_FEEDBACK_CATEGORIES = [
  {
    value: 'broken',
    label: 'Something is broken',
    description: 'A button, page, message, or other part of Forge did not work as expected.',
    responseExpectation: 'We review beta bugs within two business days.',
  },
  {
    value: 'confusing',
    label: 'Something is confusing',
    description: 'The wording, next step, or purpose of a feature was not clear.',
    responseExpectation: 'We review confusing experiences within two business days.',
  },
  {
    value: 'support',
    label: 'I need help',
    description: 'You need help using Forge or accessing part of your account.',
    responseExpectation: 'We will acknowledge account or access help as soon as practical during beta.',
  },
  {
    value: 'idea',
    label: 'I have an idea',
    description: 'Share a suggestion, reaction, or general feedback about the Forge experience.',
    responseExpectation: 'Every idea is reviewed for product learning; a direct reply is not guaranteed.',
  },
] as const;

export type BetaFeedbackCategory = (typeof BETA_FEEDBACK_CATEGORIES)[number]['value'];

export const BETA_FEEDBACK_AREAS = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'profile', label: 'My Profile' },
  { value: 'compatibility_profile', label: 'Compatibility Profile' },
  { value: 'connections_messaging', label: 'Connections or Messages' },
  { value: 'account_access', label: 'Account or Sign In' },
  { value: 'other', label: 'Something else' },
] as const;

export type BetaFeedbackArea = (typeof BETA_FEEDBACK_AREAS)[number]['value'];

export function getBetaFeedbackCategory(value: BetaFeedbackCategory) {
  return BETA_FEEDBACK_CATEGORIES.find((category) => category.value === value)!;
}

export function getBetaFeedbackAreaLabel(value: BetaFeedbackArea) {
  return BETA_FEEDBACK_AREAS.find((area) => area.value === value)?.label ?? value;
}
