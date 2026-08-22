'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Archive, Download, PauseCircle, ShieldCheck, Trash2 } from 'lucide-react';

import {
  changeAccountLifecycleAction,
  deleteAccountAction,
  requestAccountExportAction,
  type AccountActionState,
} from '@/app/actions/account-lifecycle';
import type { AccountLifecycle } from '@/lib/account/lifecycle';

const INITIAL: AccountActionState = { success: false, message: '' };

function StatusMessage({ state }: { state: AccountActionState }) {
  if (!state.message) return null;
  return (
    <p role={state.success ? 'status' : 'alert'} className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${state.success ? 'border-[#2E7D5B]/20 bg-[#F0F8F4] text-[#236548]' : 'border-[#B42318]/20 bg-[#FFF5F4] text-[#9B1C1C]'}`}>
      {state.message}
    </p>
  );
}

export default function AccountLifecyclePanel({
  email,
  lifecycle,
  loadError,
}: {
  email: string;
  lifecycle: AccountLifecycle | null;
  loadError: string | null;
}) {
  const [pauseState, pauseAction, pausePending] = useActionState(changeAccountLifecycleAction, INITIAL);
  const [deactivationState, deactivationAction, deactivationPending] = useActionState(changeAccountLifecycleAction, INITIAL);
  const [exportState, exportAction, exportPending] = useActionState(requestAccountExportAction, INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, INITIAL);
  const [showDeactivate, setShowDeactivate] = useState(false);

  const paused = lifecycle?.profile_status === 'paused';
  const deactivated = lifecycle?.profile_status === 'deactivated';

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]">
            <ShieldCheck className="h-4 w-4 text-[#D62828]" aria-hidden="true" /> Private account controls
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-discovery-display)] text-4xl font-semibold tracking-[-0.03em] text-[#0B2D5C] sm:text-5xl">Account & Privacy</h1>
          <p className="mt-3 text-sm text-[#5A6575]">Signed in as {email}</p>
        </div>
        <Link href="/profile" className="rounded-2xl border border-[#0B2D5C]/14 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]">Back to My Profile</Link>
      </div>

      {loadError ? <p className="mt-7 rounded-2xl border border-[#B42318]/20 bg-[#FFF5F4] px-5 py-4 text-sm text-[#9B1C1C]">{loadError}</p> : null}

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-[0_16px_45px_rgba(11,45,92,0.06)]">
          <PauseCircle className="h-7 w-7 text-[#0B2D5C]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">Pause your profile</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">Hide from Discovery immediately while keeping your profile, connections, and conversations. You can resume anytime.</p>
          <form action={pauseAction}>
            <input type="hidden" name="lifecycle_action" value={paused ? 'resume' : 'pause'} />
            <button disabled={!lifecycle || deactivated || pausePending} className="mt-5 rounded-2xl bg-[#0B2D5C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {pausePending ? 'Saving…' : paused ? 'Resume profile' : 'Pause profile'}
            </button>
          </form>
          <StatusMessage state={pauseState} />
        </article>

        <article className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-[0_16px_45px_rgba(11,45,92,0.06)]">
          <Archive className="h-7 w-7 text-[#0B2D5C]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">Deactivate your account</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">Turn off Discovery and member interactions while retaining your account for a later return. Password confirmation is required.</p>
          <button onClick={() => setShowDeactivate((value) => !value)} className="mt-5 rounded-2xl border border-[#0B2D5C]/18 bg-white px-5 py-3 text-sm font-semibold text-[#0B2D5C]">
            {deactivated ? 'Reactivate account' : 'Deactivate account'}
          </button>
          {showDeactivate ? (
            <form action={deactivationAction} className="mt-4">
              <input type="hidden" name="lifecycle_action" value={deactivated ? 'reactivate' : 'deactivate'} />
              <label className="block text-sm font-semibold text-[#0B2D5C]">Current password</label>
              <input type="password" name="password" required autoComplete="current-password" className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 text-sm" />
              <button disabled={deactivationPending} className="mt-3 w-full rounded-2xl bg-[#D62828] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {deactivationPending ? 'Saving…' : `Confirm ${deactivated ? 'reactivation' : 'deactivation'}`}
              </button>
            </form>
          ) : null}
          <StatusMessage state={deactivationState} />
        </article>

        <article className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-[0_16px_45px_rgba(11,45,92,0.06)]">
          <Download className="h-7 w-7 text-[#0B2D5C]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">Download your data</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">Create a one-time JSON download of your profile, choices, messages, connections, and acceptance history.</p>
          <form action={exportAction} className="mt-5">
            <label className="block text-sm font-semibold text-[#0B2D5C]">Current password</label>
            <input type="password" name="password" required autoComplete="current-password" className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 text-sm" />
            <button disabled={exportPending} className="mt-3 rounded-2xl bg-[#0B2D5C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{exportPending ? 'Preparing…' : 'Prepare secure download'}</button>
          </form>
          <StatusMessage state={exportState} />
          {exportState.downloadUrl ? <a href={exportState.downloadUrl} className="mt-3 inline-flex rounded-2xl bg-[#D62828] px-5 py-3 text-sm font-semibold text-white">Download now</a> : null}
        </article>

        <article className="rounded-[1.75rem] border border-[#D62828]/20 bg-[#FFF9F8] p-6 shadow-[0_16px_45px_rgba(11,45,92,0.05)]">
          <Trash2 className="h-7 w-7 text-[#D62828]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">Delete your account</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">Permanently remove or de-identify member data. Safety reports, legal acceptances, and required audit evidence are retained under Forge policy.</p>
          {lifecycle?.legal_hold_active ? <p className="mt-4 rounded-2xl border border-[#C98A14]/25 bg-[#FFF8E8] px-4 py-3 text-sm text-[#8A5B06]">Deletion is currently blocked by a legal preservation requirement.</p> : (
            <form action={deleteAction} className="mt-5 space-y-3">
              <input type="password" name="password" required autoComplete="current-password" placeholder="Current password" className="w-full rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 text-sm" />
              <input name="confirmation" required placeholder="Type DELETE" className="w-full rounded-2xl border border-[#D62828]/25 px-4 py-3 text-sm" />
              <button disabled={deletePending} className="w-full rounded-2xl bg-[#D62828] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{deletePending ? 'Deleting…' : 'Permanently delete account'}</button>
            </form>
          )}
          <StatusMessage state={deleteState} />
        </article>
      </section>
    </main>
  );
}
