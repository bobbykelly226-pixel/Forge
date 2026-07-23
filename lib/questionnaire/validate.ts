import {
  RESPONSE_BEHAVIORS,
  type CatalogValidationIssue,
  type CatalogValidationResult,
  type CategoryDefinition,
  type EligibilityRuleDefinition,
  type QuestionDefinition,
  type QuestionnaireCatalog,
  type ResponseBehavior,
} from '@/lib/questionnaire/types';

const SINGLE_BEHAVIORS: ReadonlySet<ResponseBehavior> = new Set([
  'single_choice',
  'scenario_choice',
  'structured_identity',
  'scale_range',
]);

function issue(
  code: string,
  message: string,
  path?: string
): CatalogValidationIssue {
  return { code, message, path };
}

function validateQuestion(
  category: CategoryDefinition,
  question: QuestionDefinition,
  eligibilityById: Map<string, EligibilityRuleDefinition>,
  issues: CatalogValidationIssue[]
): void {
  const path = `categories[${category.number}].questions[${question.number}]`;

  if (!RESPONSE_BEHAVIORS.includes(question.responseBehavior)) {
    issues.push(
      issue('invalid_response_behavior', `Unsupported behavior: ${question.responseBehavior}`, path)
    );
  }

  if (!question.formatLabel?.trim()) {
    issues.push(issue('empty_format_label', 'Exact formatLabel is required', path));
  }

  if (!Number.isInteger(question.number) || question.number < 1) {
    issues.push(issue('invalid_question_number', 'Question number must be a positive integer', path));
  }

  if (!question.prompt?.trim()) {
    issues.push(issue('empty_prompt', 'Question prompt is required', path));
  }

  if (!question.alignmentPurpose?.trim()) {
    issues.push(issue('empty_alignment_purpose', 'Alignment purpose is required', path));
  }

  if (!Number.isInteger(question.minSelections) || question.minSelections < 0) {
    issues.push(issue('invalid_selection_limits', 'minSelections must be a non-negative integer', path));
  }

  if (question.maxSelections !== null) {
    if (!Number.isInteger(question.maxSelections) || question.maxSelections < 1) {
      issues.push(
        issue('invalid_selection_limits', 'maxSelections must be a positive integer or null', path)
      );
    } else if (question.minSelections > question.maxSelections) {
      issues.push(
        issue('invalid_selection_limits', 'minSelections cannot exceed maxSelections', path)
      );
    }
  }

  if (question.selectAllThatApply) {
    if (question.responseBehavior !== 'multi_select') {
      issues.push(
        issue(
          'select_all_incompatible',
          'selectAllThatApply requires multi_select responseBehavior',
          path
        )
      );
    }
    if (question.maxSelections !== null) {
      issues.push(
        issue(
          'select_all_incompatible',
          'selectAllThatApply requires maxSelections null (unrestricted)',
          path
        )
      );
    }
  }

  if (SINGLE_BEHAVIORS.has(question.responseBehavior)) {
    if (question.minSelections !== 1 || question.maxSelections !== 1) {
      issues.push(
        issue(
          'invalid_selection_limits',
          `${question.responseBehavior} must require exactly one selection`,
          path
        )
      );
    }
  }

  if (!Array.isArray(question.choices) || question.choices.length === 0) {
    issues.push(issue('insufficient_options', 'Question must define answer choices', path));
  } else if (
    question.maxSelections !== null &&
    question.choices.length < question.maxSelections
  ) {
    issues.push(
      issue(
        'insufficient_options',
        `Question has ${question.choices.length} options but maxSelections is ${question.maxSelections}`,
        path
      )
    );
  }

  if (
    (question.responseBehavior === 'single_choice' ||
      question.responseBehavior === 'scenario_choice' ||
      question.responseBehavior === 'multi_select' ||
      question.responseBehavior === 'structured_identity') &&
    question.choices.length < 2
  ) {
    issues.push(
      issue('insufficient_options', 'Choice questions require at least two options', path)
    );
  }

  const choiceIds = new Set<string>();
  const orders = new Set<number>();
  let exclusiveCount = 0;

  for (const choice of question.choices) {
    const choicePath = `${path}.choices[${choice.id}]`;
    if (!choice.id?.trim()) {
      issues.push(issue('empty_choice_id', 'Choice id is required', choicePath));
    } else if (choiceIds.has(choice.id)) {
      issues.push(issue('duplicate_option_id', `Duplicate option id: ${choice.id}`, choicePath));
    } else {
      choiceIds.add(choice.id);
    }

    if (!choice.label?.trim()) {
      issues.push(issue('empty_choice_label', 'Choice label is required', choicePath));
    }

    if (!Number.isInteger(choice.displayOrder) || choice.displayOrder < 1) {
      issues.push(
        issue('invalid_option_display_order', 'displayOrder must be a positive integer', choicePath)
      );
    } else if (orders.has(choice.displayOrder)) {
      issues.push(
        issue(
          'invalid_option_display_order',
          `Duplicate displayOrder ${choice.displayOrder}`,
          choicePath
        )
      );
    } else {
      orders.add(choice.displayOrder);
    }

    if (choice.mutuallyExclusive) exclusiveCount += 1;
  }

  const expectedOrders = Array.from({ length: question.choices.length }, (_, i) => i + 1);
  const actualOrders = [...orders].sort((a, b) => a - b);
  if (
    actualOrders.length === question.choices.length &&
    expectedOrders.some((n, i) => actualOrders[i] !== n)
  ) {
    issues.push(
      issue(
        'invalid_option_display_order',
        'Option displayOrder values must be sequential starting at 1',
        path
      )
    );
  }

  if (exclusiveCount > 0) {
    if (question.responseBehavior !== 'multi_select') {
      issues.push(
        issue(
          'exclusive_choice_incompatible',
          'mutuallyExclusive is only valid with multi_select behavior',
          path
        )
      );
    }
    if (question.minSelections > 1) {
      issues.push(
        issue(
          'exclusive_choice_incompatible',
          'mutuallyExclusive choices are incompatible with minSelections > 1',
          path
        )
      );
    }
  }

  if (question.eligibilityRuleId) {
    if (!eligibilityById.has(question.eligibilityRuleId)) {
      issues.push(
        issue(
          'unknown_eligibility_rule',
          `Unknown eligibilityRuleId: ${question.eligibilityRuleId}`,
          path
        )
      );
    }
  }

  if (question.conditional?.requiresEligibilityRuleId) {
    if (!eligibilityById.has(question.conditional.requiresEligibilityRuleId)) {
      issues.push(
        issue(
          'unknown_eligibility_rule',
          `Unknown conditional eligibility rule: ${question.conditional.requiresEligibilityRuleId}`,
          path
        )
      );
    }
  }

  if (question.priorityFollowUp) {
    if (question.responseBehavior !== 'multi_select') {
      issues.push(
        issue(
          'priority_follow_up_unsupported',
          `Priority follow-ups require multi_select (found ${question.responseBehavior})`,
          path
        )
      );
    }
    const pf = question.priorityFollowUp;
    if (!Number.isInteger(pf.selectionCount) || pf.selectionCount < 1) {
      issues.push(
        issue(
          'invalid_priority_selection_count',
          'Priority selectionCount must be a positive integer',
          path
        )
      );
    }
    if (pf.unordered !== true) {
      issues.push(
        issue('priority_must_be_unordered', 'Priority follow-ups must be unordered', path)
      );
    }
    if (question.maxSelections !== null && pf.selectionCount > question.maxSelections) {
      issues.push(
        issue(
          'priority_selection_exceeds_limits',
          'Priority selection count cannot exceed the question maxSelections',
          path
        )
      );
    }
    if (!pf.prompt?.trim()) {
      issues.push(issue('empty_priority_prompt', 'Priority follow-up prompt is required', path));
    }

    const eligible = pf.eligibleChoiceIds ?? [...choiceIds];
    for (const id of eligible) {
      if (!choiceIds.has(id)) {
        issues.push(
          issue('priority_eligible_unknown_choice', `Unknown eligibleChoiceId: ${id}`, path)
        );
      }
    }
    for (const id of pf.excludedChoiceIds ?? []) {
      if (!choiceIds.has(id)) {
        issues.push(
          issue('priority_excluded_unknown_choice', `Unknown excludedChoiceId: ${id}`, path)
        );
      }
    }
    const excluded = new Set(pf.excludedChoiceIds ?? []);
    const eligibleNet = eligible.filter((id) => !excluded.has(id));
    if (pf.selectionCount > eligibleNet.length) {
      issues.push(
        issue(
          'priority_selection_exceeds_limits',
          'Priority selection count exceeds eligible non-excluded choices',
          path
        )
      );
    }
    const minDisplay = pf.minEligibleSelectionsBeforeDisplay ?? pf.selectionCount;
    if (!Number.isInteger(minDisplay) || minDisplay < 1) {
      issues.push(
        issue(
          'invalid_priority_min_eligible',
          'minEligibleSelectionsBeforeDisplay must be a positive integer',
          path
        )
      );
    }
  }
}

