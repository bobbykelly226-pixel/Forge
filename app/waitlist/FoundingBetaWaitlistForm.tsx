'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { joinWaitlist, type WaitlistActionState } from '@/app/actions/waitlist';

const INITIAL_STATE: WaitlistActionState = { success: false, message: '' };

export default function FoundingBetaWaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, INITIAL_STATE);

  return (
    <div className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-[0_16px_45px_rgba(11,45,92,0.07)] sm:p-8">
      {state.success ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-800">
          {state.message}
        </div>
      ) : (
        <form action={action} className="space-y-5">
          <div hidden aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <div>
            <label htmlFor="waitlist-name" className="text-sm font-semibold text-[#0B2D5C]">Name</label>
            <input id="waitlist-name" name="name" autoComplete="name" maxLength={100} required className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/25 px-5 py-4 outline-none focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/15" />
          </div>
          <div>
            <label htmlFor="waitlist-email" className="text-sm font-semibold text-[#0B2D5C]">Email address</label>
            <input id="waitlist-email" name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/25 px-5 py-4 outline-none focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/15" />
          </div>
          {state.message ? <p role="alert" className="text-sm text-red-700">{state.message}</p> : null}
          <label className="flex items-start gap-3 text-sm leading-relaxed text-[#444444]">
            <input name="contact_permission" type="checkbox" required className="mt-1 h-5 w-5 shrink-0" />
            <span>Forge may contact me about a Founding Beta place. Joining does not create an account or guarantee admission. <Link href="/privacy" className="underline">Privacy Policy</Link></span>
          </label>
          <button type="submit" disabled={pending} className="w-full rounded-2xl bg-[#D62828] py-4 font-semibold text-white transition hover:bg-[#A61F1F] disabled:bg-gray-400">
            {pending ? 'Saving your place…' : 'Join the waitlist'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-[#666666]">
        Already invited? <Link href="/signup" className="font-semibold text-[#0B2D5C] hover:text-[#D62828]">Create your account</Link>
      </p>
    </div>
  );
}
