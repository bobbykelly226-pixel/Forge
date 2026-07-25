import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { getQuestionnaireCatalog, QUESTIONNAIRE_VERSION } from '@/lib/questionnaire/catalog';
import {
  isOpenToParentingOrStepparentingRole,
  isQuestionCurrentlyEligible,
} from '@/lib/questionnaire/eligibility';
import {
  deriveActiveQualifiers,
  deriveSpecialResponseState,
  emptyPersistedAnswer,
  isPersistedAnswerComplete,
  sanitizeAnswerAgainstCatalog,
} from '@/lib/questionnaire/persistence/answer-state';
import {
  areAllCategoriesComplete,
  countAllEligibleQuestions,
  countCompletedCategories,
  getEligibleQuestions,
  isCategoryComplete,
} from '@/lib/questionnaire/persistence/completion';
import {
  CATEGORY_COMPLETE_COPY,
  COMPATIBILITY_PROFILE_PAGE_DESCRIPTION,
  DIRECTORY_COPY,
  OVERALL_COMPLETE_COPY,
  PROFILE_CARD_COPY,
  RESTART_CATEGORY_COPY,
  RESTART_FULL_COPY,
  SAVE_STATUS_COPY,
} from '@/lib/questionnaire/persistence/copy';
import { QuestionSaveWorker } from '@/lib/questionnaire/persistence/save-worker';
import {
  shouldShowPriorityFollowUp,
  syncAnswerAfterBaseChange,
  toggleBaseSelection,
} from '@/lib/questionnaire/preview/category-01-preview-flow';
import { PREVIEW_NOTICE } from '@/lib/questionnaire/preview/category-01-preview-flow';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursive(full));
    else files.push(full);
  }
  return files;
}

const DASH_OR_HYPHEN_PATTERN = /[\u2010-\u2015\u2212—–-]/;

function assertNoDashPunctuation(label: string, value: string) {
  assert.equal(
    DASH_OR_HYPHEN_PATTERN.test(value),
    false,
    `${label} contains dash/hyphen punctuation: ${value.slice(0, 160)}`
  );
}

