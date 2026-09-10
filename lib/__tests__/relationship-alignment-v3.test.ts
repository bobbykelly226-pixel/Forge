import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateCompatibility,
  evaluateQuestionnaireCompatibility,
  mergeCompatibilityResults,
  toAlignmentPresentation,
  type CompatibilityPersonInput,
  type QuestionnaireAlignmentComparison,
  type QuestionnaireComparisonQuestion,
  type QuestionnaireCompatibilityCategoryKey,
} from '@/lib/compatibility';

const CATEGORIES: Array<{
  key: QuestionnaireCompatibilityCategoryKey;
  title: string;
}> = [
  { key: 'relationship_vision_intentions', title: 'Relationship Vision & Intentions' },
  { key: 'values_character', title: 'Values & Character' },
  { key: 'communication_emotional_connection', title: 'Communication & Emotional Connection' },
  { key: 'conflict_repair', title: 'Conflict & Repair' },
  { key: 'commitment_partnership', title: 'Commitment & Partnership' },
  { key: 'family_children_parenting', title: 'Family, Children & Parenting' },
  { key: 'faith_spirituality_worldview', title: 'Faith, Spirituality & Worldview' },
  { key: 'politics_civic_life_social_issues', title: 'Politics, Civic Life & Social Issues' },
  { key: 'service_community_contribution', title: 'Service, Community & Contribution' },
  { key: 'integrity_honesty_trust', title: 'Integrity, Honesty & Trust' },
];

function questions(opposedIndexes: ReadonlySet<number> = new Set()): QuestionnaireComparisonQuestion[] {
  return CATEGORIES.flatMap((category, categoryIndex) =>
    Array.from({ length: 3 }, (_, questionIndex) => {
      const globalIndex = categoryIndex * 3 + questionIndex;
      const exactMatch = !opposedIndexes.has(globalIndex);
      return {
        categoryKey: category.key,
        categoryTitle: category.title,
        categoryNumber: categoryIndex + 1,
        questionKey: `${category.key}_fixture_${questionIndex + 1}`,
        questionNumber: questionIndex + 1,
        prompt: `Fixture question ${globalIndex + 1}`,
        alignmentPurpose: 'Deterministic calibration fixture.',
        responseBehavior: 'single_choice',
        comparable: true,
        exactMatch,
        selectedOverlap: exactMatch ? 1 : 0,
        priorityOverlap: null,
        ordinalDistance: null,
        ordinalSpan: null,
      };
    })
  );
}

function comparison(items: QuestionnaireComparisonQuestion[]): QuestionnaireAlignmentComparison {
  const comparable = items.filter((item) => item.comparable);
  return {
    versionKey: 'compatibility_profile_v3',
    partnerId: 'partner',
    viewerAnsweredCount: items.length,
    partnerAnsweredCount: items.length,
    comparableQuestionCount: comparable.length,
    comparableCategoryCount: new Set(comparable.map((item) => item.categoryKey)).size,
    questions: items,
  };
}

function person(
  id: string,
  overrides: Partial<CompatibilityPersonInput>
): CompatibilityPersonInput {
  return {
    id,
    displayName: id,
    relationshipGoal: null,
    relationshipGoals: [],
    faithIdentity: null,
    faithImportance: null,
    children: null,
    hasChildren: null,
    openToPartnerWithChildren: null,
    pets: null,
    petsTypes: [],
    petsPartnerPreferences: [],
    petsAllergyConstraint: null,
    petsAllergyTypes: [],
    smoking: null,
    smokingProductTypes: [],
    smokingPartnerPreferences: [],
    drinking: null,
    drinkingPartnerPreferences: [],
    coreValues: [],
    ...overrides,
  };
}

test('thirty identical core answers produce Strong Alignment', () => {
  const result = evaluateQuestionnaireCompatibility(comparison(questions()));
  assert.equal(result?.alignment.key, 'strong_alignment');
  assert.equal(result?.importantDifferences.length, 0);
  assert.ok(result);

  const presentation = toAlignmentPresentation(result);
  assert.deepEqual(
    presentation.sharedStrengths.map((item) => item.copy),
    CATEGORIES.map((category) => category.title).sort()
  );
  assert.ok(
    presentation.sharedStrengths.every(
      (item) => !item.copy.includes('meaningful common ground')
    )
  );
});

test('eight ordinary opposing answers do not flip the complete picture', () => {
  const result = evaluateQuestionnaireCompatibility(
    comparison(questions(new Set([0, 4, 8, 12, 16, 20, 24, 28])))
  );
  assert.ok(result);
  assert.notEqual(result.alignment.key, 'more_to_discover');
  assert.equal(result.importantDifferences.length, 0);
  assert.ok(result.worthDiscussing.length + result.compatibleDifferences.length > 0);
});

test('one fully opposed category stays visible without erasing nine aligned categories', () => {
  const result = evaluateQuestionnaireCompatibility(
    comparison(questions(new Set([0, 1, 2])))
  );
  assert.ok(result);
  assert.equal(result.alignment.key, 'strong_alignment');
  assert.ok(result.worthDiscussing.some((item) => item.categoryKey === 'relationship_vision_intentions'));
});

test('several opposed categories lower alignment through weight rather than a hard override', () => {
  const opposed = new Set(Array.from({ length: 18 }, (_, index) => index));
  const result = evaluateQuestionnaireCompatibility(comparison(questions(opposed)));
  assert.ok(result);
  assert.equal(result.alignment.key, 'promising_alignment');
  assert.equal(result.importantDifferences.length, 0);
});

test('an explicit children boundary remains visible beside Strong Alignment', () => {
  const questionnaire = evaluateQuestionnaireCompatibility(comparison(questions()));
  assert.ok(questionnaire);
  const profile = evaluateCompatibility(
    person('viewer', { children: 'yes', hasChildren: 'no', openToPartnerWithChildren: 'yes' }),
    person('partner', { children: 'no', hasChildren: 'no', openToPartnerWithChildren: 'no' })
  );
  const merged = mergeCompatibilityResults(questionnaire, profile);
  assert.equal(merged.alignment.key, 'strong_alignment');
  assert.equal(merged.importantDifferences.length, 1);
  assert.equal(merged.importantDifferences[0]?.isExplicitBoundary, true);
});

test('a lifestyle fact difference without a stated boundary is not a dealbreaker', () => {
  const questionnaire = evaluateQuestionnaireCompatibility(comparison(questions()));
  assert.ok(questionnaire);
  const profile = evaluateCompatibility(
    person('viewer', { smoking: 'never' }),
    person('partner', { smoking: 'regularly' })
  );
  const merged = mergeCompatibilityResults(questionnaire, profile);
  assert.equal(merged.alignment.key, 'strong_alignment');
  assert.equal(merged.importantDifferences.length, 0);
  assert.ok(merged.worthDiscussing.some((item) => item.categoryKey === 'smoking'));
});

test('explicit unilateral lifestyle comfort creates a boundary factor', () => {
  const profile = evaluateCompatibility(
    person('viewer', {
      smoking: 'never',
      smokingPartnerPreferences: ['does_not_use'],
    }),
    person('partner', {
      smoking: 'regularly',
      smokingPartnerPreferences: ['open_to_any'],
    })
  );
  assert.equal(profile.importantDifferences[0]?.isExplicitBoundary, true);
});

test('partial and excluded comparison data remains Not Enough Information', () => {
  const items = questions().slice(0, 12).map((item, index) =>
    index < 2 ? { ...item, comparable: false } : item
  );
  assert.equal(evaluateQuestionnaireCompatibility(comparison(items)), null);
});
