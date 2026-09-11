'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Copy, Link2, PauseCircle, PlayCircle, ShieldCheck, UserPlus } from 'lucide-react';

import {
  createBetaSignupLinkAction,
  createDirectBetaInvitationAction,
  updateBetaEnrollmentAction,
  type BetaEnrollmentActionState,
} from '@/app/actions/beta-enrollment';
import type { BetaEnrollmentDashboard } from '@/lib/operator/beta-enrollment';

const INITIAL: BetaEnrollmentActionState = { success: false, message: '' };
const UTC_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

function Result({ state }: { state: BetaEnrollmentActionState }) {
  if (!state.message) return null;
  return <p role={state.success ? 'status' : 'alert'} className={`mt-3 rounded-xl px-4 py-3 text-sm ${state.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{state.message}</p>;
}

function LinkCreator() {
  const [state, action, pending] = useActionState(createBetaSignupLinkAction, INITIAL);
  const [linkType, setLinkType] = useState('single');
  const invitePath = state.invitationPath ?? '';
  const [copyMessage, setCopyMessage] = useState('');
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
      setCopyMessage('Full invitation link copied.');
    } catch {
      setCopyMessage('Copy is unavailable. Select the path and add this site’s address before sharing.');
    }
  }
  return (
    <section className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3"><Link2 className="h-5 w-5 text-[#D62828]" /><h2 className="text-xl font-semibold text-[#0B2D5C]">Create invitation link</h2></div>
      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#0B2D5C] sm:col-span-2">Link name<input name="label" required maxLength={120} placeholder="Founding cohort — personal outreach" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
        <label className="text-sm font-semibold text-[#0B2D5C]">Link type<select name="link_type" value={linkType} onChange={(event) => setLinkType(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"><option value="single">Single use</option><option value="limited">Limited shared link</option></select></label>
        <label className="text-sm font-semibold text-[#0B2D5C]">Maximum uses<input name="max_uses" type="number" min={1} max={100} defaultValue={25} disabled={linkType === 'single'} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:bg-gray-100" /></label>
        <label className="text-sm font-semibold text-[#0B2D5C]">Expires after<select name="expires_in_days" defaultValue="14" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label>
        <button disabled={pending} className="self-end rounded-xl bg-[#0B2D5C] px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Creating…' : 'Create secure link'}</button>
      </form>
      <Result state={state} />
      <p role="status" className="mt-2 text-sm">{copyMessage}</p>
      {invitePath ? <div className="mt-3 flex gap-2 rounded-xl border bg-[#F5F7FA] p-3"><input readOnly value={invitePath} aria-label="New invitation link" className="min-w-0 flex-1 bg-transparent text-sm" /><button type="button" onClick={copyLink} className="rounded-lg bg-white p-2 text-[#0B2D5C]" aria-label="Copy invitation link"><Copy className="h-4 w-4" /></button></div> : null}
    </section>
  );
}

function DirectInvitation() {
  const [state, action, pending] = useActionState(createDirectBetaInvitationAction, INITIAL);
  return <section className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><UserPlus className="h-5 w-5 text-[#D62828]" /><h2 className="text-xl font-semibold text-[#0B2D5C]">Direct email access</h2></div><p className="mt-2 text-sm text-[#5A6575]">Keep exact-email access for internal testers or personal invitations.</p><form action={action} className="mt-5 space-y-4"><input name="email" type="email" required aria-label="Invited email address" maxLength={254} placeholder="Invited email address" className="w-full rounded-xl border px-4 py-3" /><input name="note" maxLength={500} aria-label="Optional private note" placeholder="Optional private note" className="w-full rounded-xl border px-4 py-3" /><button disabled={pending} className="w-full rounded-xl border border-[#0B2D5C] px-5 py-3 font-semibold text-[#0B2D5C] disabled:opacity-60">{pending ? 'Saving…' : 'Activate email for 14 days'}</button></form><Result state={state} /></section>;
}

export default function BetaEnrollmentWorkspace({ dashboard, loadError }: { dashboard: BetaEnrollmentDashboard | null; loadError: string | null }) {
  const [controlState, controlAction, controlPending] = useActionState(updateBetaEnrollmentAction, INITIAL);
  return <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]"><ShieldCheck className="h-4 w-4 text-[#D62828]" />MFA-protected</div><h1 className="mt-4 text-4xl font-semibold text-[#0B2D5C] sm:text-5xl">Founding Beta enrollment</h1><p className="mt-3 max-w-2xl text-[#5A6575]">Control the cohort without making invited members wait for manual email setup.</p></div><Link href="/internal" className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]">Administrator Home</Link></div>
    {loadError ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{loadError}</p> : null}
    {dashboard ? <><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-white p-5"><p className="text-sm text-[#5A6575]">Email-verified members</p><p className="mt-2 text-3xl font-semibold text-[#0B2D5C]">{dashboard.settings.verifiedCount}</p></div><div className="rounded-2xl bg-white p-5"><p className="text-sm text-[#5A6575]">Capacity</p><p className="mt-2 text-3xl font-semibold text-[#0B2D5C]">{dashboard.settings.memberLimit}</p></div><div className="rounded-2xl bg-white p-5"><p className="text-sm text-[#5A6575]">Awaiting email confirmation</p><p className="mt-2 text-3xl font-semibold text-[#0B2D5C]">{dashboard.settings.pendingCount}</p></div><div className="rounded-2xl bg-white p-5"><p className="text-sm text-[#5A6575]">Enrollment</p><p className={`mt-2 text-xl font-semibold ${dashboard.settings.enrollmentOpen ? 'text-emerald-700' : 'text-amber-700'}`}>{!dashboard.settings.enrollmentOpen ? 'Paused' : dashboard.settings.acceptedCount >= dashboard.settings.memberLimit ? 'Full' : 'Open'}</p></div></section>
      <p className="mt-3 text-sm text-[#5A6575]">{dashboard.settings.acceptedCount} places occupied, including existing test accounts and accounts awaiting email confirmation. Unconfirmed accounts hold their place; only email-confirmed accounts are counted as verified. Legal and adult eligibility checks still apply in onboarding.</p><section className="mt-5 rounded-[1.75rem] border bg-white p-6"><div className="grid gap-5 md:grid-cols-2"><form action={controlAction}><input type="hidden" name="intent" value="toggle" /><input type="hidden" name="enrollment_open" value={String(!dashboard.settings.enrollmentOpen)} /><button disabled={controlPending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2D5C] px-5 py-3 font-semibold text-white">{dashboard.settings.enrollmentOpen ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}{dashboard.settings.enrollmentOpen ? 'Pause public link enrollment' : 'Reopen public link enrollment'}</button></form><form action={controlAction} className="flex gap-2"><input type="hidden" name="intent" value="limit" /><input name="member_limit" type="number" min={Math.max(1, dashboard.settings.acceptedCount)} max={500} defaultValue={dashboard.settings.memberLimit} aria-label="Founding Beta account limit" className="min-w-0 flex-1 rounded-xl border px-4 py-3" /><button disabled={controlPending} className="rounded-xl border px-5 py-3 font-semibold text-[#0B2D5C]">Save limit</button></form></div><Result state={controlState} /></section>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><LinkCreator /><DirectInvitation /></div>
      <section className="mt-5 rounded-[1.75rem] border bg-white p-6"><h2 className="text-xl font-semibold text-[#0B2D5C]">Invitation links</h2><div className="mt-4 space-y-3">{dashboard.links.length ? dashboard.links.map((link) => { const inactive = link.status === 'inactive'; return <article key={link.id} className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-[#0B2D5C]">{link.label}</p><p className="mt-1 text-sm text-[#5A6575]">{link.useCount} of {link.maxUses} used · {link.expiresAt ? `expires ${UTC_DATE.format(new Date(link.expiresAt))}` : 'no expiration'} · {link.status}</p></div>{!inactive ? <form action={controlAction}><input type="hidden" name="intent" value="revoke_link" /><input type="hidden" name="link_id" value={link.id} /><button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Revoke</button></form> : null}</article>; }) : <p className="text-sm text-[#5A6575]">No links have been created yet.</p>}</div></section>
      <section className="mt-5 rounded-[1.75rem] border bg-white p-6">
        <h2 className="text-xl font-semibold text-[#0B2D5C]">Waitlist ({dashboard.waitlistCount})</h2>
        <p className="mt-2 text-sm text-[#5A6575]">Oldest requests first, up to 100 shown. No automatic invitation is sent; you choose the next cohort.</p>
        <ul className="mt-4 space-y-3">{dashboard.waitlist.map((entry) => <li key={entry.email} className="rounded-xl border p-4"><p className="font-semibold">{entry.name}</p><p className="break-all text-sm">{entry.email}</p><p className="text-xs text-[#5A6575]">{UTC_DATE.format(new Date(entry.created_at))}</p></li>)}</ul>
        {!dashboard.waitlistCount ? <p className="mt-3 text-sm">No waitlist requests yet.</p> : null}
      </section>
    </> : null}
  </main>;
}
