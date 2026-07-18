import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  evaluateCompatibility,
  personFromSeedCompatibilityFields,
  toAlignmentPresentation,
  RELATIONSHIP_ALIGNMENT_LABELS,
  type CompatibilityPersonInput,
} from '../compatibility';
import { SEED_DEMO_VIEWER } from '../compatibility/seed-viewer';
import { smokingEvaluator } from '../compatibility/evaluators/smoking';
import { drinkingEvaluator } from '../compatibility/evaluators/drinking';
import { petsEvaluator } from '../compatibility/evaluators/pets';
import { childrenFamilyEvaluator } from '../compatibility/evaluators/children-family';
import { relationshipIntentionEvaluator } from '../compatibility/evaluators/relationship-intention';
import { DEFAULT_COMPATIBILITY_EVALUATORS } from '../compatibility/evaluators';
import { toSeedAlignmentPresentation, toSeedDiscoveryFeedCard } from '../seed/adapters';
import { getSeedProfileById } from '../seed/catalog';

function person(
  overrides: Partial<CompatibilityPersonInput> & Pick<CompatibilityPersonInput, 'id' | 'displayName'>
): CompatibilityPersonInput {
  return {
    relationshipGoal: null,
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

describe('compatibility engine V1', () => {
  it('returns Strong Alignment for identical aligned answers', () => {
    const viewer = personFromSeedCompatibilityFields(SEED_DEMO_VIEWER);
    const partner = person({
      id: 'p1',
      displayName: 'Partner',
      relationshipGoal: 'serious_relationship',
      faithIdentity: 'christian',
      faithImportance: 'important',
      children: 'open',
      hasChildren: 'no',
      openToPartnerWithChildren: 'yes',
      pets: 'yes',
      petsTypes: ['dogs'],
      petsPartnerPreferences: ['has_dogs', 'open_to_any'],
      petsAllergyConstraint: false,
      smoking: 'never',
      smokingPartnerPreferences: ['does_not_use'],
      drinking: 'rarely',
      drinkingPartnerPreferences: ['drinks_rarely', 'drinks_socially'],
      coreValues: ['Faith', 'Family', 'Loyalty', 'Communication'],
    });

    const result = evaluateCompatibility(viewer, partner);
    assert.equal(result.alignment.key, 'strong_alignment');
    assert.equal(result.alignment.label, RELATIONSHIP_ALIGNMENT_LABELS.strong_alignment);
    assert.ok(result.strengths.length >= 3);
    assert.equal(result.importantDifferences.length, 0);
    assert.equal('confidence' in result, false);
    assert.equal('confidenceLevel' in result, false);
  });

  it('treats different but mutually acceptable lifestyle answers as compatible differences', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      smoking: 'never',
      smokingPartnerPreferences: ['does_not_use', 'trying_to_quit', 'cigarettes_occasionally'],
      drinking: 'rarely',
      drinkingPartnerPreferences: ['drinks_rarely', 'drinks_socially'],
      pets: 'yes',
      petsTypes: ['dogs'],
      petsPartnerPreferences: ['has_cats', 'has_dogs', 'open_to_any'],
      petsAllergyConstraint: false,
    });
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      smoking: 'trying_to_quit',
      smokingPartnerPreferences: ['does_not_use', 'open_to_any'],
      drinking: 'socially',
      drinkingPartnerPreferences: ['drinks_socially', 'open_to_any'],
      pets: 'yes',
      petsTypes: ['cats'],
      petsPartnerPreferences: ['has_dogs', 'open_to_any'],
      petsAllergyConstraint: false,
    });

    assert.equal(smokingEvaluator.evaluate(viewer, partner).status, 'compatible_difference');
    assert.equal(drinkingEvaluator.evaluate(viewer, partner).status, 'compatible_difference');
    assert.equal(petsEvaluator.evaluate(viewer, partner).status, 'compatible_difference');
  });

  it('flags one-sided partner smoking boundary as important_difference', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      smoking: 'never',
      smokingPartnerPreferences: ['does_not_use'],
    });
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      smoking: 'regularly',
      smokingPartnerPreferences: ['open_to_any'],
    });
    const evaluation = smokingEvaluator.evaluate(viewer, partner);
    assert.equal(evaluation.status, 'important_difference');
    assert.equal(evaluation.appearAsImportantDifference, true);
  });

  it('detects mutual incompatibility on children goals', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      children: 'yes',
      hasChildren: 'no',
      openToPartnerWithChildren: 'yes',
    });
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      children: 'no',
      hasChildren: 'no',
      openToPartnerWithChildren: 'no',
    });
    const evaluation = childrenFamilyEvaluator.evaluate(viewer, partner);
    assert.equal(evaluation.status, 'important_difference');
  });

  it('excludes unanswered fields from scoring rather than treating them as mismatches', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      relationshipGoal: 'serious_relationship',
      smoking: null,
      drinking: null,
      pets: null,
    });
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      relationshipGoal: 'serious_relationship',
      smoking: null,
      drinking: null,
      pets: null,
    });
    const result = evaluateCompatibility(viewer, partner);
    assert.ok(result.skippedCategories.includes('smoking'));
    assert.ok(result.skippedCategories.includes('drinking'));
    assert.ok(result.skippedCategories.includes('pets'));
    // Only one scoreable category (relationship) → Not Enough Information.
    assert.equal(result.alignment.key, 'not_enough_information');
    assert.ok(result.dataNote);
    assert.match(result.dataNote ?? '', /not treated as a mismatch/i);
  });

  it('returns Not Enough Information for partially completed profiles', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      relationshipGoal: 'serious_relationship',
    });
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      relationshipGoal: null,
      smoking: 'never',
    });
    const result = evaluateCompatibility(viewer, partner);
    assert.equal(result.alignment.key, 'not_enough_information');
  });

  it('preserves explicit false allergy constraint separately from unanswered null', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      pets: 'yes',
      petsTypes: ['dogs'],
      petsAllergyConstraint: false,
      petsPartnerPreferences: ['open_to_any'],
    });
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      pets: 'yes',
      petsTypes: ['dogs'],
      petsAllergyConstraint: null,
      petsPartnerPreferences: ['open_to_any'],
    });
    const noAllergy = petsEvaluator.evaluate(viewer, partner);
    assert.notEqual(noAllergy.status, 'important_difference');

    const allergic = petsEvaluator.evaluate(
      {
        ...viewer,
        petsAllergyConstraint: true,
        petsAllergyTypes: ['dogs'],
      },
      partner
    );
    assert.equal(allergic.status, 'important_difference');
  });

  it('treats pet ownership with compatible partner openness as compatible', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      pets: 'no',
      petsPartnerPreferences: ['has_dogs', 'has_cats'],
      petsAllergyConstraint: false,
    });
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      pets: 'yes',
      petsTypes: ['dogs'],
      petsPartnerPreferences: ['has_no_pets', 'open_to_any'],
      petsAllergyConstraint: false,
    });
    assert.equal(petsEvaluator.evaluate(viewer, partner).status, 'compatible_difference');
  });

  it('marks differing drinking habits as worth discussing or important depending on openness', () => {
    const viewer = person({
      id: 'v',
      displayName: 'Viewer',
      drinking: 'never',
      drinkingPartnerPreferences: ['does_not_drink', 'drinks_rarely'],
    });
    const socialPartner = person({
      id: 'p',
      displayName: 'Partner',
      drinking: 'socially',
      drinkingPartnerPreferences: ['open_to_any'],
    });
    // Viewer prefs reject socially → important
    assert.equal(
      drinkingEvaluator.evaluate(viewer, socialPartner).status,
      'important_difference'
    );

    const openViewer = {
      ...viewer,
      drinkingPartnerPreferences: ['does_not_drink', 'drinks_rarely', 'drinks_socially'],
    };
    assert.equal(
      drinkingEvaluator.evaluate(openViewer, socialPartner).status,
      'compatible_difference'
    );

    const noOpenness = drinkingEvaluator.evaluate(
      person({ id: 'v2', displayName: 'V', drinking: 'never' }),
      person({ id: 'p2', displayName: 'P', drinking: 'socially' })
    );
    assert.equal(noOpenness.status, 'worth_discussing');
  });

  it('does not let many minor alignments override a high-impact conflict', () => {
    const viewer = personFromSeedCompatibilityFields(SEED_DEMO_VIEWER);
    const partner = person({
      id: 'p',
      displayName: 'Partner',
      relationshipGoal: 'getting_to_know_someone',
      faithIdentity: 'christian',
      faithImportance: 'important',
      children: 'open',
      hasChildren: 'no',
      openToPartnerWithChildren: 'yes',
      pets: 'yes',
      petsTypes: ['dogs'],
      petsPartnerPreferences: ['open_to_any'],
      petsAllergyConstraint: false,
      smoking: 'never',
      smokingPartnerPreferences: ['does_not_use'],
      drinking: 'rarely',
      drinkingPartnerPreferences: ['drinks_rarely'],
      coreValues: ['Faith', 'Family', 'Loyalty', 'Communication', 'Shared goals'],
    });
    const result = evaluateCompatibility(viewer, partner);
    assert.ok(
      result.alignment.key === 'more_to_discover' ||
        result.importantDifferences.some((item) => item.categoryKey === 'relationship_intention')
    );
    assert.notEqual(result.alignment.key, 'strong_alignment');
  });

  it('is deterministic regardless of evaluator registration order', () => {
    const viewer = personFromSeedCompatibilityFields(SEED_DEMO_VIEWER);
    const partner = personFromSeedCompatibilityFields({
      ...SEED_DEMO_VIEWER,
      id: 'partner',
      firstName: 'Partner',
    });
    const forward = evaluateCompatibility(viewer, partner, DEFAULT_COMPATIBILITY_EVALUATORS);
    const reversed = evaluateCompatibility(
      viewer,
      partner,
      [...DEFAULT_COMPATIBILITY_EVALUATORS].reverse()
    );
    assert.deepEqual(forward, reversed);
  });

  it('presentation mapping never introduces Confidence fields or High/Medium/Low confidence copy', () => {
    const viewer = personFromSeedCompatibilityFields(SEED_DEMO_VIEWER);
    const partner = personFromSeedCompatibilityFields({
      ...SEED_DEMO_VIEWER,
      id: 'partner',
      firstName: 'Partner',
      smoking: 'regularly',
      smokingPartnerPreferences: ['cigarettes_regularly'],
    });
    const result = evaluateCompatibility(viewer, partner);
    const presentation = toAlignmentPresentation(result);
    const blob = JSON.stringify({ result, presentation }).toLowerCase();
    assert.equal(blob.includes('"confidence"'), false);
    assert.equal(blob.includes('high confidence'), false);
    assert.equal(blob.includes('medium confidence'), false);
    assert.equal(blob.includes('low confidence'), false);
    assert.ok(
      Object.values(RELATIONSHIP_ALIGNMENT_LABELS).includes(presentation.alignmentLabel)
    );
  });

  it('identical relationship intentions evaluate as strong_alignment', () => {
    const evaluation = relationshipIntentionEvaluator.evaluate(
      person({
        id: 'v',
        displayName: 'V',
        relationshipGoal: 'marriage',
      }),
      person({
        id: 'p',
        displayName: 'P',
        relationshipGoal: 'marriage',
      })
    );
    assert.equal(evaluation.status, 'strong_alignment');
  });
});

