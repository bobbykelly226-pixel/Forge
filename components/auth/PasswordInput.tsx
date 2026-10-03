'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ChangeEventHandler } from 'react';

const INPUT_CLASS =
  'w-full rounded-2xl border border-[#0B2D5C]/30 px-6 py-5 text-lg focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20';

type PasswordInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  /** Use current-password for login; new-password for signup/reset. */
  autoComplete: 'current-password' | 'new-password';
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
};

/**
 * Accessible password field with show/hide toggle.
 * Hidden by default. Does not log or expose values beyond controlled React state.
 */
export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Password',
  autoComplete,
  required,
  minLength,
  disabled,
  label = 'Password',
  className,
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-[#0B2D5C]">
          {label}
        </label>
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="inline-flex min-h-11 min-w-20 touch-manipulation items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] disabled:opacity-50"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-controls={inputId}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>{visible ? 'Hide' : 'Show'}</span>
        </button>
      </div>
      <input
        id={inputId}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className={INPUT_CLASS}
      />
    </div>
  );
}
