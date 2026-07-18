/**
 * Compatibility Engine V1 — shared types.
 *
 * Qualitative Relationship Alignment only. No Confidence metric, no numeric
 * Compatibility Index, and no High/Medium/Low confidence wording.
 */

export const RELATIONSHIP_ALIGNMENT_KEYS = [
  'strong_alignment',
  'promising_alignment',
  'more_to_discover',
  'not_enough_information',
] as const;

export type RelationshipAlignmentKey = (typeof RELATIONSHIP_ALIGNMENT_KEYS)[number];

export const RELATIONSHIP_ALIGNMENT_LABELS: Record<RelationshipAlignmentKey, string> = {
  strong_alignment: 'Strong Alignment',
  promising_alignment: 'Promising Alignment',
  more_to_discover: 'More to Discover',
  not_enough_information: 'Not Enough Information',
};

/** Factor-level comparison status (internal — not overall labels). */
export const FACTOR_STATUSES = [
  'strong_alignment',
  'compatible_difference',
  'worth_discussing',
  'important_difference',
  'insufficient_information',
] as const;

export type FactorStatus = (typeof FACTOR_STATUSES)[number];

export type CompatibilityCategoryKey =
  | 'relationship_intention'
  | 'children_family'
  | 'faith'
  | 'smoking'
  | 'drinking'
  | 'pets'
  | 'core_values';

export type CategoryEvaluation = {
  categoryKey: CompatibilityCategoryKey;
  categoryLabel: string;
  /** False when either side lacks enough answers to compare. */
  hasEnoughInformation: boolean;
  status: FactorStatus;
  /** Relative weight used when status is scoreable (not insufficient). */
  weight: number;
  explanation: string;
  supportingDetails?: string[];
  appearAsStrength: boolean;
  appearAsCompatibleDifference: boolean;
  appearAsWorthDiscussing: boolean;
  appearAsImportantDifference: boolean;
  /** High-impact categories can cap overall alignment when in conflict. */
  isHighImpact: boolean;
  viewerSummary?: string;
  partnerSummary?: string;
};

export type AlignmentExplanationItem = {
  categoryKey: CompatibilityCategoryKey;
  title: string;
  copy: string;
};

export type CompatibilityEngineResult = {
  alignment: {
    key: RelationshipAlignmentKey;
    label: string;
    summary: string;
  };
  strengths: AlignmentExplanationItem[];
  compatibleDifferences: AlignmentExplanationItem[];
  worthDiscussing: AlignmentExplanationItem[];
  importantDifferences: AlignmentExplanationItem[];
  whyForgeIntroducedYou: string[];
  /** Subtle note when comparison data is limited — never a Confidence label. */
  dataNote: string | null;
  evaluatedCategories: CompatibilityCategoryKey[];
  skippedCategories: CompatibilityCategoryKey[];
};

/**
 * Normalized comparison input for one person.
 * Partner openness / allergy fields are optional — used when available
 * (viewer private prefs, or seed fixtures). Never invent openness from identity.
 */
export type CompatibilityPersonInput = {
  id: string;
  displayName: string;
  relationshipGoal: string | null;
  faithIdentity: string | null;
  faithImportance: string | null;
  children: string | null;
  hasChildren: string | null;
  openToPartnerWithChildren: string | null;
  pets: string | null;
  petsTypes: string[];
  petsPartnerPreferences: string[];
  /** Tri-state: true / false / null unanswered. */
  petsAllergyConstraint: boolean | null;
  petsAllergyTypes: string[];
  smoking: string | null;
  smokingProductTypes: string[];
  smokingPartnerPreferences: string[];
  drinking: string | null;
  drinkingPartnerPreferences: string[];
  coreValues: string[];
};

export type CompatibilityEvaluator = {
  key: CompatibilityCategoryKey;
  label: string;
  evaluate: (
    viewer: CompatibilityPersonInput,
    partner: CompatibilityPersonInput
  ) => CategoryEvaluation;
};