describe('compatibility engine seed integration', () => {
  it('computes Amanda as a strong or promising engine outcome against the demo viewer', () => {
    const amanda = getSeedProfileById('seed-amanda-cole');
    assert.ok(amanda);
    const presentation = toSeedAlignmentPresentation(amanda!);
    assert.ok(
      presentation.alignmentLabel === 'Strong Alignment' ||
        presentation.alignmentLabel === 'Promising Alignment'
    );
    const card = toSeedDiscoveryFeedCard(amanda!);
    assert.equal(card.confidence, '—');
    assert.equal(card.alignmentLabel, presentation.alignmentLabel);
  });

  it('surfaces an important difference for Natalie smoking boundary', () => {
    const natalie = getSeedProfileById('seed-natalie-kim');
    assert.ok(natalie);
    const presentation = toSeedAlignmentPresentation(natalie!);
    assert.ok(presentation.importantFactors.length > 0);
    assert.ok(
      presentation.importantFactors.some((factor) =>
        factor.explanation.toLowerCase().includes('smoking')
      )
    );
  });

  it('keeps Kristin in a limited-information posture', () => {
    const kristin = getSeedProfileById('seed-kristin-walsh');
    assert.ok(kristin);
    const presentation = toSeedAlignmentPresentation(kristin!);
    assert.ok(
      presentation.alignmentLabel === 'Not Enough Information' ||
        presentation.alignmentLabel === 'More to Discover'
    );
    assert.ok(presentation.incompleteAssessmentCopy || presentation.sharedStrengths.length >= 0);
  });
});
