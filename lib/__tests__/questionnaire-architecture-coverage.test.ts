import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  ARCHITECTURE_COVERAGE_QUESTIONS,
  FORMAT_LABEL_TO_BEHAVIOR,
  FOUNDATION_CAPABILITY_MANIFEST,
  MASTER_ELIGIBILITY_DESCRIPTION,
  MASTER_FORMAT_LABELS,
  MASTER_STRUCTURE_COUNTS,
  MASTER_STRUCTURE_MANIFEST,
  getArchitectureCoverageCatalog,
  getManifestQuestion,
  getSyntheticCatalogFromManifest,
  resolveResponseBehavior,
} from '@/lib/questionnaire/architecture-coverage';
import { getQuestionnaireCatalog } from '@/lib/questionnaire/catalog';
import {
  RESPONSE_BEHAVIORS,
  RESPONSE_QUALIFIERS,
  RESPONSE_STATES,
  type PrivateQuestionnaireResponse,
  type QuestionnaireCatalog,
} from '@/lib/questionnaire/types';
import { validateQuestionnaireCatalog } from '@/lib/questionnaire/validate';

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('questionnaire architecture coverage (self-contained)', () => {
  it('loads a committed 150-question structural manifest without Cursor upload paths', () => {
    assert.equal(MASTER_STRUCTURE_MANIFEST.questionCount, 150);
    assert.equal(MASTER_STRUCTURE_MANIFEST.questions.length, 150);
    const sourcePath = 'lib/__tests__/questionnaire-architecture-coverage.test.ts';
    const testSource = readRepo(sourcePath);
    assert.doesNotMatch(testSource, /\/home\/ubuntu\/\.cursor\/projects\/workspace\/uploads/);
    assert.doesNotMatch(
      readRepo('lib/questionnaire/architecture-coverage.ts'),
      /\/home\/ubuntu\/\.cursor\/projects\/workspace\/uploads/
    );
    assert.doesNotMatch(
      readRepo('lib/questionnaire/synthetic-catalog-from-manifest.ts'),
      /\/home\/ubuntu\/\.cursor\/projects\/workspace\/uploads/
    );
    const categories = new Set(
      MASTER_STRUCTURE_MANIFEST.questions.map((q) => q.categoryNumber)
    );
    assert.deepEqual([...categories].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('maps every distinct HQ format label to a reusable response behavior', () => {
    assert.equal(MASTER_FORMAT_LABELS.length, MASTER_STRUCTURE_COUNTS.distinctFormatLabels);
    for (const label of MASTER_FORMAT_LABELS) {
      const behavior = resolveResponseBehavior(label);
      assert.ok((RESPONSE_BEHAVIORS as readonly string[]).includes(behavior), label);
      assert.equal(FORMAT_LABEL_TO_BEHAVIOR[label], behavior);
    }
    const used = new Set(Object.values(FORMAT_LABEL_TO_BEHAVIOR));
    for (const behavior of RESPONSE_BEHAVIORS) {
      assert.ok(used.has(behavior), `unused behavior: ${behavior}`);
    }
  });

  it('validates complete coverage definitions through the real catalog validator', () => {
    const coverage = getArchitectureCoverageCatalog();
    const result = validateQuestionnaireCatalog(coverage);
    assert.equal(result.ok, true);
    assert.equal(coverage.eligibilityRules.length, 3);
    assert.ok(coverage.categories.length >= 6);

    // Live catalog remains Category 1 only.
    const live = getQuestionnaireCatalog();
    assert.equal(live.categories.length, 1);
    assert.equal(live.categories[0].number, 1);
    assert.equal(live.eligibilityRules.length, 0);
  });

  it('proves all ten categories are representable via a synthetic manifest catalog', () => {
    const synthetic = getSyntheticCatalogFromManifest();
    const result = validateQuestionnaireCatalog(synthetic);
    assert.equal(result.ok, true, result.ok ? '' : JSON.stringify(result.issues, null, 2));
    assert.equal(synthetic.categories.length, 10);
    assert.equal(
      synthetic.categories.reduce((sum, c) => sum + c.questions.length, 0),
      150
    );
    for (let n = 1; n <= 10; n += 1) {
      const category = synthetic.categories.find((c) => c.number === n);
      assert.ok(category, `missing category ${n}`);
      assert.equal(category?.questions.length, 15);
      assert.equal(category?.status, 'locked');
    }

    // Every manifest entry maps to a validated question with matching structure.
    for (const entry of MASTER_STRUCTURE_MANIFEST.questions) {
      const category = synthetic.categories.find((c) => c.number === entry.categoryNumber);
      const question = category?.questions.find((q) => q.number === entry.questionNumber);
      assert.ok(question, `missing ${entry.categoryNumber}.${entry.questionNumber}`);
      assert.equal(question?.formatLabel, entry.formatLabel);
      assert.equal(question?.responseBehavior, entry.responseBehavior);
      assert.equal(question?.choices.length, entry.choiceCount);
      assert.equal(question?.minSelections, entry.minSelections);
      assert.equal(question?.maxSelections, entry.maxSelections);
      if (entry.priorityFollowUp) {
        assert.equal(
          question?.priorityFollowUp?.selectionCount,
          entry.priorityFollowUp.selectionCount
        );
        assert.equal(
          question?.priorityFollowUp?.minEligibleSelectionsBeforeDisplay,
          entry.priorityFollowUp.minEligibleSelectionsBeforeDisplay
        );
      }
      if (entry.structuredIdentity) {
        assert.deepEqual(question?.structuredIdentity, entry.structuredIdentity);
      }
    }

    // Still not the live catalog.
    const live = getQuestionnaireCatalog();
    assert.equal(live.categories.length, 1);
    assert.equal(live.questionnaireVersion !== synthetic.questionnaireVersion, true);
  });

  it('represents structured identity refinement, user-supplied identity, and privacy/matching metadata', () => {
    const faith = ARCHITECTURE_COVERAGE_QUESTIONS.structuredIdentityFaith;
    const politics = ARCHITECTURE_COVERAGE_QUESTIONS.structuredIdentityPolitics;

    assert.equal(faith.responseBehavior, 'structured_identity');
    assert.equal(faith.structuredIdentity?.allowsRefinement, true);
    assert.equal(faith.structuredIdentity?.allowsUserSuppliedIdentity, true);
    assert.equal(faith.structuredIdentity?.privacy.userControlsPublicDisplay, true);
    assert.equal(faith.structuredIdentity?.privacy.userControlsPrivateMatchingUse, false);

    assert.equal(politics.structuredIdentity?.allowsRefinement, true);
    assert.equal(politics.structuredIdentity?.allowsUserSuppliedIdentity, true);
    assert.equal(politics.structuredIdentity?.privacy.userControlsPublicDisplay, true);
    assert.equal(politics.structuredIdentity?.privacy.userControlsPrivateMatchingUse, true);

    const manifestFaith = getManifestQuestion(7, 2);
    const manifestPolitics = getManifestQuestion(8, 2);
    assert.ok(manifestFaith?.features.includes('structured_identity'));
    assert.ok(manifestFaith?.features.includes('identity_refinement'));
    assert.ok(manifestFaith?.structuredIdentity?.allowsRefinement);
    assert.ok(manifestFaith?.structuredIdentity?.allowsUserSuppliedIdentity);
    assert.ok(manifestPolitics?.features.includes('user_supplied_identity'));
    assert.ok(manifestPolitics?.features.includes('identity_private_matching_control'));
    assert.equal(
      manifestPolitics?.structuredIdentity?.privacy.userControlsPrivateMatchingUse,
      true
    );

    // Private response storage can hold refinement / user-supplied / privacy flags.
    const privateResponse: PrivateQuestionnaireResponse = {
      questionId: politics.id,
      responseState: 'answered',
      activeQualifiers: [],
      selectedChoices: [{ choiceId: politics.choices[0].id }],
      identity: {
        refinement: 'more-specific-refinement',
        userSupplied: 'user-supplied-identity',
        publicDisplayAllowed: false,
        privateMatchingAllowed: true,
      },
    };
    assert.equal(privateResponse.identity?.publicDisplayAllowed, false);
    assert.ok(privateResponse.identity?.userSupplied);
  });

  it('represents optional unscored choice context', () => {
    const question = ARCHITECTURE_COVERAGE_QUESTIONS.serviceOptionalContext;
    const contextChoice = question.choices.find((c) => c.opensOptionalContext);
    if (!contextChoice) {
      assert.fail('expected a choice that opens optional context');
    }
    assert.equal(contextChoice.optionalContext?.scored, false);
    assert.equal(contextChoice.optionalContext?.required, false);

    const manifest = getManifestQuestion(9, 2);
    assert.ok(manifest?.features.includes('optional_choice_context'));
    assert.ok(manifest?.specialChoices.some((c) => c.opensOptionalContext));

    const privateResponse: PrivateQuestionnaireResponse = {
      questionId: question.id,
      responseState: 'answered',
      activeQualifiers: [],
      selectedChoices: [
        {
          choiceId: contextChoice.id,
          contextText: 'optional unscored contribution context',
        },
      ],
    };
    const storedContext = privateResponse.selectedChoices[0]?.contextText ?? '';
    assert.ok(storedContext.length > 0);

    const synthetic = getSyntheticCatalogFromManifest();
    const synthQ = synthetic.categories
      .find((c) => c.number === 9)
      ?.questions.find((q) => q.number === 2);
    assert.ok(synthQ?.choices.some((c) => c.opensOptionalContext && c.optionalContext?.scored === false));
  });

  it('represents no-specific-requirement, limited-openness, and evaluation-preference without collapse', () => {
    const noSpecific = ARCHITECTURE_COVERAGE_QUESTIONS.noSpecificRequirement;
    const integrity = ARCHITECTURE_COVERAGE_QUESTIONS.integrityQualifiers;

    assert.ok(
      noSpecific.allowedSpecialResponseStates?.includes('no_specific_requirement')
    );
    assert.ok(noSpecific.allowedQualifiers?.includes('no_specific_requirement'));
    assert.ok(
      noSpecific.choices.some(
        (c) =>
          c.specialResponseState === 'no_specific_requirement' &&
          c.mutuallyExclusive === true
      )
    );

    assert.ok(integrity.allowedQualifiers?.includes('limited_openness'));
    assert.ok(integrity.allowedQualifiers?.includes('evaluation_preference'));
    assert.ok(
      integrity.choices.some(
        (c) => c.qualifier === 'limited_openness' && c.qualifierCoexistsWithSelections === true
      )
    );
    assert.ok(
      integrity.choices.some(
        (c) =>
          c.qualifier === 'evaluation_preference' && c.qualifierCoexistsWithSelections === true
      )
    );

    // Distinct from approximate response states.
    assert.ok((RESPONSE_QUALIFIERS as readonly string[]).includes('limited_openness'));
    assert.ok((RESPONSE_QUALIFIERS as readonly string[]).includes('evaluation_preference'));
    assert.ok((RESPONSE_STATES as readonly string[]).includes('no_specific_requirement'));
    assert.equal(
      (RESPONSE_STATES as readonly string[]).includes('limited_openness'),
      false
    );
    assert.equal(
      (RESPONSE_STATES as readonly string[]).includes('evaluation_preference'),
      false
    );

    const manifestIntegrity = getManifestQuestion(10, 14);
    assert.equal(manifestIntegrity?.listedChoiceCount, 14);
    assert.equal(manifestIntegrity?.choiceCount, 16);
    assert.ok(
      manifestIntegrity?.specialChoices.some(
        (c) => c.qualifier === 'limited_openness' && c.architectureOnly
      )
    );
    assert.ok(
      manifestIntegrity?.specialChoices.some(
        (c) => c.qualifier === 'evaluation_preference' && c.architectureOnly
      )
    );

    const synthetic = getSyntheticCatalogFromManifest();
    const synthIntegrity = synthetic.categories
      .find((c) => c.number === 10)
      ?.questions.find((q) => q.number === 14);
    assert.equal(synthIntegrity?.choices.length, 16);
    assert.ok(synthIntegrity?.allowedQualifiers?.includes('limited_openness'));
    assert.ok(synthIntegrity?.allowedQualifiers?.includes('evaluation_preference'));
  });

  it('represents qualifiers that coexist with concrete selections', () => {
    const service = ARCHITECTURE_COVERAGE_QUESTIONS.serviceOptionalContext;
    const limitedCapacity = service.choices.find(
      (c) => c.qualifier === 'limited_capacity_contribution'
    );
    assert.equal(limitedCapacity?.qualifierCoexistsWithSelections, true);
    assert.equal(limitedCapacity?.mutuallyExclusive ?? false, false);

    const integrity = ARCHITECTURE_COVERAGE_QUESTIONS.integrityQualifiers;
    for (const qualifier of ['limited_openness', 'evaluation_preference'] as const) {
      const choice = integrity.choices.find((c) => c.qualifier === qualifier);
      assert.equal(choice?.qualifierCoexistsWithSelections, true);
    }
  });

  it('rejects choice-level states/qualifiers not permitted by question configuration', () => {
    const live = getQuestionnaireCatalog();
    const disallowedQualifier: QuestionnaireCatalog = {
      ...live,
      categories: [
        {
          ...live.categories[0],
          questions: live.categories[0].questions.map((q) =>
            q.number === 1
              ? {
                  ...q,
                  choices: q.choices.map((c, i) =>
                    i === 0 ? { ...c, qualifier: 'limited_openness' as const } : c
                  ),
                }
              : q
          ),
        },
      ],
    };
    const qualifierResult = validateQuestionnaireCatalog(disallowedQualifier);
    assert.equal(qualifierResult.ok, false);
    if (!qualifierResult.ok) {
      assert.ok(
        qualifierResult.issues.some((i) => i.code === 'choice_qualifier_not_permitted')
      );
    }

    const disallowedState: QuestionnaireCatalog = {
      ...live,
      categories: [
        {
          ...live.categories[0],
          questions: live.categories[0].questions.map((q) =>
            q.number === 1
              ? {
                  ...q,
                  choices: q.choices.map((c, i) =>
                    i === 0
                      ? { ...c, specialResponseState: 'no_specific_requirement' as const }
                      : c
                  ),
                }
              : q
          ),
        },
      ],
    };
    const stateResult = validateQuestionnaireCatalog(disallowedState);
    assert.equal(stateResult.ok, false);
    if (!stateResult.ok) {
      assert.ok(
        stateResult.issues.some((i) => i.code === 'choice_special_state_not_permitted')
      );
    }
  });

  it('enforces priority display-minimum integrity', () => {
    const valid = ARCHITECTURE_COVERAGE_QUESTIONS.noSpecificRequirement;
    assert.equal(valid.priorityFollowUp?.selectionCount, 2);
    assert.equal(valid.priorityFollowUp?.minEligibleSelectionsBeforeDisplay, 2);
    assert.deepEqual(valid.priorityFollowUp?.excludedChoiceIds, [
      'coverage_c09_q05_c06',
    ]);

    const live = getQuestionnaireCatalog();
    const brokenMin: QuestionnaireCatalog = {
      ...live,
      categories: [
        {
          ...live.categories[0],
          questions: live.categories[0].questions.map((q) =>
            q.number === 5
              ? {
                  ...q,
                  priorityFollowUp: {
                    prompt: q.priorityFollowUp!.prompt,
                    selectionCount: 2,
                    unordered: true,
                    minEligibleSelectionsBeforeDisplay: 1,
                  },
                }
              : q
          ),
        },
      ],
    };
    const minResult = validateQuestionnaireCatalog(brokenMin);
    assert.equal(minResult.ok, false);
    if (!minResult.ok) {
      assert.ok(
        minResult.issues.some((i) => i.code === 'priority_min_eligible_below_selection_count')
      );
    }

    const exceedsAvailable: QuestionnaireCatalog = {
      ...live,
      categories: [
        {
          ...live.categories[0],
          questions: live.categories[0].questions.map((q) =>
            q.number === 5
              ? {
                  ...q,
                  priorityFollowUp: {
                    prompt: q.priorityFollowUp!.prompt,
                    selectionCount: 2,
                    unordered: true,
                    eligibleChoiceIds: [q.choices[0].id, q.choices[1].id],
                    minEligibleSelectionsBeforeDisplay: 3,
                  },
                }
              : q
          ),
        },
      ],
    };
    const exceedsResult = validateQuestionnaireCatalog(exceedsAvailable);
    assert.equal(exceedsResult.ok, false);
    if (!exceedsResult.ok) {
      assert.ok(
        exceedsResult.issues.some((i) => i.code === 'priority_min_eligible_exceeds_available')
      );
    }

    const conflict: QuestionnaireCatalog = {
      ...live,
      categories: [
        {
          ...live.categories[0],
          questions: live.categories[0].questions.map((q) =>
            q.number === 5
              ? {
                  ...q,
                  priorityFollowUp: {
                    prompt: q.priorityFollowUp!.prompt,
                    selectionCount: 2,
                    unordered: true,
                    eligibleChoiceIds: [q.choices[0].id, q.choices[1].id, q.choices[2].id],
                    excludedChoiceIds: [q.choices[0].id],
                    minEligibleSelectionsBeforeDisplay: 2,
                  },
                }
              : q
          ),
        },
      ],
    };
    const conflictResult = validateQuestionnaireCatalog(conflict);
    assert.equal(conflictResult.ok, false);
    if (!conflictResult.ok) {
      assert.ok(
        conflictResult.issues.some((i) => i.code === 'priority_eligible_excluded_conflict')
      );
    }

    const manifestPriority = getManifestQuestion(9, 5);
    assert.equal(manifestPriority?.priorityFollowUp?.minEligibleSelectionsBeforeDisplay, 2);
    assert.deepEqual(manifestPriority?.priorityFollowUp?.excludedChoiceIndexes, [15]);
  });

  it('keeps Category 1 priority behavior unchanged', () => {
    const live = getQuestionnaireCatalog();
    const byNumber = Object.fromEntries(live.categories[0].questions.map((q) => [q.number, q]));
    assert.equal(byNumber[5].priorityFollowUp?.selectionCount, 2);
    assert.equal(byNumber[12].priorityFollowUp?.selectionCount, 2);
    assert.equal(byNumber[15].priorityFollowUp?.selectionCount, 2);
    assert.equal(byNumber[9].priorityFollowUp, undefined);
    for (const n of [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14]) {
      assert.equal(byNumber[n].priorityFollowUp, undefined);
    }
  });

  it('encodes row-lock serialization and extended storage in the migration', () => {
    const migration = readRepo(
      'supabase/migrations/20260723000000_questionnaire_foundation.sql'
    );
    assert.match(migration, /for update/i);
    assert.match(migration, /Serialize selection mutations per response/);
    assert.match(migration, /Serialize priority mutations per response/);
    assert.match(migration, /forge_questionnaire_response_identity_immutable/);
    assert.match(migration, /user_questionnaire_responses_identity_immutable/);
    assert.match(migration, /structured_identity_config/);
    assert.match(migration, /opens_optional_context/);
    assert.match(migration, /context_text/);
    assert.match(migration, /questionnaire_response_qualifier/);
    assert.match(migration, /active_qualifiers/);
    assert.match(migration, /identity_user_supplied/);
    assert.match(migration, /identity_private_matching_allowed/);
    assert.match(migration, /identity_refinement/);
    assert.match(migration, /identity_public_display_allowed/);
    assert.match(migration, /no_specific_requirement/);
    assert.match(migration, /limited_openness/);
    assert.match(migration, /evaluation_preference/);
    assert.equal(
      FOUNDATION_CAPABILITY_MANIFEST.databaseIntegrity.responseIdentityImmutableAfterInsert,
      true
    );
    assert.ok(migration.includes(MASTER_ELIGIBILITY_DESCRIPTION) === false); // not seeded; coverage only
  });

  it('manifest features cover every required advanced structure across categories 2–10', () => {
    const allFeatures = new Set(
      MASTER_STRUCTURE_MANIFEST.questions.flatMap((q) => q.features)
    );
    for (const required of [
      'structured_identity',
      'identity_refinement',
      'user_supplied_identity',
      'identity_privacy',
      'identity_private_matching_control',
      'optional_choice_context',
      'no_specific_requirement',
      'limited_openness_qualifier',
      'evaluation_preference_state',
      'qualifier_may_coexist',
      'priority_min_eligible',
      'priority_excluded_choices',
      'select_all',
      'conditional_scenario',
      'eligibility',
    ]) {
      assert.ok(allFeatures.has(required), required);
    }
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.optionalUnscoredChoiceContext, true);
    assert.equal(
      FOUNDATION_CAPABILITY_MANIFEST.databaseIntegrity.responseRowLockForSelectionMutations,
      true
    );
    assert.equal(MASTER_STRUCTURE_COUNTS.questions, 150);
    assert.equal(MASTER_STRUCTURE_COUNTS.eligibilityRuleAttachments, 3);
    assert.equal(MASTER_STRUCTURE_COUNTS.conditionalScenarioQuestions, 4);
    assert.equal(MASTER_STRUCTURE_COUNTS.structuredIdentitySelections, 2);
    assert.equal(MASTER_STRUCTURE_COUNTS.priorityFollowUps, 38);
  });
});
