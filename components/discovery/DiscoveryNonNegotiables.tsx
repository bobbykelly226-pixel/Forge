'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveNonNegotiables } from '@/app/actions/non-negotiables';
import { EMPTY_NON_NEGOTIABLES, validateNonNegotiables, type NonNegotiables } from '@/lib/discovery/non-negotiables';
import { FAITH_IDENTITY_OPTIONS } from '@/lib/profile/structured-options';

const childrenOptions = [
  { value: 'yes', label: 'Wants children' }, { value: 'no', label: 'Does not want children' },
  { value: 'open', label: 'Open to children' }, { value: 'unsure', label: 'Unsure' },
];
export default function DiscoveryNonNegotiables({ initialValue }: { initialValue: unknown }) {
  const [value, setValue] = useState<NonNegotiables>(() => validateNonNegotiables(initialValue) ?? EMPTY_NON_NEGOTIABLES);
  const [faithOn, setFaithOn] = useState(value.faith.length > 0);
  const [childrenOn, setChildrenOn] = useState(value.children.length > 0);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const update = (next: NonNegotiables) => { setValue(next); setMessage(''); };
  const save = () => {
    if ((faithOn && !value.faith.length) || (childrenOn && !value.children.length)) {
      setMessage('Select at least one answer for each enabled requirement.'); return;
    }
    startTransition(async () => {
      try {
        const result = await saveNonNegotiables(value);
        setMessage(result.message);
        if (result.success && result.value) { setValue(result.value); router.refresh(); }
      } catch { setMessage('Could not save. Please try again.'); }
    });
  };
  const choices = (key: 'faith' | 'children', options: {value:string;label:string}[]) => (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {options.map(o => <label key={o.value} className="flex items-center gap-2 text-sm text-black">
        <input type="checkbox" checked={value[key].includes(o.value)} onChange={e => update({...value, [key]: e.target.checked ? [...value[key], o.value] : value[key].filter(x => x !== o.value)})} />{o.label}
      </label>)}
    </div>
  );
  return <section className="space-y-4 rounded-md border border-[#0B2D5C] bg-[#E6E6E7] p-5" aria-label="Non-negotiables">
    <div><h3 className="text-lg font-semibold text-[#0B2D5C]">Non-negotiables</h3>
      <p className="mt-1 text-sm text-black">Only show introductions that meet these requirements. Optional, private, and changeable anytime.</p>
    </div>
    <fieldset disabled={pending} className="space-y-5">
      <legend className="sr-only">Your requirements</legend>
      <label className="flex items-center gap-3 text-sm font-semibold text-[#0B2D5C]">
        <input type="checkbox" checked={value.smokeFree} onChange={e => update({...value, smokeFree:e.target.checked})} />Only show people who don’t smoke
      </label>
      <fieldset><legend className="sr-only">Faith identities</legend>
        <label className="flex items-center gap-3 text-sm font-semibold text-[#0B2D5C]"><input type="checkbox" checked={faithOn} onChange={e => {setFaithOn(e.target.checked); update({...value,faith:[]});}} />Only show people with these faith identities</label>
        {faithOn && <><p className="mt-2 text-sm text-black">Select every identity you welcome. Each listed identity is matched separately.</p>{choices('faith',FAITH_IDENTITY_OPTIONS.filter(o=>o.value !== 'prefer_not_to_say'))}</>}
      </fieldset>
      <fieldset><legend className="sr-only">Future children</legend>
        <label className="flex items-center gap-3 text-sm font-semibold text-[#0B2D5C]"><input type="checkbox" checked={childrenOn} onChange={e => {setChildrenOn(e.target.checked); update({...value,children:[]});}} />Only show people with these plans for future children</label>
        {childrenOn && <><p className="mt-2 text-sm text-black">This concerns having children in the future—not whether someone already has children. Select all answers you’re open to.</p>{choices('children',childrenOptions)}</>}
      </fieldset>
    </fieldset>
    <p className="text-sm text-black">For enabled requirements, unanswered and “Prefer not to say” answers won’t qualify. Both members’ requirements apply. Existing connections stay intact.</p>
    {message && <p role="status" className="text-sm text-black">{message}</p>}
    <button type="button" disabled={pending} onClick={save} className="w-full rounded-md bg-[#0B2D5C] px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Saving…' : 'Save non-negotiables'}</button>
  </section>;
}
