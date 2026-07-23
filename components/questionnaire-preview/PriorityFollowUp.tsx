'use client';

import QuestionnaireOption from '@/components/questionnaire-preview/QuestionnaireOption';
import type { AnswerChoiceDefinition, QuestionDefinition } from '@/lib/questionnaire/types';
import type { QuestionAnswerState } from '@/lib/questionnaire/preview/category-01-preview-flow';

type PriorityFollowUpProps = {
  question: QuestionDefinition;
  answer: QuestionAnswerState;
  eligibleChoices: AnswerChoiceDefinition[];
  onToggleChoice: (choiceId: string) => void;
};

export default function PriorityFollowUp({
  question,
  answer,
  eligibleChoices,
  onToggleChoice,
}: PriorityFollowUpProps) {
  const prompt = question.priorityFollowUp?.prompt ?? '';
  const required = question.priorityFollowUp?.selectionCount ?? 2;
  const selectedCount = answer.priorityChoiceIds.length;
  const atRequired = selectedCount >= required;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--forge-graphite)]">
          Priority follow up
        </p>
        <h2
          id="preview-question-heading"
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-[1.7rem]"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          {prompt}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--forge-graphite)]">
          Choose exactly {required}. This is not a ranking between first and second.
          Both priorities carry the same weight.
        </p>
        <p className="mt-2 text-sm font-medium text-[var(--forge-navy)]" aria-live="polite">
          {selectedCount} of {required} selected
        </p>
      </div>

      <fieldset className="space-y-2.5 border-0 p-0">
        <legend className="sr-only">Select {required} priorities from your answers</legend>
        <div role="group" aria-labelledby="preview-question-heading" className="space-y-2.5">
          {eligibleChoices.map((choice) => {
            const selected = answer.priorityChoiceIds.includes(choice.id);
            return (
              <QuestionnaireOption
                key={choice.id}
                id={`priority-${choice.id}`}
                label={choice.label}
                selected={selected}
                selectionMode="multi"
                disabled={Boolean(atRequired && !selected)}
                onToggle={() => onToggleChoice(choice.id)}
              />
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
