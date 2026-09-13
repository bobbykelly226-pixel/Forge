'use client';

import { useState } from 'react';
import { RELATIONSHIP_GOAL_OPTIONS } from '@/lib/profile/structured-options';
import { RELATIONSHIP_DESTINATIONS, RELATIONSHIP_PACE_OPTIONS } from '@/lib/profile/relationship-preferences';

export default function RelationshipPreferencesFields({ primary = '', also = [], pace = '', disabled = false }: {
  primary?: string; also?: string[]; pace?: string; disabled?: boolean;
}) {
  const [selected, setSelected] = useState(primary);
  const [alternatives, setAlternatives] = useState(also);
  const choice = 'flex gap-3 items-start rounded-[6px] border border-[#0B2D5C] bg-[#F7F7F7] p-4 text-[#0B2D5C] cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:checked]:border-[#C92027]';
  return <fieldset disabled={disabled} className="space-y-6">
    <fieldset>
      <legend className="mb-2 font-semibold">Looking for</legend>
      <p className="mb-3 text-sm text-black">Choose your main relationship goal.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{RELATIONSHIP_GOAL_OPTIONS.map(option => <label key={option.value} className={choice}>
        <input type="radio" name="relationship_goal" value={option.value} required checked={selected === option.value}
          onChange={() => { setSelected(option.value); setAlternatives(a => a.filter(x => x !== option.value)); }} className="mt-1 accent-[#0B2D5C]" />
        <span><span className="block font-semibold">{option.label}</span><span className="block text-sm text-black">{option.description}</span>
        </span>
      </label>)}</div>
    </fieldset>
    <fieldset>
      <legend className="mb-2 font-semibold">I’m also open to…</legend>
      <p className="mb-3 text-sm text-black">Optional — select other outcomes you would genuinely welcome.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{RELATIONSHIP_DESTINATIONS.filter(x => x.value !== selected).map(option => <label key={option.value} className={choice}>
        <input type="checkbox" name="relationship_also_open_to" value={option.value} checked={alternatives.includes(option.value)}
          onChange={e => setAlternatives(a => e.target.checked ? [...a, option.value] : a.filter(x => x !== option.value))} className="mt-1 accent-[#0B2D5C]" />
        <span>{option.label}</span>
      </label>)}</div>
    </fieldset>
    <label className="block font-semibold">How I like a relationship to develop
      <span className="my-2 block text-sm font-normal text-black">Optional — your pace can be different from your long-term goal.</span>
      <select name="relationship_pace" defaultValue={pace} className="w-full rounded-[6px] border border-[#0B2D5C] bg-[#F7F7F7] p-3 text-[#0B2D5C]">
        <option value="">No preference selected</option>{RELATIONSHIP_PACE_OPTIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
      </select>
    </label>
  </fieldset>;
}
