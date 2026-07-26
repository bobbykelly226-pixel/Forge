import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  evaluateQuestionnaireCompatibility,
  QUESTIONNAIRE_ALIGNMENT_COVERAGE,
} from '@/lib/compatibility/questionnaire-engine';
import {
  parseQuestionnaireAlignmentComparison,
  parseQuestionnaireAlignmentComparisonMap,
} from '@/lib/compatibility/questionnaire-payload';
import type {
  QuestionnaireAlignmentComparison,
  QuestionnaireComparisonQuestion,
  QuestionnaireCompatibilityCategoryKey,
} from '@/lib/compatibility/questionnaire-types';

const categories: Array<{
  key: QuestionnaireCompatibilityCategoryKey;
  title: string;
}> = [
  {
    key: 'relationship_vision_intentions',
    title: 'Relationship Vision & Intentions',
  },
  { key: 'values_character', title: 'Values & Character' },
  {
    key: 'communication_emotional_connection',
    title: 'Communication & Emotional Connection',
  },
];

function question(
  categoryIndex: number,
  questionNumber: number,
  overrides: Partial<QuestionnaireComparisonQuestion> = {}
): QuestionnaireComparisonQuestion {
  const category = categories[categoryIndex]!;
  return {
    categoryKey: category.key,
    categoryTitle: category.title,
    categoryNumber: categoryIndex + 1,
    questionKey: `${category.key}_q${String(questionNumber).padStart(2, '0')}`,
    questionNumber,
    prompt: `Question ${questionNumber}`,
    alignmentPurpose: 'Test comparison purpose.',
    responseBehavior: 'single_choice',
    comparable: true,
    exactMatch: true,
    selectedOverlap: 1,
    priorityOverlap: null,
    ordinalDistance: null,
    ordinalSpan: null,
    ...overrides,
  };
}

function comparison(
  questions: QuestionnaireComparisonQuestion[]
): QuestionnaireAlignmentComparison {
  return {
    versionKey: 'compatibility_profile_v1',
    partnerId: 'partner-id',
    viewerAnsweredCount: questions.length,
    partnerAnsweredCount: questions.length,
    comparableQuestionCount: questions.filter((item) => item.comparable).length,
    comparableCategoryCount: new Set(
      questions.filter((item) => item.comparable).map((item) => item.categoryKey)
    ).size,
    questions,
  };
}

test('questionnaire engine waits for responsible two-person coverage', () => {
  const questions = Array.from({ length: 11 }, (_, index) =>
    question(index % 3, (index % 4) + 1)
  );
  assert.equal(
    QUESTIONNAIRE_ALIGNMENT_COVERAGE.minimumQuestions,
    12
  );
  assert.equal(evaluateQuestionnaireCompatibility(comparison(questions)), null);
});

test('twelve comparable answers across three categories can produce Strong Alignment', () => {
  const questions = categories.flatMap((_, categoryIndex) =>
    Array.from({ length: 4 }, (_, index) =>
      question(categoryIndex, index + 1)
    )
  );
  const result = evaluateQuestionnaireCompatibility(comparison(questions));
  assert.ok(result);
  assert.equal(result.alignment.label, 'Strong Alignment');
  assert.equal(result.importantDifferences.length, 0);
  assert.equal(result.strengths.length, 3);
  assert.ok(result.whyForgeIntroducedYou.length > 0);
  assert.equal('score' in result.alignment, false);
  assert.equal('confidence' in result.alignment, false);
});

test('direct high-impact scale divergence becomes a separate Important Alignment Factor', () => {
  const questions = categories.flatMap((_, categoryIndex) =>
    Array.from({ length: 4 }, (_, index) =>
      question(categoryIndex, index + 1)
    )
  );
  questions[1] = question(0, 2, {
    questionKey: 'relationship_vision_intentions_q02',
    responseBehavior: 'scale_range',
    exactMatch: false,
    selectedOverlap: 0,
    ordinalDistance: 4,
    ordinalSpan: 4,
  });

  const result = evaluateQuestionnaireCompatibility(comparison(questions));
  assert.ok(result);
  assert.equal(result.alignment.label, 'More to Discover');
  assert.equal(result.importantDifferences.length, 1);
  assert.equal(
    result.importantDifferences[0]?.title,
    'Relationship Vision & Intentions'
  );
  assert.match(
    result.importantDifferences[0]?.copy ?? '',
    /direct conversation, not judgment/i
  );
  assert.doesNotMatch(
    JSON.stringify(result),
    /relationship_vision_intentions_q02_c0[1-9]/
  );
});

test('scenario and boundary-list differences never become inferred dealbreakers', () => {
  const questions = categories.flatMap((_, categoryIndex) =>
    Array.from({ length: 4 }, (_, index) =>
      question(categoryIndex, index + 1)
    )
  );
  questions[3] = question(0, 10, {
    responseBehavior: 'multi_select',
    exactMatch: false,
    selectedOverlap: 0,
  });
  questions[7] = question(1, 4, {
    responseBehavior: 'scenario_choice',
    exactMatch: false,
    selectedOverlap: 0,
  });

  const result = evaluateQuestionnaireCompatibility(comparison(questions));
  assert.ok(result);
  assert.equal(result.importantDifferences.length, 0);
  assert.ok(
    result.worthDiscussing.length > 0 ||
      result.compatibleDifferences.length > 0
  );
});

test('payload parser accepts metrics and discards malformed or raw-shaped rows', () => {
  const payload = {
    ok: true,
    version_key: 'compatibility_profile_v1',
    partner_id: 'partner-id',
    viewer_answered_count: 12,
    partner_answered_count: 12,
    comparable_question_count: 1,
    comparable_category_count: 1,
    questions: [
      {
        category_key: 'relationship_vision_intentions',
        category_title: 'Relationship Vision & Intentions',
        category_number: 1,
        question_key: 'relationship_vision_intentions_q01',
        question_number: 1,
        prompt: 'Prompt',
        alignment_purpose: 'Purpose',
        response_behavior: 'single_choice',
        comparable: true,
        exact_match: true,
        selected_overlap: 1,
        priority_overlap: null,
        ordinal_distance: null,
        ordinal_span: null,
        choice_key: 'must-not-survive-parser',
        context_text: 'must-not-survive-parser',
      },
    ],
  };
  const parsed = parseQuestionnaireAlignmentComparison(payload);
  assert.ok(parsed);
  assert.equal(parsed.questions.length, 1);
  assert.equal('choiceKey' in parsed.questions[0]!, false);
  assert.equal('contextText' in parsed.questions[0]!, false);
  assert.deepEqual(
    parseQuestionnaireAlignmentComparisonMap({
      ok: true,
      comparisons: { 'partner-id': payload },
    }),
    { 'partner-id': parsed }
  );
});

test('migration output contract contains no raw-answer JSON fields', () => {
  const migration = readFileSync(
    new URL(
      '../../supabase/migrations/20260726071036_questionnaire_alignment_comparison_v1.sql',
      import.meta.url
    ),
    'utf8'
  );
  const outputSection = migration.slice(
    migration.indexOf("'questions', coalesce"),
    migration.indexOf("comment on function public.forge_questionnaire_alignment_pair")
  );
  assert.doesNotMatch(outputSection, /'choice_key'/);
  assert.doesNotMatch(outputSection, /'choice_label'/);
  assert.doesNotMatch(outputSection, /'context_text'/);
  assert.doesNotMatch(outputSection, /'identity_refinement'/);
  assert.match(outputSection, /'selected_overlap'/);
  assert.match(outputSection, /'ordinal_distance'/);
});