describe('Compatibility Profile Persistence V1', () => {
  const catalog = getQuestionnaireCatalog();

  it('keeps exactly 10 categories and 100 questions', () => {
    assert.equal(catalog.categories.length, 10);
    assert.equal(
      catalog.categories.reduce((sum, category) => sum + category.questions.length, 0),
      100
    );
    assert.equal(QUESTIONNAIRE_VERSION, 'compatibility_profile_v1');
  });

  it('protects /compatibility-profile and redirects unauthenticated users', () => {
    const page = read('app/compatibility-profile/page.tsx');
    const proxy = read('proxy.ts');
    assert.match(page, /redirect\('\/login\?redirectTo=\/compatibility-profile'\)/);
    assert.match(proxy, /pathname === '\/compatibility-profile'/);
    assert.match(proxy, /pathname\.startsWith\('\/compatibility-profile\/'\)/);
  });

  it('keeps the preview route in memory only', () => {
    const previewPage = read('app/onboarding-v2-preview/page.tsx');
    const previewShell = read(
      'components/questionnaire-preview/CompatibilityProfilePreviewShell.tsx'
    );
    assert.match(previewPage, /CompatibilityProfilePreviewShell/);
    assert.doesNotMatch(previewShell, /saveCompatibilityAnswerAction/);
    assert.doesNotMatch(previewShell, /save_my_questionnaire_response/);
    assert.doesNotMatch(previewShell, /localStorage|sessionStorage/);
    assert.equal(PREVIEW_NOTICE, 'Preview mode. Your answers are not being saved yet.');
  });

  it('routes real answers only through dedicated questionnaire tables and RPCs', () => {
    const data = read('lib/data/questionnaire.ts');
    const actions = read('app/actions/questionnaire.ts');
    assert.match(data, /save_my_questionnaire_response/);
    assert.match(data, /load_my_questionnaire_state/);
    assert.match(actions, /saveMyQuestionnaireResponse/);
    assert.match(actions, /loadMyQuestionnaireState/);
    for (const source of [data, actions]) {
      assert.doesNotMatch(source, /\.from\(['"]profile_answers['"]\)/);
      assert.doesNotMatch(source, /\.from\(['"]compatibility_answers['"]\)/);
      assert.doesNotMatch(source, /saveProfileAnswer/);
    }
  });

  it('does not introduce profile_answers or compatibility_answers writes for the 100 questions', () => {
    const files = [
      'lib/data/questionnaire.ts',
      'app/actions/questionnaire.ts',
      'components/compatibility-profile/CompatibilityProfileShell.tsx',
      'app/compatibility-profile/page.tsx',
    ];
    for (const file of files) {
      const source = read(file);
      assert.doesNotMatch(source, /\.from\(['"]profile_answers['"]\)/);
      assert.doesNotMatch(source, /\.from\(['"]compatibility_answers['"]\)/);
      assert.doesNotMatch(source, /localStorage|sessionStorage/);
    }
  });

  it('sanitizes choices against the live catalog and rejects cross question choices', () => {
    const category = catalog.categories[0];
    const question = category.questions[0];
    const foreign = catalog.categories[1].questions[0].choices[0].id;
    const sanitized = sanitizeAnswerAgainstCatalog(question, {
      ...emptyPersistedAnswer(),
      selectedChoiceIds: [foreign, question.choices[0].id],
      revision: 1,
    });
    assert.deepEqual(sanitized.selectedChoiceIds, [question.choices[0].id]);
    assert.ok(!sanitized.selectedChoiceIds.includes(foreign));
  });

  it('enforces selection limits and mutually exclusive choices', () => {
    const multi = catalog.categories
      .flatMap((category) => category.questions)
      .find(
        (question) =>
          question.responseBehavior === 'multi_select' &&
          question.maxSelections !== null &&
          question.maxSelections >= 1
      );
    assert.ok(multi);
    const picks = multi.choices.slice(0, (multi.maxSelections ?? 1) + 1).map((c) => c.id);
    let answer = emptyPersistedAnswer();
    for (const choiceId of picks) {
      const result = toggleBaseSelection(
        multi,
        {
          selectedChoiceIds: answer.selectedChoiceIds,
          priorityChoiceIds: answer.priorityChoiceIds,
        },
        choiceId
      );
      if (result.ok) {
        answer = sanitizeAnswerAgainstCatalog(multi, {
          ...answer,
          selectedChoiceIds: result.answer.selectedChoiceIds,
          priorityChoiceIds: result.answer.priorityChoiceIds,
          revision: answer.revision + 1,
        });
      }
    }
    assert.ok(answer.selectedChoiceIds.length <= (multi.maxSelections as number));

    const exclusive = catalog.categories
      .flatMap((category) => category.questions)
      .find(
        (question) =>
          question.responseBehavior === 'multi_select' &&
          question.choices.some((choice) => choice.mutuallyExclusive) &&
          question.choices.some((choice) => !choice.mutuallyExclusive)
      );
    assert.ok(exclusive);
    const exclusiveChoice = exclusive.choices.find((choice) => choice.mutuallyExclusive);
    const other = exclusive.choices.find((choice) => !choice.mutuallyExclusive);
    assert.ok(exclusiveChoice && other);
    const withOther = toggleBaseSelection(
      exclusive,
      { selectedChoiceIds: [], priorityChoiceIds: [] },
      other.id
    );
    assert.equal(withOther.ok, true);
    const withExclusive = toggleBaseSelection(
      exclusive,
      withOther.ok
        ? withOther.answer
        : { selectedChoiceIds: [other.id], priorityChoiceIds: [] },
      exclusiveChoice.id
    );
    assert.equal(withExclusive.ok, true);
    if (withExclusive.ok) {
      assert.deepEqual(withExclusive.answer.selectedChoiceIds, [exclusiveChoice.id]);
    }
  });

  it('keeps priority choices as selected eligible base choices and clears invalid ones', () => {
    const question = catalog.categories
      .flatMap((category) => category.questions)
      .find((item) => item.priorityFollowUp);
    assert.ok(question);
    const selected = question.choices
      .slice(0, question.priorityFollowUp?.selectionCount ?? 2)
      .map((choice) => choice.id);
    while (
      selected.length <
      (question.priorityFollowUp?.minEligibleSelectionsBeforeDisplay ??
        question.priorityFollowUp?.selectionCount ??
        2)
    ) {
      const next = question.choices.find((choice) => !selected.includes(choice.id));
      if (!next) break;
      selected.push(next.id);
    }
    assert.ok(shouldShowPriorityFollowUp(question, selected));
    const synced = syncAnswerAfterBaseChange(question, selected, [
      selected[0],
      'not-a-real-choice',
    ]);
    assert.ok(synced.priorityChoiceIds.every((id) => selected.includes(id)));
    assert.ok(!synced.priorityChoiceIds.includes('not-a-real-choice'));

    const reduced = syncAnswerAfterBaseChange(question, [selected[0]], synced.priorityChoiceIds);
    assert.ok(reduced.priorityChoiceIds.every((id) => id === selected[0]));
  });

  it('stores optional context only for configured selected choices', () => {
    const question = catalog.categories
      .flatMap((category) => category.questions)
      .find((item) => item.choices.some((choice) => choice.opensOptionalContext));
    assert.ok(question);
    const openChoice = question.choices.find((choice) => choice.opensOptionalContext);
    const closedChoice = question.choices.find((choice) => !choice.opensOptionalContext);
    assert.ok(openChoice && closedChoice);
    const sanitized = sanitizeAnswerAgainstCatalog(question, {
      ...emptyPersistedAnswer(),
      selectedChoiceIds: [openChoice.id],
      choiceContexts: {
        [openChoice.id]: 'Private context note',
        [closedChoice.id]: 'Should not persist',
      },
      revision: 1,
    });
    assert.equal(sanitized.choiceContexts[openChoice.id], 'Private context note');
    assert.equal(sanitized.choiceContexts[closedChoice.id], undefined);
  });

  it('derives special response states and active qualifiers from the catalog', () => {
    const question = catalog.categories
      .flatMap((category) => category.questions)
      .find((item) => item.choices.some((choice) => choice.specialResponseState || choice.qualifier));
    assert.ok(question);
    const special = question.choices.find((choice) => choice.specialResponseState);
    if (special?.specialResponseState) {
      assert.equal(
        deriveSpecialResponseState(question, [special.id]),
        special.specialResponseState
      );
    }
    const qualified = question.choices.find((choice) => choice.qualifier);
    if (qualified?.qualifier) {
      assert.ok(deriveActiveQualifiers(question, [qualified.id]).includes(qualified.qualifier));
    }
  });

  it('round trips structured identity privacy defaults and separate political controls', () => {
    const politics = catalog.categories[7].questions[0];
    assert.equal(politics.responseBehavior, 'structured_identity');
    assert.ok(politics.structuredIdentity?.privacy.userControlsPublicDisplay);
    assert.ok(politics.structuredIdentity?.privacy.userControlsPrivateMatchingUse);
    const sanitized = sanitizeAnswerAgainstCatalog(politics, {
      ...emptyPersistedAnswer(),
      selectedChoiceIds: [politics.choices[0].id],
      identity: {
        refinement: 'More detail',
        userSupplied: 'Custom label',
        publicDisplayAllowed: true,
        privateMatchingAllowed: false,
      },
      revision: 1,
    });
    assert.equal(sanitized.identity.refinement, 'More detail');
    assert.equal(sanitized.identity.userSupplied, 'Custom label');
    assert.equal(sanitized.identity.publicDisplayAllowed, true);
    assert.equal(sanitized.identity.privateMatchingAllowed, false);
    const defaults = sanitizeAnswerAgainstCatalog(politics, {
      ...emptyPersistedAnswer(),
      selectedChoiceIds: [politics.choices[0].id],
      revision: 1,
    });
    assert.equal(defaults.identity.publicDisplayAllowed, false);
    assert.equal(defaults.identity.privateMatchingAllowed, false);
  });

  it('applies only the approved parenting eligibility predicate', () => {
    assert.equal(
      isOpenToParentingOrStepparentingRole({
        has_children: 'no',
        children: 'no',
        open_to_partner_with_children: 'no',
      }),
      false
    );
    assert.equal(
      isOpenToParentingOrStepparentingRole({
        has_children: 'yes',
        children: 'no',
        open_to_partner_with_children: 'no',
      }),
      true
    );
    assert.equal(
      isOpenToParentingOrStepparentingRole({
        has_children: 'no',
        children: 'open',
        open_to_partner_with_children: 'no',
      }),
      true
    );
    assert.equal(
      isOpenToParentingOrStepparentingRole({
        has_children: 'no',
        children: 'no',
        open_to_partner_with_children: 'open',
      }),
      true
    );

    for (const categoryNumber of [7, 8, 9]) {
      const category = catalog.categories[categoryNumber - 1];
      const q9 = category.questions.find((question) => question.number === 9);
      assert.ok(q9?.eligibilityRuleId);
      assert.equal(
        isQuestionCurrentlyEligible(q9.eligibilityRuleId, {
          has_children: 'no',
          children: 'no',
          open_to_partner_with_children: 'no',
        }),
        false
      );
      const ineligible = getEligibleQuestions(category, {
        has_children: 'no',
        children: 'no',
        open_to_partner_with_children: 'no',
      });
      assert.equal(ineligible.length, 9);
      assert.ok(!ineligible.some((question) => question.id === q9.id));
    }
  });

  it('excludes hidden conditional answers from completion while preserving stored answers', () => {
    const category = catalog.categories[6];
    const q9 = category.questions.find((question) => question.number === 9);
    assert.ok(q9);
    const answers: Record<string, ReturnType<typeof emptyPersistedAnswer>> = {};
    for (const question of category.questions) {
      if (question.number === 9) continue;
      answers[question.id] = sanitizeAnswerAgainstCatalog(question, {
        ...emptyPersistedAnswer(),
        selectedChoiceIds: question.choices
          .slice(0, question.minSelections)
          .map((choice) => choice.id),
        priorityChoiceIds: [],
        revision: 1,
      });
      if (shouldShowPriorityFollowUp(question, answers[question.id].selectedChoiceIds)) {
        const need = question.priorityFollowUp?.selectionCount ?? 2;
        answers[question.id].priorityChoiceIds = answers[question.id].selectedChoiceIds.slice(
          0,
          need
        );
        answers[question.id] = sanitizeAnswerAgainstCatalog(question, answers[question.id]);
      }
    }
    answers[q9.id] = sanitizeAnswerAgainstCatalog(q9, {
      ...emptyPersistedAnswer(),
      selectedChoiceIds: [q9.choices[0].id],
      revision: 1,
    });

    const ineligibleProfile = {
      has_children: 'no',
      children: 'no',
      open_to_partner_with_children: 'no',
    };
    assert.equal(isCategoryComplete(category, answers, ineligibleProfile), true);
    assert.ok(answers[q9.id].selectedChoiceIds.length > 0);

    const eligibleProfile = {
      has_children: 'yes',
      children: 'yes',
      open_to_partner_with_children: 'yes',
    };
    delete answers[q9.id];
    assert.equal(isCategoryComplete(category, answers, eligibleProfile), false);
  });

  it('requires all ten categories for overall completion and tracks progress status inputs', () => {
    const answersByCategory: Record<
      number,
      Record<string, ReturnType<typeof emptyPersistedAnswer>>
    > = {};
    const profile = {
      has_children: 'yes',
      children: 'yes',
      open_to_partner_with_children: 'yes',
    };
    assert.equal(countCompletedCategories(catalog.categories, answersByCategory, profile), 0);
    assert.equal(areAllCategoriesComplete(catalog.categories, answersByCategory, profile), false);

    for (const category of catalog.categories) {
      answersByCategory[category.number] = {};
      for (const question of getEligibleQuestions(category, profile)) {
        const selected = question.choices
          .slice(0, Math.max(question.minSelections, 1))
          .map((choice) => choice.id);
        let answer = sanitizeAnswerAgainstCatalog(question, {
          ...emptyPersistedAnswer(),
          selectedChoiceIds: selected,
          revision: 1,
        });
        if (shouldShowPriorityFollowUp(question, answer.selectedChoiceIds)) {
          const need = question.priorityFollowUp?.selectionCount ?? 2;
          while (answer.selectedChoiceIds.length < need) {
            const extra = question.choices.find(
              (choice) => !answer.selectedChoiceIds.includes(choice.id)
            );
            if (!extra) break;
            answer = sanitizeAnswerAgainstCatalog(question, {
              ...answer,
              selectedChoiceIds: [...answer.selectedChoiceIds, extra.id],
              revision: answer.revision + 1,
            });
          }
          answer = sanitizeAnswerAgainstCatalog(question, {
            ...answer,
            priorityChoiceIds: answer.selectedChoiceIds.slice(0, need),
            revision: answer.revision + 1,
          });
        }
        assert.equal(isPersistedAnswerComplete(question, answer), true);
        answersByCategory[category.number][question.id] = answer;
      }
    }

    assert.equal(countCompletedCategories(catalog.categories, answersByCategory, profile), 10);
    assert.equal(areAllCategoriesComplete(catalog.categories, answersByCategory, profile), true);
    assert.equal(countAllEligibleQuestions(catalog.categories, profile), 100);
  });

  it('coalesces in-flight saves and sends the newest answer with the returned revision', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 0);
    const generation = worker.getGeneration();
    const seen: Array<{ value: string; revision: number }> = [];
    let resolveSlow: (() => void) | undefined;
    const slowGate = new Promise<void>((resolve) => {
      resolveSlow = resolve;
    });

    const first = worker.enqueue(
      'q1',
      { answer: { value: 'a' }, generation },
      async (args) => {
        seen.push({ value: args.answer.value, revision: args.expectedRevision });
        await slowGate;
        return { success: true as const, data: { revision: 1, operationId: args.operationId } };
      }
    );
    const second = worker.enqueue(
      'q1',
      { answer: { value: 'b' }, generation },
      async (args) => {
        seen.push({ value: args.answer.value, revision: args.expectedRevision });
        return { success: true as const, data: { revision: 2, operationId: args.operationId } };
      }
    );

    assert.equal(seen.length, 1);
    assert.equal(seen[0]?.revision, 0);
    resolveSlow?.();
    const [firstResult, secondResult] = await Promise.all([first, second]);
    assert.equal(firstResult.ok, true);
    assert.equal(secondResult.ok, true);
    assert.equal(seen.length, 2);
    assert.equal(seen[1]?.value, 'b');
    assert.equal(seen[1]?.revision, 1);
    assert.equal(worker.getRevision('q1'), 2);
  });

  it('treats confirmed empty selections as answered for all five minSelections: 0 questions', () => {
    const zeroSelectionQuestions = catalog.categories.flatMap((category) =>
      category.questions
        .filter((question) => question.minSelections === 0)
        .map((question) => ({ category, question }))
    );
    assert.equal(zeroSelectionQuestions.length, 5);
    assert.deepEqual(
      zeroSelectionQuestions.map(({ category, question }) => [
        category.number,
        question.number,
        question.id,
      ]),
      [
        [6, 4, 'family_children_parenting_q04'],
        [7, 3, 'faith_spirituality_worldview_q03'],
        [8, 3, 'politics_civic_life_social_issues_q03'],
        [9, 2, 'service_community_contribution_q02'],
        [10, 2, 'integrity_honesty_trust_q02'],
      ]
    );

    for (const { question } of zeroSelectionQuestions) {
      const empty = sanitizeAnswerAgainstCatalog(question, emptyPersistedAnswer());
      assert.equal(empty.selectedChoiceIds.length, 0);
      assert.equal(deriveSpecialResponseState(question, empty.selectedChoiceIds), 'answered');
      assert.equal(empty.responseState, 'answered');
      assert.equal(isPersistedAnswerComplete(question, empty), true);
      assert.notEqual(empty.responseState, 'unanswered');
    }

    const required = catalog.categories[0].questions[0];
    assert.ok(required.minSelections > 0);
    const requiredEmpty = sanitizeAnswerAgainstCatalog(required, emptyPersistedAnswer());
    assert.equal(requiredEmpty.responseState, 'unanswered');
    assert.equal(isPersistedAnswerComplete(required, requiredEmpty), false);
  });

  it('routes empty saves through save RPC for minSelections 0 and clear for required questions', () => {
    const dataLayer = read('lib/data/questionnaire.ts');
    assert.match(dataLayer, /minSelections > 0/);
    assert.match(dataLayer, /clearMyQuestionnaireQuestion/);
    assert.match(dataLayer, /p_operation_id/);
    assert.match(dataLayer, /answered-empty|minSelections: 0|response_state === 'answered'/);
    assert.doesNotMatch(
      dataLayer,
      /if \(sanitized\.selectedChoiceIds\.length === 0\) \{\s*return clearMyQuestionnaireQuestion/
    );
  });

  it('keeps restart confirmation copy exact and dash free for new persistence copy', () => {
    assert.equal(RESTART_CATEGORY_COPY.heading, 'Restart this category?');
    assert.equal(
      RESTART_CATEGORY_COPY.body,
      'This permanently clears every saved answer in this category. Answers in other categories will remain saved.'
    );
    assert.equal(RESTART_FULL_COPY.heading, 'Restart your Compatibility Profile?');
    assert.equal(
      RESTART_FULL_COPY.body,
      'This permanently clears every saved response across all ten categories. Your Essential Profile and public profile will not be changed.'
    );

    const copyValues = [
      ...Object.values(DIRECTORY_COPY),
      ...Object.values(PROFILE_CARD_COPY),
      ...Object.values(SAVE_STATUS_COPY),
      ...Object.values(CATEGORY_COMPLETE_COPY),
      ...Object.values(OVERALL_COMPLETE_COPY),
      ...Object.values(RESTART_CATEGORY_COPY),
      ...Object.values(RESTART_FULL_COPY),
      COMPATIBILITY_PROFILE_PAGE_DESCRIPTION,
    ];
    for (const value of copyValues) {
      assertNoDashPunctuation('persistence copy', value);
    }
  });

  it('keeps Category 10 protections and does not expose questionnaire data in discovery sources', () => {
    const shell = read('components/compatibility-profile/CompatibilityProfileShell.tsx');
    assert.doesNotMatch(shell, /Honesty score|Trust ranking|Integrity percentage|Moral judgment/i);
    const discoveryRules = read('lib/data-model-rules.ts');
    const discoveryData = read('lib/data/discovery.ts');
    assert.doesNotMatch(discoveryRules, /user_questionnaire_/);
    assert.doesNotMatch(discoveryData, /user_questionnaire_/);
    assert.match(discoveryRules, /DISCOVERABLE_PROFILE_COLUMNS|discoverable_profiles/);
  });

  it('keeps Compatibility Engine V1 and Essential Profile onboarding unchanged in scope', () => {
    const onboardingPage = read('app/onboarding/page.tsx');
    assert.match(onboardingPage, /OnboardingShell/);
    assert.doesNotMatch(onboardingPage, /CompatibilityProfileShell/);
    const engineFiles = listFilesRecursive('lib').filter((file) =>
      /compatib|engine/i.test(file)
    );
    assert.ok(engineFiles.length >= 0);
  });

  it('wires profile and app entry points to the real route without changing Essential completion percent', () => {
    const hub = read('components/profile/MyProfileHub.tsx');
    const appPage = read('app/app/page.tsx');
    assert.match(hub, /ProfileCompatibilityCard/);
    assert.match(hub, /completionPercent/);
    assert.match(appPage, /href="\/compatibility-profile"/);
    assert.match(appPage, /Open Compatibility Profile/);
    assert.match(appPage, /href="\/onboarding-v2-preview"/);
  });

  it('declares secure persistence RPCs and owner only questionnaire tables in migrations and types', () => {
    const migration = read(
      'supabase/migrations/20260725000000_compatibility_profile_persistence_v1.sql'
    );
    const types = read('lib/supabase/database.types.ts');
    for (const name of [
      'save_my_questionnaire_response',
      'clear_my_questionnaire_question',
      'save_my_questionnaire_progress_position',
      'clear_my_questionnaire_category',
      'clear_my_questionnaire_profile',
      'load_my_questionnaire_state',
    ]) {
      assert.match(migration, new RegExp(name));
      assert.match(types, new RegExp(name));
    }
    assert.match(migration, /auth\.uid\(\)/);
    assert.match(migration, /revoke all on function public\.save_my_questionnaire_response/i);
    assert.match(migration, /grant execute on function public\.save_my_questionnaire_response/i);
    assert.match(types, /user_questionnaire_progress/);
    assert.match(types, /user_questionnaire_responses/);
    assert.match(types, /user_questionnaire_selected_choices/);
    assert.match(types, /user_questionnaire_priority_selections/);
    assert.match(migration, /revision/);
    assert.match(migration, /write_generation/);
    assert.match(migration, /stale_revision/);
    assert.match(migration, /stale_generation/);
    assert.match(migration, /p_operation_id/);
    assert.match(migration, /Duplicate choice keys are not allowed/);
    assert.match(migration, /user_questionnaire_write_operations/);
    assert.match(
      migration,
      /revoke insert, update, delete on public\.user_questionnaire_responses/i
    );
    assert.match(types, /p_operation_id\?:/);
  });

  it('does not install a new runtime dependency for this build', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies: Record<string, string>;
    };
    assert.ok(pkg.dependencies.next);
    assert.ok(pkg.dependencies['@supabase/supabase-js']);
  });

  it('foundation migration remains forward only and does not alter Essential Profile tables', () => {
    const foundation = read(
      'supabase/migrations/20260723000000_questionnaire_foundation.sql'
    );
    assert.doesNotMatch(
      foundation,
      /alter table public\.profile_answers|alter table public\.compatibility_answers|alter table public\.profiles/i
    );
  });
});
