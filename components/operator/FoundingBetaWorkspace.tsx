'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { updateBetaLimit } from '@/app/actions/beta-enrollment';
import { betaAccountStatus } from '@/lib/auth/beta-enrollment';
import type { BetaOverview } from '@/lib/operator/beta-enrollment';
import type { FoundingBetaRequest, FoundingBetaRequestStatus } from '@/lib/operator/founding-beta';

function SignupLink({ email }: { email?: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = `https://forge.forgedinlife.com/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`;
  return <div className="mt-3">
    <button type="button" className="rounded-lg bg-[#0B2D5C] px-4 py-2 text-white" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setCopied(true); setFailed(false); }
      catch { setFailed(true); }
    }}>{copied ? 'Signup link copied' : 'Copy signup link'}</button>
    {failed && <p className="mt-2 break-all text-sm" role="status">Copy this link: {url}</p>}
  </div>;
}

export default function FoundingBetaWorkspace({ requests, overview, loadError, status }: {
  requests: FoundingBetaRequest[];
  overview: BetaOverview | null;
  loadError?: string | null;
  status: FoundingBetaRequestStatus | null;
}) {
  const [state, action, pending] = useActionState(updateBetaLimit, { success: false, message: '' });
  const visible = status ? requests.filter(request => request.status === status) : requests;
  const confirmed = overview?.members.filter(member => member.confirmed_at).length ?? 0;
  return <main className="mx-auto w-full max-w-5xl px-4 py-7 text-[#0B2D5C] sm:px-6 sm:py-10">
    <header><Link href="/internal" className="font-semibold underline">← Administrator Home</Link>
      <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">Founding Beta enrollment</h1>
      <p className="mt-3 text-black">People can create an account directly. Invitation requests and seven-day links are no longer required.</p>
      <SignupLink />
    </header>
    {loadError && <p role="alert" className="mt-6 border border-[#C92027] bg-[#FFF5F4] p-4 text-[#8F1D1D]">{loadError}</p>}
    {overview ? <>
      <section className="mt-7 grid gap-4 sm:grid-cols-3" aria-label="Beta enrollment totals">
        {[['Accounts', `${overview.accountCount} / ${overview.accountLimit}`], ['Email confirmed', String(confirmed)], ['Waitlist', String(overview.waitlist.length)]].map(([label, value]) => <div key={label} className="border border-[#0B2D5C] bg-[#E6E6E7] p-5"><p>{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}
      </section>
      <form action={action} className="mt-5 rounded-xl border border-[#0B2D5C]/30 bg-[#E6E6E7] p-5">
        <label htmlFor="beta-account-limit" className="block font-semibold">Total beta account limit</label>
        <p className="mt-1 text-sm text-black">Includes existing and unconfirmed accounts. When full, new visitors can join the waitlist. Existing members can still sign in.</p>
        <div className="mt-3 flex flex-wrap gap-3"><input id="beta-account-limit" type="number" name="account_limit" min={1} max={10000} defaultValue={overview.accountLimit} required className="w-32 rounded-lg border border-[#0B2D5C]/30 bg-white px-4 py-2 text-black" /><button disabled={pending} className="rounded-lg bg-[#0B2D5C] px-4 py-2 text-white">{pending ? 'Saving…' : 'Save limit'}</button></div>
        {state.message && <p role={state.success ? 'status' : 'alert'} className="mt-3 text-black">{state.message}</p>}
      </form>
      <section className="mt-8"><h2 className="text-2xl font-semibold">Accounts</h2><p className="mt-2 text-sm text-black">Last sign-in shows authentication activity; it does not tell us which features someone has tested.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{overview.members.map(member => <article key={member.id} className="border border-[#0B2D5C]/30 bg-[#E6E6E7] p-5">
          <h3 className="break-all font-semibold">{member.email}</h3><p className="mt-2 font-semibold">{betaAccountStatus(member)}</p>
          <p className="mt-2 text-sm text-black">Account created: {new Date(member.created_at).toLocaleString()}</p>
          <p className="mt-1 text-sm text-black">Last sign-in: {member.last_sign_in_at ? new Date(member.last_sign_in_at).toLocaleString() : 'No sign-in recorded'}</p>
          {!member.confirmed_at && <Link href="/login" className="mt-3 inline-block text-sm underline">Sign-in and resend confirmation page</Link>}
        </article>)}</div>
      </section>
      <section className="mt-8"><h2 className="text-2xl font-semibold">Waitlist</h2>{overview.waitlist.length ? <ul className="mt-4 space-y-3">{overview.waitlist.map(entry => <li key={entry.email} className="border border-[#0B2D5C]/30 bg-[#E6E6E7] p-4"><p className="break-all font-semibold">{entry.email}</p><p className="mt-1 text-sm text-black">Joined {new Date(entry.joined_at).toLocaleString()}</p><SignupLink email={entry.email} /></li>)}</ul> : <p className="mt-3 text-black">No one is waiting for a place.</p>}</section>
    </> : <p className="mt-6 text-black" role="alert">Account status and capacity could not be loaded. Refresh before changing enrollment settings.</p>}
    <section className="mt-9"><h2 className="text-2xl font-semibold">Previous access requests</h2><p className="mt-2 text-black">Historical requests are preserved. People without an account can use the signup link directly; old invitation expiry dates no longer block them.</p>
      {status && <Link href="/internal/founding-beta" className="mt-3 inline-block underline">Show all previous requests</Link>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{visible.map(request => {
        const member = overview?.members.find(item => item.email?.toLowerCase() === request.email.toLowerCase());
        return <article key={request.id} className="border border-[#0B2D5C]/30 bg-[#E6E6E7] p-5"><h3 className="text-xl font-semibold">{request.firstName}</h3><p className="mt-1 break-all text-sm text-black">{request.email}</p><p className="mt-3 font-semibold">{overview ? betaAccountStatus(member) : 'Account status unavailable'}</p><p className="mt-1 text-sm text-black">Original request: {request.status}</p>{request.decisionNote && <p className="mt-2 text-sm text-black">Private note: {request.decisionNote}</p>}{overview && !member && <SignupLink email={request.email} />}</article>;
      })}</div>
    </section>
  </main>;
}
