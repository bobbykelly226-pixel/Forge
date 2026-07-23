import {
  QUESTION_FORMATS,
  type CatalogValidationIssue,
  type CatalogValidationResult,
  type CategoryDefinition,
  type QuestionDefinition,
  type QuestionFormat,
  type QuestionnaireCatalog,
} from '@/lib/questionnaire/types';

const MULTI_SELECT_FORMATS: ReadonlySet<QuestionFormat> = new Set([
  'limited_multi_select',
]);

const PRIORITY_SUPPORTED_FORMATS: ReadonlySet<QuestionFormat> = new Set([
  'limited_multi_select',
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
  issues: CatalogValidationIssue[]
): void {
  const path = `categories[${category.number}].questions[${question.number}]`;

  if (!QUESTION_FORMATS.includes(question.format)) {
    issues.push(issue('invalid_format', `Unsupported format: ${question.format}`, path));
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

  if (!Number.isInteger(question.maxSelections) || question.maxSelections < 1) {
    issues.push(issue('invalid_selection_limits', 'maxSelections must be a positive integer', path));
  }

  if (question.minSelections > question.maxSelections) {
    issues.push(
      issue('invalid_selection_limits', 'minSelections cannot exceed maxSelections', path)
    );
  }

  if (question.format === 'single_choice' || question.format === 'scenario_choice') {
    if (question.minSelections !== 1 || question.maxSelections !== 1) {
      issues.push(
        issue(
          'invalid_selection_limits',
          `${question.format} must require exactly one selection`,
          path
        )
      );
    }
  }

  if (
    question.format === 'agreement_scale' ||
    question.format === 'importance_scale' ||
    question.format === 'frequency_scale' ||
    question.format === 'comfort_range'
  ) {
    if (question.minSelections !== 1 || question.maxSelections !== 1) {
      issues.push(
        issue('invalid_selection_limits', `${question.format} must require exactly one selection`, path)
      );
    }
  }

  if (!Array.isArray(question.choices) || question.choices.length === 0) {
    issues.push(issue('insufficient_options', 'Question must define answer choices', path));
  } else if (question.choices.length < question.maxSelections) {
    issues.push(
      issue(
        'insufficient_options',
        `Question has ${question.choices.length} options but maxSelections is ${question.maxSelections}`,
        path
      )
    );
  }

  if (
    (question.format === 'single_choice' ||
      question.format === 'scenario_choice' ||
      MULTI_SELECT_FORMATS.has(question.format)) &&
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
    if (question.format === 'single_choice' || question.format === 'scenario_choice') {
      issues.push(
        issue(
          'exclusive_choice_incompatible',
          'mutuallyExclusive is incompatible with single-selection formats',
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

  if (question.priorityFollowUp) {
    if (!PRIORITY_SUPPORTED_FORMATS.has(question.format)) {
      issues.push(
        issue(
          'priority_follow_up_unsupported',
          `Priority follow-ups are not supported on format ${question.format}`,
          path
        )
      );
    }
    if (question.priorityFollowUp.selectionCount !== 2) {
      issues.push(
        issue(
          'invalid_priority_selection_count',
          'Priority follow-ups must request exactly two selections',
          path
        )
      );
    }
    if (question.priorityFollowUp.selectionCount > question.maxSelections) {
      issues.push(
        issue(
          'priority_selection_exceeds_limits',
          'Priority selection count cannot exceed the question maxSelections',
          path
        )
      );
    }
    if (question.priorityFollowUp.selectionCount > question.choices.length) {
      issues.push(
        issue(
          'priority_selection_exceeds_limits',
          'Priority selection count cannot exceed available choices',
          path
        )
      );
    }
    if (!question.priorityFollowUp.prompt?.trim()) {
      issues.push(issue('empty_priority_prompt', 'Priority follow-up prompt is required', path));
    }
  }
}

function validateCategory(category: CategoryDefinition, issues: CatalogValidationIssue[]): void {
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
    validateQuestion(category, question, issues);
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

    validateCategory(category, issues);

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
