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

const optionClassName = (selected: boolean) =>
  `flex min-h-11 w-full cursor-pointer items-center rounded-2xl border px-4 py-3 text-left text-sm font-medium transition sm:w-auto sm:min-w-[7.5rem] ${
    selected
      ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white'
      : 'border-[#0B2D5C]/20 bg-white text-[#0B2D5C] hover:border-[#0B2D5C]/40'
  }`;

/**
 * Mobile-first selectable controls for structured profile fields.
 * Uses native radio inputs so FormData works without relying on hidden+button sync.
 * Empty string means unanswered — never forced.
 * Same catalogs and component on mobile and desktop — no separate field defs.
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
    <fieldset
      className="min-w-0 w-full space-y-3"
      disabled={disabled}
      data-structured-control={name}
      data-structured-control-type="single"
    >
      <legend className="mb-1 block text-sm font-medium text-[#0B2D5C]">{legend}</legend>
      {hint ? <p className="text-sm text-[#666666]">{hint}</p> : null}
      <p className="text-xs text-[#888888]">{optionalNote}</p>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {options.map((option) => {
          const selected = value === option.value;
          const inputId = `${name}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={optionClassName(selected)}
              data-structured-option={option.value}
              data-selected={selected ? 'true' : 'false'}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                onClick={() => {
                  // Allow clearing back to unanswered (optional fields).
                  if (selected) onChange('');
                }}
                className="sr-only"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {/* Preserve unanswered state in FormData when nothing is selected. */}
      {value === '' ? <input type="hidden" name={name} value="" /> : null}
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
    <fieldset
      className="min-w-0 w-full space-y-3"
      disabled={disabled}
      data-structured-control={name}
      data-structured-control-type="multi"
    >
      <legend className="mb-1 block text-sm font-medium text-[#0B2D5C]">{legend}</legend>
      {hint ? <p className="text-sm text-[#666666]">{hint}</p> : null}
      <p className="text-xs text-[#888888]">Optional — select all that apply, or leave unanswered.</p>
      {values.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {options.map((option) => {
          const selected = values.includes(option.value);
          const inputId = `${name}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={optionClassName(selected)}
              data-structured-option={option.value}
              data-selected={selected ? 'true' : 'false'}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={selected}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
