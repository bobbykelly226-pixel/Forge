'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ChangeEventHandler } from 'react';

const INPUT_CLASS =
  'w-full rounded-2xl border border-[#0B2D5C]/30 py-5 pl-6 pr-14 text-lg focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20';

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
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative">
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
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-2xl text-[#0B2D5C] transition hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B2D5C] disabled:opacity-50"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