function validateCategory(
  category: CategoryDefinition,
  eligibilityById: Map<string, EligibilityRuleDefinition>,
  issues: CatalogValidationIssue[]
): void {
  const path = `categories[${category.number}]`;

  if (!category.id?.trim()) {
    issues.push(issue('empty_category_id', 'Category id is required', path));
  }
  if (!category.title?.trim()) {
    issues.push(issue('empty_category_title', 'Category title is required', path));
  }
  if (category.status !== 'locked') {
    issues.push(
      issue(
        'category_not_locked',
        `Category status must be locked (received: ${category.status})`,
        path
      )
    );
  }

  if (!Array.isArray(category.questions) || category.questions.length === 0) {
    issues.push(issue('empty_category_questions', 'Category must include questions', path));
  }

  if (category.number === 1) {
    if (category.questions.length !== 15) {
      issues.push(
        issue(
          'category_1_question_count',
          `Category 1 must contain exactly 15 questions (found ${category.questions.length})`,
          path
        )
      );
    }
    if (category.title !== 'Relationship Vision & Intentions') {
      issues.push(
        issue(
          'category_1_title',
          `Category 1 title must be "Relationship Vision & Intentions" (found "${category.title}")`,
          path
        )
      );
    }
  }

  const questionIds = new Set<string>();
  const questionNumbers = category.questions.map((q) => q.number).sort((a, b) => a - b);

  for (const question of category.questions) {
    if (questionIds.has(question.id)) {
      issues.push(
        issue('duplicate_question_id', `Duplicate question id: ${question.id}`, path)
      );
    } else if (question.id?.trim()) {
      questionIds.add(question.id);
    }
    validateQuestion(category, question, eligibilityById, issues);
  }

  const numberSet = new Set<number>();
  for (const n of questionNumbers) {
    if (numberSet.has(n)) {
      issues.push(issue('duplicate_question_number', `Duplicate question number: ${n}`, path));
    }
    numberSet.add(n);
  }

  for (let i = 0; i < questionNumbers.length; i += 1) {
    if (questionNumbers[i] !== i + 1) {
      issues.push(
        issue(
          'nonsequential_question_numbering',
          `Question numbers must be sequential starting at 1 (found ${questionNumbers.join(', ')})`,
          path
        )
      );
      break;
    }
  }
}

