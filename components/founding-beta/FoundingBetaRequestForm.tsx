'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

import {
  submitFoundingBetaRequest,
  type FoundingBetaRequestState,
} from '@/app/actions/founding-beta';

const INITIAL_STATE: FoundingBetaRequestState = { success: false, message: '' };

const fieldClass =
  'mt-2 w-full border border-[#0B2D5C] bg-[#F7F7F7] px-4 py-3.5 text-base text-[#0B2D5C] outline-none transition focus:ring-2 focus:ring-[#C92027]/25';

export default function FoundingBetaRequestForm() {
  const [state, formAction, pending] = useActionState(submitFoundingBetaRequest, INITIAL_STATE);

  if (state.success) {
    return (
      <section className="border border-[#0B2D5C] bg-[#E6E6E7] p-7 shadow-[0_16px_40px_rgba(11,45,92,0.12)] sm:p-10" aria-live="polite">
        <CheckCircle2 className="h-12 w-12 text-[#2E7D5B]" aria-hidden="true" />
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#0B2D5C]">Request received</h2>
        <p className="mt-4 text-lg leading-relaxed text-black">{state.message}</p>
        <p className="mt-4 leading-relaxed text-black">
          Watch your inbox and spam folder. The official invitation will come from{' '}
          <strong>hello@forgedinlife.com</strong>.
        </p>
        <Link href="/" className="mt-7 inline-flex bg-[#0B2D5C] px-6 py-3.5 font-semibold text-white">
          Return to Forge
        </Link>
      </section>
    );
  }

  return (
    <form action={formAction} className="border border-[#0B2D5C] bg-[#E6E6E7] p-5 shadow-[0_16px_40px_rgba(11,45,92,0.12)] sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#C9CBCE] pb-5">
        <span className="inline-flex bg-white p-2.5 text-[#0B2D5C]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-[#0B2D5C]">Request your invitation</h2>
          <p className="mt-1 text-sm text-black">About two minutes. Your answers stay private.</p>
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[#0B2D5C]">
          First name
          <input className={fieldClass} name="first_name" autoComplete="given-name" maxLength={80} required disabled={pending} />
        </label>
        <label className="block text-sm font-semibold text-[#0B2D5C]">
          Email address
          <input className={fieldClass} name="email" type="email" autoComplete="email" maxLength={254} required disabled={pending} />
        </label>
      </div>

      <label className="mt-5 block text-sm font-semibold text-[#0B2D5C]">
        City and state or general location
        <input className={fieldClass} name="location" autoComplete="address-level2" maxLength={120} placeholder="Denver, Colorado" required disabled={pending} />
      </label>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-[#0B2D5C]">I am a</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {['man', 'woman'].map((value) => (
            <label key={value} className="flex min-h-12 items-center gap-3 border border-[#0B2D5C] bg-white px-4 py-3 text-black">
              <input type="radio" name="gender" value={value} required disabled={pending} className="h-5 w-5 accent-[#0B2D5C]" />
              <span>{value === 'man' ? 'Man' : 'Woman'}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-[#0B2D5C]">I am interested in meeting</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {['men', 'women'].map((value) => (
            <label key={value} className="flex min-h-12 items-center gap-3 border border-[#0B2D5C] bg-white px-4 py-3 text-black">
              <input type="checkbox" name="interested_in" value={value} disabled={pending} className="h-5 w-5 accent-[#0B2D5C]" />
              <span>{value === 'men' ? 'Men' : 'Women'}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block text-sm font-semibold text-[#0B2D5C]">
        What are you hoping to find?
        <select className={fieldClass} name="relationship_goal" required defaultValue="" disabled={pending}>
          <option value="" disabled>Select one</option>
          <option value="marriage">Marriage</option>
          <option value="serious_relationship">A serious, committed relationship</option>
          <option value="intentional_dating">Intentional dating that may grow into something lasting</option>
        </select>
      </label>

      <label className="mt-5 block text-sm font-semibold text-[#0B2D5C]">
        How did you hear about Forge? <span className="font-normal text-[#5C636B]">(optional)</span>
        <input className={fieldClass} name="heard_about_forge" maxLength={160} placeholder="Friend, Instagram, Facebook…" disabled={pending} />
      </label>

      <div className="mt-7 space-y-3 border-t border-[#C9CBCE] pt-6">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-black">
          <input type="checkbox" name="adult_confirmed" required disabled={pending} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0B2D5C]" />
          <span>I confirm that I am at least 18 years old.</span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-black">
          <input type="checkbox" name="feedback_agreed" required disabled={pending} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0B2D5C]" />
          <span>I understand this is a beta and agree to share honest feedback about my experience.</span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-black">
          <input type="checkbox" name="standards_agreed" required disabled={pending} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0B2D5C]" />
          <span>
            I agree to follow the{' '}
            <Link href="/community-standards" target="_blank" className="font-semibold text-[#0B2D5C] underline underline-offset-2">
              Forge Community Standards ↗
            </Link>
            .
          </span>
        </label>
      </div>

      {state.message ? (
        <p role="alert" className="mt-5 border border-[#C92027] bg-[#FFF5F4] px-4 py-3 text-sm text-[#8F1D1D]">
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="mt-6 w-full bg-[#0B2D5C] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540] disabled:cursor-not-allowed disabled:opacity-55">
        {pending ? 'Submitting request…' : 'Request Founding Beta invitation'}
      </button>
      <p className="mt-4 text-center text-xs leading-relaxed text-[#5C636B]">
        Submitting this form does not create an account. Invitations are personal, email-bound, and single-use.
      </p>
    </form>
  );
}
