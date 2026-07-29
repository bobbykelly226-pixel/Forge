import assert from 'node:assert/strict';
import { test } from 'node:test';

import { childrenFamilyEvaluator } from '@/lib/compatibility/evaluators/children-family';
import { coreValuesEvaluator } from '@/lib/compatibility/evaluators/core-values';
import { relationshipIntentionEvaluator } from '@/lib/compatibility/evaluators/relationship-intention';
import { constrainProfileFallbackAlignment } from '@/lib/compatibility/profile-fallback';
import type {
  CompatibilityEngineResult,
  CompatibilityPersonInput,
} from '@/lib/compatibility/types';
import { DISCOVERY_CATEGORICAL_FILTER_OPTIONS } from '@/lib/discovery/filter-options';
import {
  EMPTY_DISCOVERY_FILTERS,
  countActiveDiscoveryFilters,
  profileMatchesDiscoveryFilters,
} from '@/lib/discovery/filters';
import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';
import { normalizeThingsIEnjoy } from '@/lib/profile/things-i-enjoy';

const person = (
  id: string,
  patch: Partial<CompatibilityPersonInput> = {}
): CompatibilityPersonInput => ({
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
  ...patch,
});

const card: DiscoveryFeedCardModel = {
  id: 'profile-1',
  firstName: 'Jordan',
  age: 36,
  location: 'Denver, CO',
  alignmentLabel: 'Promising Alignment',
  confidence: '—',
  hasImportantFactors: false,
  aboutPreview: null,
  characterSignals: [],
  portraitGradient: 'linear-gradient(#fff,#000)',
  photoUrl: null,
  filterData: {
    relationshipGoals: ['marriage', 'serious_relationship'],
    faithIdentity: 'christian',
    faithImportance: 'very_important',
    children: 'yes',
    hasChildren: 'no',
    smoking: 'never',
    drinking: 'socially',
    pets: 'yes',
    thingsIEnjoy: ['Hiking', 'Cooking'],
  },
};

test('Things I Enjoy accepts user-written hobbies instead of a political or fixed catalog', () => {
  assert.deepEqual(
    normalizeThingsIEnjoy('Hiking\nCooking\nLive music\nWeekend road trips'),
    ['Hiking', 'Cooking', 'Live music', 'Weekend road trips']
  );
});

test('Things I Enjoy removes duplicates and safely bounds saved entries', () => {
  const values = normalizeThingsIEnjoy([
    'Hiking',
    ' hiking ',
    ...Array.from({ length: 40 }, (_, index) => `Interest ${index}`),
  ]);
  assert.equal(values[0], 'Hiking');
  assert.equal(values.length, 30);
});

test('Discovery filters combine age, location, alignment, goals, and lifestyle fields', () => {
  assert.equal(
    profileMatchesDiscoveryFilters(card, {
      ...EMPTY_DISCOVERY_FILTERS,
      minAge: 30,
      maxAge: 40,
      locationQuery: 'denver',
      alignment: ['Promising Alignment'],
      relationshipGoals: ['marriage'],
      faithIdentity: ['christian'],
      smoking: ['never'],
      thingsIEnjoy: ['Hiking'],
    }),
    true
  );
});

test('Discovery excludes profiles that do not match an active real filter', () => {
  assert.equal(
    profileMatchesDiscoveryFilters(card, {
      ...EMPTY_DISCOVERY_FILTERS,
      maxAge: 30,
    }),
    false
  );
  assert.equal(
    profileMatchesDiscoveryFilters(card, {
      ...EMPTY_DISCOVERY_FILTERS,
      drinking: ['never'],
    }),
    false
  );
});

test('Discovery reports active filter selections for the filter button', () => {
  assert.equal(
    countActiveDiscoveryFilters({
      ...EMPTY_DISCOVERY_FILTERS,
      minAge: 28,
      maxAge: 45,
      relationshipGoals: ['marriage', 'serious_relationship'],
    }),
    4
  );
});

