import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

type ChoiceSpecialConfig = {
  specialResponseState?: NonNullable<
    QuestionDefinition['choices'][number]['specialResponseState']
  >;
  mutuallyExclusive?: boolean;
  qualifier?: NonNullable<QuestionDefinition['choices'][number]['qualifier']>;
  qualifierCoexistsWithSelections?: boolean;
  opensOptionalContext?: boolean;
  optionalContext?: NonNullable<QuestionDefinition['choices'][number]['optionalContext']>;
};

type SpecialMap = Readonly<
  Record<
    number,
    | ChoiceSpecialConfig
    | NonNullable<QuestionDefinition['choices'][number]['specialResponseState']>
  >
>;

export function createCategoryBuilders(categoryKey: string) {
  function buildChoices(
    questionNumber: number,
    labels: readonly string[],
    specials: SpecialMap = {}
  ) {
    const qid = `${categoryKey}_q${String(questionNumber).padStart(2, '0')}`;
    return labels.map((label, index) => {
      const displayOrder = index + 1;
      const special = specials[displayOrder];
      const specialResponseState =
        typeof special === 'string' ? special : special?.specialResponseState;
      const mutuallyExclusive =
        typeof special === 'object' ? special?.mutuallyExclusive : undefined;
      const qualifier = typeof special === 'object' ? special?.qualifier : undefined;
      const qualifierCoexistsWithSelections =
        typeof special === 'object' ? special?.qualifierCoexistsWithSelections : undefined;
      const opensOptionalContext =
        typeof special === 'object' ? special?.opensOptionalContext : undefined;
      const optionalContext =
        typeof special === 'object' ? special?.optionalContext : undefined;
      return {
        id: `${qid}_c${String(displayOrder).padStart(2, '0')}`,
        label,
        displayOrder,
        ...(specialResponseState ? { specialResponseState } : {}),
        ...(mutuallyExclusive ? { mutuallyExclusive: true } : {}),
        ...(qualifier ? { qualifier } : {}),
        ...(qualifierCoexistsWithSelections !== undefined
          ? { qualifierCoexistsWithSelections }
          : {}),
        ...(opensOptionalContext
          ? {
              opensOptionalContext: true,
              optionalContext: optionalContext ?? {
                kind: 'free_text' as const,
                required: false as const,
                scored: false as const,
              },
            }
          : {}),
      };
    });
  }

  function q(
    def: Omit<QuestionDefinition, 'id' | 'choices'> & {
      choices: QuestionDefinition['choices'];
    }
  ): QuestionDefinition {
    return {
      ...def,
      id: `${categoryKey}_q${String(def.number).padStart(2, '0')}`,
    };
  }

  return { buildChoices, q, categoryKey };
}

export type BuiltCategory = CategoryDefinition;
