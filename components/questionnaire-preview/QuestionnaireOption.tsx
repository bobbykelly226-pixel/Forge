'use client';

type QuestionnaireOptionProps = {
  id: string;
  label: string;
  selected: boolean;
  selectionMode: 'single' | 'multi';
  disabled?: boolean;
  onToggle: () => void;
};

export default function QuestionnaireOption({
  id,
  label,
  selected,
  selectionMode,
  disabled = false,
  onToggle,
}: QuestionnaireOptionProps) {
  const indicator =
    selectionMode === 'single' ? (
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? 'border-[var(--forge-navy)] bg-[var(--forge-navy)]'
            : 'border-[color-mix(in_srgb,var(--forge-silver)_80%,#6b7585)] bg-white'
        }`}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
    ) : (
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
          selected
            ? 'border-[var(--forge-navy)] bg-[var(--forge-navy)] text-white'
            : 'border-[color-mix(in_srgb,var(--forge-silver)_80%,#6b7585)] bg-white'
        }`}
      >
        {selected ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    );

  return (
    <button
      type="button"
      id={id}
      role={selectionMode === 'single' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      disabled={disabled && !selected}
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] ${
        selected
          ? 'border-[var(--forge-navy)] bg-[var(--forge-surface-muted)] shadow-sm'
          : 'border-[color-mix(in_srgb,var(--forge-silver)_55%,transparent)] bg-white hover:border-[color-mix(in_srgb,var(--forge-navy)_35%,var(--forge-silver))]'
      } ${disabled && !selected ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {indicator}
      <span className="text-[15px] leading-snug text-[#1A2332] sm:text-base">{label}</span>
    </button>
  );
}
