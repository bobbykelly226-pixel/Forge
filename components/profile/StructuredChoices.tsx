'use client';

type ChoiceOption = {
  value: string;
  label: string;
};

type ChoiceControlProps = {
  name: string;
  legend: string;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  optionalNote?: string;
  disabled?: boolean;
};

/**
 * Mobile-friendly selectable chips for structured profile fields.
 * Empty string means unanswered — never forced.
 */
export function ChoiceChips({
  name,
  legend,
  options,
  value,
  onChange,
  hint,
  optionalNote = 'Optional — you can leave this unanswered.',
  disabled,
}: ChoiceControlProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="block text-sm font-medium text-[#0B2D5C] mb-1">{legend}</legend>
      {hint ? <p className="text-sm text-[#666666]">{hint}</p> : null}
      <p className="text-xs text-[#888888]">{optionalNote}</p>
      <div className="flex flex-wrap gap-2">
        <input type="hidden" name={name} value={value} />
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? '' : option.value)}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white'
                  : 'border-[#0B2D5C]/20 bg-white text-[#0B2D5C] hover:border-[#0B2D5C]/40'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type MultiChoiceProps = {
  name: string;
  legend: string;
  options: readonly ChoiceOption[];
  values: string[];
  onChange: (values: string[]) => void;
  hint?: string;
  exclusiveValues?: string[];
  disabled?: boolean;
};

export function MultiChoiceChips({
  name,
  legend,
  options,
  values,
  onChange,
  hint,
  exclusiveValues = ['none', 'prefer_not_to_say'],
  disabled,
}: MultiChoiceProps) {
  const toggle = (optionValue: string) => {
    if (exclusiveValues.includes(optionValue)) {
      onChange(values.includes(optionValue) ? [] : [optionValue]);
      return;
    }

    const withoutExclusive = values.filter((value) => !exclusiveValues.includes(value));
    if (withoutExclusive.includes(optionValue)) {
      onChange(withoutExclusive.filter((value) => value !== optionValue));
      return;
    }
    onChange([...withoutExclusive, optionValue]);
  };

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="block text-sm font-medium text-[#0B2D5C] mb-1">{legend}</legend>
      {hint ? <p className="text-sm text-[#666666]">{hint}</p> : null}
      <p className="text-xs text-[#888888]">Optional — select all that apply, or leave unanswered.</p>
      {values.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(option.value)}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white'
                  : 'border-[#0B2D5C]/20 bg-white text-[#0B2D5C] hover:border-[#0B2D5C]/40'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
