'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { joinBetaWaitlist } from '@/app/actions/beta-enrollment';

export default function BetaWaitlistForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [state, action, pending] = useActionState(joinBetaWaitlist, { success: false, message: '' });
  return <section className="rounded-xl border border-[#0B2D5C]/30 bg-[#E6E6E7] p-6 text-[#0B2D5C]">
    <h2 className="text-2xl font-semibold">Join the beta waitlist</h2>
    <p className="mt-3 text-black">The current beta group is full. Leave your email and we’ll contact you when more places open.</p>
    {!state.success && <form action={action} className="mt-5 space-y-4">
      <div className="hidden" aria-hidden="true"><label htmlFor="waitlist-website">Website</label><input id="waitlist-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="block font-semibold" htmlFor="waitlist-email">Email address</label>
      <input id="waitlist-email" name="email" type="email" autoComplete="email" defaultValue={initialEmail} maxLength={254} required disabled={pending} className="w-full rounded-lg border border-[#0B2D5C]/30 bg-white px-4 py-3 text-black" />
      <p className="text-sm text-black">By joining, you agree to be contacted about beta availability. <Link href="/privacy" className="underline">Privacy Policy</Link></p>
      <button disabled={pending} className="w-full rounded-lg bg-[#0B2D5C] px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'Joining…' : 'Join waitlist'}</button>
    </form>}
    {state.message && <p role={state.success ? 'status' : 'alert'} className="mt-4 text-black">{state.message}</p>}
    <p className="mt-4 text-sm">Already have an account? <Link href="/login" className="font-semibold underline">Sign in</Link></p>
  </section>;
}