export function validateQuestionnaireCatalog(
  catalog: QuestionnaireCatalog
): CatalogValidationResult {
  const issues: CatalogValidationIssue[] = [];

  if (!catalog.questionnaireVersion?.trim()) {
    issues.push(issue('missing_questionnaire_version', 'questionnaireVersion is required'));
  }
  if (!catalog.specificationVersion?.trim()) {
    issues.push(issue('missing_specification_version', 'specificationVersion is required'));
  }
  if (!Array.isArray(catalog.categories) || catalog.categories.length === 0) {
    issues.push(issue('empty_categories', 'Catalog must include at least one category'));
  }
  if (!Array.isArray(catalog.eligibilityRules)) {
    issues.push(issue('missing_eligibility_rules', 'eligibilityRules array is required'));
  }

  const eligibilityById = new Map<string, EligibilityRuleDefinition>();
  const eligibilityKeys = new Set<string>();
  for (const rule of catalog.eligibilityRules ?? []) {
    if (!rule.id?.trim()) {
      issues.push(issue('empty_eligibility_rule_id', 'Eligibility rule id is required'));
      continue;
    }
    if (eligibilityById.has(rule.id)) {
      issues.push(issue('duplicate_eligibility_rule_id', `Duplicate eligibility rule id: ${rule.id}`));
    }
    eligibilityById.set(rule.id, rule);
    if (!rule.ruleKey?.trim()) {
      issues.push(issue('empty_eligibility_rule_key', `Eligibility rule key required for ${rule.id}`));
    } else if (eligibilityKeys.has(rule.ruleKey)) {
      issues.push(issue('duplicate_eligibility_rule_key', `Duplicate eligibility rule key: ${rule.ruleKey}`));
    } else {
      eligibilityKeys.add(rule.ruleKey);
    }
    if (!rule.description?.trim()) {
      issues.push(issue('empty_eligibility_description', `Eligibility description required for ${rule.id}`));
    }
  }

  const categoryIds = new Set<string>();
  const categoryNumbers = new Set<number>();
  const allQuestionIds = new Set<string>();
  const allOptionIds = new Set<string>();

  for (const category of catalog.categories ?? []) {
    if (category.id && categoryIds.has(category.id)) {
      issues.push(issue('duplicate_category_id', `Duplicate category id: ${category.id}`));
    } else if (category.id) {
      categoryIds.add(category.id);
    }

    if (categoryNumbers.has(category.number)) {
      issues.push(
        issue('duplicate_category_number', `Duplicate category number: ${category.number}`)
      );
    } else {
      categoryNumbers.add(category.number);
    }

    validateCategory(category, eligibilityById, issues);

    for (const question of category.questions ?? []) {
      if (question.id && allQuestionIds.has(question.id)) {
        issues.push(issue('duplicate_question_id', `Duplicate question id across catalog: ${question.id}`));
      } else if (question.id) {
        allQuestionIds.add(question.id);
      }
      for (const choice of question.choices ?? []) {
        if (choice.id && allOptionIds.has(choice.id)) {
          issues.push(issue('duplicate_option_id', `Duplicate option id across catalog: ${choice.id}`));
        } else if (choice.id) {
          allOptionIds.add(choice.id);
        }
      }
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, catalog };
}

export function assertValidQuestionnaireCatalog(
  catalog: QuestionnaireCatalog
): QuestionnaireCatalog {
  const result = validateQuestionnaireCatalog(catalog);
  if (!result.ok) {
    const detail = result.issues.map((i) => `${i.code}: ${i.message}`).join('; ');
    throw new Error(`Invalid questionnaire catalog: ${detail}`);
  }
  return result.catalog;
}
