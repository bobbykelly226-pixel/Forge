/**
 * Parenting eligibility for Compatibility Profile conditional questions.
 * Predicate key: open_to_parenting_or_stepparenting_role
 */

export type ParentingEligibilityProfile = {
  has_children?: string | null;
  children?: string | null;
  open_to_partner_with_children?: string | null;
};

/** Exact approved predicate for Categories 7, 8, and 9 Question 9. */
export function isOpenToParentingOrStepparentingRole(
  profile: ParentingEligibilityProfile | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.has_children === 'yes') return true;
  if (profile.children === 'yes') return true;
  if (profile.children === 'open') return true;
  if (profile.children === 'unsure') return true;
  if (profile.open_to_partner_with_children === 'yes') return true;
  if (profile.open_to_partner_with_children === 'open') return true;
  return false;
}

export function isQuestionCurrentlyEligible(
  eligibilityRuleId: string | undefined,
  profile: ParentingEligibilityProfile | null | undefined
): boolean {
  if (!eligibilityRuleId) return true;
  // All live eligibility rules in this catalog share the parenting predicate.
  return isOpenToParentingOrStepparentingRole(profile);
}
