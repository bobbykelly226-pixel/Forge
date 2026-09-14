"use client";

import { useState } from 'react';
import { ChoiceChips } from '@/components/profile/StructuredChoices';
import { EDUCATION_OPTIONS } from '@/lib/profile/structured-options';

export default function EducationFields({ education, other, disabled }: {
  education: string | null; other?: string | null; disabled?: boolean;
}) {
  const [value, setValue] = useState(education ?? '');
  return <div className="space-y-4">
    <ChoiceChips name="education" legend="Education" options={EDUCATION_OPTIONS}
      value={value} onChange={setValue} disabled={disabled} />
    {value === 'other' ? <div className="space-y-2">
      <label htmlFor="education-other" className="block text-sm font-medium">Please describe your education or training.</label>
      <p id="education-other-help" className="text-sm text-black">Apprenticeship, certification, military training, or another path.</p>
      <input id="education-other" name="education_other" defaultValue={other ?? ''}
        required maxLength={200} disabled={disabled} aria-describedby="education-other-help"
        className="w-full rounded-md border px-4 py-3 text-base" />
    </div> : null}
  </div>;
}
