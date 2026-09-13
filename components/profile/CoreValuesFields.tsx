'use client';

import { useId, useRef, useEffect, useState } from 'react';
import { CORE_VALUES_OPTIONS, CORE_VALUES_GUIDANCE, normalizeCoreValues, validCoreValues, toggleCoreValue } from '@/lib/profile/core-values';

export default function CoreValuesFields({ initialValues, disabled = false, onChange }: {
  initialValues: string[]; disabled?: boolean; onChange?: (values: string[]) => void;
}) {
  const [values, setValues] = useState<string[]>(() => normalizeCoreValues(initialValues));
  const [notice, setNotice] = useState('');
  const id = useId();
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.setCustomValidity(validCoreValues(values) ? '' : 'Choose between 3 and 5 values before saving.');
  }, [values]);
  const count = values.length;
  return <fieldset disabled={disabled} aria-describedby={`${id}-help ${id}-count`} className="min-w-0 space-y-3">
    <legend className="text-base font-semibold text-[#0B2D5C]">Relationship values</legend>
    <p id={`${id}-help`} className="text-sm text-black">{CORE_VALUES_GUIDANCE}</p>
    {normalizeCoreValues(initialValues).length > 5 && <p className="text-sm text-black">Your saved choices are preserved. Deselect values until you have 3–5, then save.</p>}
    <p id={`${id}-count`} role="status" className="text-sm font-medium text-black">
      {count} selected · {count > 5 ? `Remove at least ${count - 5}` : `${5 - count} remaining`}
      {count < 3 ? ` · Choose at least ${3 - count} more` : ''}
    </p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CORE_VALUES_OPTIONS.map((label, index) => <label key={label} className={`flex min-h-12 items-center gap-3 rounded-[6px] border bg-[#F7F7F7] p-3 text-[#0B2D5C] ${values.includes(label) ? 'border-[#C92027]' : 'border-[#0B2D5C]/30'}`}>
        <input ref={index === 0 ? first : undefined} type="checkbox" name="core_values" value={label}
          checked={values.includes(label)} aria-describedby={`${id}-count ${id}-notice`}
          aria-disabled={!values.includes(label) && count >= 5}
          className="h-5 w-5 shrink-0 accent-[#C92027]"
          onChange={() => {
            const next = toggleCoreValue(values, label);
            if (next === values) { setNotice('You can select up to 5 values. Deselect one before choosing another.'); return; }
            setNotice(''); setValues(next); onChange?.(next);
          }} />
        <span>{label}</span>
      </label>)}
    </div>
    <p id={`${id}-notice`} role="status" className="text-sm text-black">{notice}</p>
  </fieldset>;
}
