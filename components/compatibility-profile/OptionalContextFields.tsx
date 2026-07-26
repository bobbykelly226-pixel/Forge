'use client';

import type { QuestionDefinition } from '@/lib/questionnaire/types';

type OptionalContextFieldsProps = {
  question: QuestionDefinition;
  selectedChoiceIds: readonly string[];
  choiceContexts: Record<string, string>;
  onChange: (choiceId: string, text: string) => void;
};

export default function OptionalContextFields({
  question,
  selectedChoiceIds,
  choiceContexts,
  onChange,
}: OptionalContextFieldsProps) {
  const openChoices = question.choices.filter(
    (choice) =>
      choice.opensOptionalContext && selectedChoiceIds.includes(choice.id)
  );
  if (openChoices.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {openChoices.map((choice) => (
        <label key={choice.id} className="block">
          <span className="text-sm font-medium text-[var(--forge-navy)]">
            Optional private context for {choice.label}
          </span>
          <p className="mt-1 text-sm text-[var(--forge-graphite)]">
            Optional. Private. Not used for scoring.
          </p>
          <textarea
            value={choiceContexts[choice.id] ?? ''}
            onChange={(event) => onChange(choice.id, event.target.value)}
            rows={3}
            maxLength={2000}
            className="mt-2 w-full rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-4 py-3 text-sm text-[var(--forge-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          />
        </label>
      ))}
    </div>
  );
}
