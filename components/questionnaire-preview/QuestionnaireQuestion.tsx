'use client';

import QuestionnaireOption from '@/components/questionnaire-preview/QuestionnaireOption';
import type { QuestionDefinition } from '@/lib/questionnaire/types';
import {
  formatGuidanceForQuestion,
  multiSelectStatusText,
  SELECTION_LIMIT_MESSAGE,
  type QuestionAnswerState,
} from '@/lib/questionnaire/preview/category-01-preview-flow';

type QuestionnaireQuestionProps = {
  question: QuestionDefinition;
  answer: QuestionAnswerState;
  atMaxMessage?: string | null;
  onToggleChoice: (choiceId: string) => void;
};

export default function QuestionnaireQuestion({
  question,
  answer,
  atMaxMessage,
  onToggleChoice,
}: QuestionnaireQuestionProps) {
  const isMulti = question.responseBehavior === 'multi_select';
  const guidance = formatGuidanceForQuestion(question);
  const selectedCount = answer.selectedChoiceIds.length;
  const atMax =
    isMulti &&
    question.maxSelections !== null &&
    selectedCount >= question.maxSelections;

  return (
    <div className="space-y-5">
      <div>
        <h2
          id="preview-question-heading"
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-[1.7rem]"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          {question.prompt}
        </h2>
        {question.statement ? (
          <blockquote className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_45%,transparent)] bg-[var(--forge-surface-soft)] px-4 py-3 text-base leading-relaxed text-[#3A4556]">
            {question.statement}
          </blockquote>
        ) : null}
        <p className="mt-3 text-sm font-medium text-[var(--forge-graphite)]">{guidance}</p>
        {isMulti ? (
          <p className="mt-1 text-sm text-[var(--forge-navy)]" aria-live="polite">
            {multiSelectStatusText(question, selectedCount)}
          </p>
        ) : null}
        {atMax ? (
          <p
            role="status"
            aria-live="polite"
            data-selection-limit-guidance="true"
            className="mt-3 text-sm font-medium text-[var(--forge-navy)]"
          >
            {atMaxMessage ?? SELECTION_LIMIT_MESSAGE}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2.5 border-0 p-0">
        <legend className="sr-only">
          {isMulti ? 'Select one or more answers' : 'Select one answer'}
        </legend>
        <div
          role={isMulti ? 'group' : 'radiogroup'}
          aria-labelledby="preview-question-heading"
          className="space-y-2.5"
        >
          {question.choices.map((choice) => {
            const selected = answer.selectedChoiceIds.includes(choice.id);
            return (
              <QuestionnaireOption
                key={choice.id}
                id={`option-${choice.id}`}
                label={choice.label}
                selected={selected}
                selectionMode={isMulti ? 'multi' : 'single'}
                disabled={Boolean(atMax && !selected)}
                onToggle={() => onToggleChoice(choice.id)}
              />
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
