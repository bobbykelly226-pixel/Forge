'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Scale, ShieldCheck } from 'lucide-react';

import { updateAccountGovernanceAction, type GovernanceActionState } from '@/app/actions/account-governance';
import type { AccountGovernanceRecord } from '@/lib/operator/account-governance';

const INITIAL: GovernanceActionState = { success: false, message: '' };

export default function AccountGovernanceWorkspace({ email, record, error }: { email: string; record: AccountGovernanceRecord | null; error: string | null }) {
  const [state, action, pending] = useActionState(updateAccountGovernanceAction, INITIAL);
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]"><ShieldCheck className="h-4 w-4 text-[#D62828]" /> MFA-protected administrator workspace</div>
          <h1 className="mt-5 font-[family-name:var(--font-discovery-display)] text-4xl font-semibold tracking-[-0.03em] text-[#0B2D5C] sm:text-5xl">Account governance</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#5A6575]">Manage retention and legal preservation without exposing these controls to members.</p>
        </div>
        <Link href="/internal" className="rounded-2xl border border-[#0B2D5C]/14 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]">Administrator Home</Link>
      </header>
      <form method="get" className="mt-8 flex max-w-2xl gap-3 rounded-[1.5rem] border border-[#0B2D5C]/10 bg-white p-4">
        <label htmlFor="member-email" className="sr-only">Exact member email</label>
        <input id="member-email" name="email" type="email" defaultValue={email} required placeholder="Exact member email" className="min-w-0 flex-1 rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 text-sm" />
        <button className="rounded-2xl bg-[#0B2D5C] px-5 py-3 text-sm font-semibold text-white">Find member</button>
      </form>
      {error ? <p className="mt-5 rounded-2xl border border-[#B42318]/20 bg-[#FFF5F4] px-5 py-4 text-sm text-[#9B1C1C]">{error}</p> : null}
      {record ? (
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6">
            <div className="flex items-center gap-3"><Scale className="h-6 w-6 text-[#D62828]" /><div><h2 className="text-2xl font-semibold text-[#0B2D5C]">{record.name}</h2><p className="text-sm text-[#667085]">{record.email}</p></div></div>
            <dl className="mt-6 grid gap-4 rounded-2xl bg-[#F6F8FB] p-5 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase text-[#7A8494]">Profile status</dt><dd className="mt-1 text-[#0B2D5C]">{record.profileStatus}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#7A8494]">Deletion status</dt><dd className="mt-1 text-[#0B2D5C]">{record.deletionStatus}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#7A8494]">Legal hold</dt><dd className="mt-1 text-[#0B2D5C]">{record.legalHoldActive ? 'Active' : 'Not active'}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#7A8494]">Retention</dt><dd className="mt-1 text-[#0B2D5C]">{record.retentionClass}</dd></div>
            </dl>
            <form action={action} className="mt-6 space-y-4">
              <input type="hidden" name="member_id" value={record.userId} />
              <label className="flex items-center gap-3 rounded-2xl border border-[#D62828]/15 bg-[#FFF9F8] p-4 text-sm font-semibold text-[#0B2D5C]"><input type="checkbox" name="legal_hold_active" defaultChecked={record.legalHoldActive} className="h-4 w-4 accent-[#D62828]" /> Active legal hold</label>
              <label className="block text-sm font-semibold text-[#0B2D5C]">Retention class<select name="retention_class" defaultValue={record.retentionClass} className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 font-normal"><option value="standard">Standard</option><option value="safety_extended">Safety extended</option><option value="legal_required">Legal required</option></select></label>
              <label className="block text-sm font-semibold text-[#0B2D5C]">Retain through (optional)<input type="date" name="retain_until" defaultValue={record.retainUntil?.slice(0, 10)} className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 font-normal" /></label>
              <label className="block text-sm font-semibold text-[#0B2D5C]">Required audit reason<textarea name="reason" required minLength={3} maxLength={2000} rows={4} defaultValue={record.legalHoldReason ?? ''} className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 font-normal" /></label>
              {state.message ? <p className={`rounded-2xl border px-4 py-3 text-sm ${state.success ? 'border-[#2E7D5B]/20 bg-[#F0F8F4] text-[#236548]' : 'border-[#B42318]/20 bg-[#FFF5F4] text-[#9B1C1C]'}`}>{state.message}</p> : null}
              <button disabled={pending} className="w-full rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save and audit governance controls'}</button>
            </form>
          </section>
          <aside className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white/80 p-5"><h2 className="text-lg font-semibold text-[#0B2D5C]">Recent lifecycle events</h2><div className="mt-4 space-y-3">{record.events.length ? record.events.map((event) => <div key={event.id} className="rounded-2xl bg-[#F6F8FB] p-4"><p className="text-sm font-semibold text-[#0B2D5C]">{event.action.replaceAll('_', ' ')}</p><p className="mt-1 text-xs text-[#667085]">{new Date(event.created_at).toLocaleString()}</p>{event.reason ? <p className="mt-2 text-xs leading-relaxed text-[#344054]">{event.reason}</p> : null}</div>) : <p className="text-sm text-[#667085]">No lifecycle events yet.</p>}</div></aside>
        </div>
      ) : null}
    </main>
  );
}
