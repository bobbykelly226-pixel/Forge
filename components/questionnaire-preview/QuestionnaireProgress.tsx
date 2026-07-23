'use client';

type QuestionnaireProgressProps = {
  categoryNumber: number;
  totalCategories: number;
  categoryTitle: string;
  questionNumber: number;
  totalQuestions: number;
  progress: number;
  phaseLabel?: string;
};

export default function QuestionnaireProgress({
  categoryNumber,
  totalCategories,
  categoryTitle,
  questionNumber,
  totalQuestions,
  progress,
  phaseLabel,
}: QuestionnaireProgressProps) {
  const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--forge-graphite)]">
        <span className="font-semibold text-[var(--forge-navy)]">
          Category {categoryNumber} of {totalCategories}
        </span>
        <span aria-hidden="true" className="text-[var(--forge-silver)]">
          ·
        </span>
        <span>{categoryTitle}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm font-medium text-[var(--forge-navy)]">
          Question {questionNumber} of {totalQuestions}
          {phaseLabel ? (
            <span className="ml-2 font-normal text-[var(--forge-graphite)]">
              · {phaseLabel}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-[var(--forge-graphite)]" aria-hidden="true">
          {percent}%
        </p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--forge-surface-muted)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Progress through ${categoryTitle}`}
      >
        <div
          className="h-full rounded-full bg-[var(--forge-navy)] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