test('Discovery categorical filters expose every canonical option regardless of the loaded profiles', () => {
  assert.deepEqual(
    DISCOVERY_CATEGORICAL_FILTER_OPTIONS.alignment.map((option) => option.label),
    [
      'Strong Alignment',
      'Promising Alignment',
      'More to Discover',
      'Not Enough Information',
    ]
  );
  assert.deepEqual(
    DISCOVERY_CATEGORICAL_FILTER_OPTIONS.relationshipGoals.map(
      (option) => option.value
    ),
    [
      'marriage',
      'serious_relationship',
      'intentional_dating',
      'getting_to_know_someone',
    ]
  );
  assert.equal(DISCOVERY_CATEGORICAL_FILTER_OPTIONS.faithIdentity.length, 12);
  assert.equal(DISCOVERY_CATEGORICAL_FILTER_OPTIONS.faithImportance.length, 5);
  assert.equal(DISCOVERY_CATEGORICAL_FILTER_OPTIONS.hasChildren.length, 3);
  assert.equal(DISCOVERY_CATEGORICAL_FILTER_OPTIONS.wantsChildren.length, 5);
  assert.equal(DISCOVERY_CATEGORICAL_FILTER_OPTIONS.smoking.length, 5);
  assert.equal(DISCOVERY_CATEGORICAL_FILTER_OPTIONS.drinking.length, 6);
  assert.equal(DISCOVERY_CATEGORICAL_FILTER_OPTIONS.pets.length, 3);
});

test('children alignment factors say which direction each public answer points', () => {
  const viewerWantsChildren = childrenFamilyEvaluator.evaluate(
    person('viewer', { children: 'yes' }),
    person('partner', { children: 'no' })
  );
  assert.match(viewerWantsChildren.explanation, /You want children, while they do not/);
  assert.equal(viewerWantsChildren.viewerSummary, 'Wants children');
  assert.equal(viewerWantsChildren.partnerSummary, 'Does not want children');

  const partnerWantsChildren = childrenFamilyEvaluator.evaluate(
    person('viewer', { children: 'no' }),
    person('partner', { children: 'yes' })
  );
  assert.match(partnerWantsChildren.explanation, /You do not want children, while they do/);
  assert.equal(partnerWantsChildren.viewerSummary, 'Does not want children');
  assert.equal(partnerWantsChildren.partnerSummary, 'Wants children');
});

test('subset overlap uses the full combined value set instead of treating one match as 100 percent', () => {
  const result = coreValuesEvaluator.evaluate(
    person('viewer', { coreValues: ['Faith', 'Family', 'Integrity', 'Service'] }),
    person('partner', { coreValues: ['Faith'] })
  );
  assert.equal(result.status, 'compatible_difference');
  assert.equal(result.appearAsStrength, false);
});

test('multi-select goals compare correctly and profile-only fallback cannot claim Strong Alignment', () => {
  const goalResult = relationshipIntentionEvaluator.evaluate(
    person('viewer', {
      relationshipGoal: 'marriage',
      relationshipGoals: ['marriage', 'serious_relationship'],
    }),
    person('partner', {
      relationshipGoal: 'serious_relationship',
      relationshipGoals: ['intentional_dating', 'serious_relationship'],
    })
  );
  assert.equal(goalResult.status, 'strong_alignment');

  const strongResult = {
    alignment: {
      key: 'strong_alignment',
      label: 'Strong Alignment',
      summary: 'Strong.',
    },
    strengths: [],
    compatibleDifferences: [],
    worthDiscussing: [],
    importantDifferences: [],
    whyForgeIntroducedYou: [],
    dataNote: null,
    evaluatedCategories: [],
    skippedCategories: [],
  } satisfies CompatibilityEngineResult;

  const constrained = constrainProfileFallbackAlignment(strongResult);
  assert.equal(constrained.alignment.key, 'promising_alignment');
  assert.match(constrained.dataNote ?? '', /public profile details/i);
});
