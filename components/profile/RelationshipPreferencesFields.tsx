'use client';

import { useId, useState } from 'react';
import { RELATIONSHIP_GOAL_OPTIONS } from '@/lib/profile/structured-options';
import { relationshipGoals } from '@/lib/profile/relationship-preferences';

export default function RelationshipPreferencesFields({ goals = [], disabled = false }: {
  goals?: string[]; disabled?: boolean;
}) {
  const [selected, setSelected] = useState(() => relationshipGoals(goals));
  const helpId = useId();
  const choice = 'flex gap-3 items-start rounded-[6px] border border-[#0B2D5C] bg-[#F7F7F7] p-4 text-[#0B2D5C] cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:checked]:border-[#C92027]';
  return <fieldset disabled={disabled} aria-describedby={helpId}>
    <legend className="mb-2 font-semibold">What are you looking for?</legend>
    <p id={helpId} className="mb-3 text-sm text-black">Select all that genuinely reflect what you’re open to.</p>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{RELATIONSHIP_GOAL_OPTIONS.map((option, index) => <label key={option.value} className={choice}>
      <input type="checkbox" name="relationship_goals" value={option.value}
        required={index === 0 && selected.length === 0} checked={selected.includes(option.value)}
        onChange={event => setSelected(previous => event.target.checked
          ? relationshipGoals([...previous, option.value]) : previous.filter(value => value !== option.value))}
        className="mt-1 accent-[#0B2D5C]" />
      <span><span className="block font-semibold">{option.label}</span><span className="block text-sm text-black">{option.description}</span></span>
    </label>)}</div>
  </fieldset>;
}
