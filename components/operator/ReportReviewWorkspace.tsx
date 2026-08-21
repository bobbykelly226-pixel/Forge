'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileWarning,
  Gavel,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import { reviewSafetyReportAction } from '@/app/actions/report-review';
import type { OperatorReportActionState } from '@/app/actions/report-review';
import type {
  OperatorReportCaseStatus,
  OperatorReportReviewData,
} from '@/lib/operator/report-review';

const INITIAL_ACTION_STATE: OperatorReportActionState = { success: false, message: '' };

const STATUS_LABELS: Record<OperatorReportCaseStatus, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_CLASSES: Record<OperatorReportCaseStatus, string> = {
  pending: 'border-[#C98A14]/20 bg-[#FFF8E8] text-[#8A5B06]',
  reviewing: 'border-[#0B2D5C]/15 bg-[#EEF3F9] text-[#0B2D5C]',
  resolved: 'border-[#2E7D5B]/20 bg-[#F0F8F4] text-[#236548]',
  dismissed: 'border-[#667085]/20 bg-[#F5F6F7] text-[#4B5563]',
};

const ENFORCEMENT_ACTIONS = new Set(['warn', 'restrict', 'suspend', 'remove', 'safety_block']);

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function CaseActionForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(reviewSafetyReportAction, INITIAL_ACTION_STATE);
  const [action, setAction] = useState('begin_review');
  const enforcement = ENFORCEMENT_ACTIONS.has(action);

  return (
    <form action={formAction} className="rounded-[1.5rem] border border-[#0B2D5C]/10 bg-white p-5 shadow-[0_12px_35px_rgba(11,45,92,0.05)]">
      <input type="hidden" name="report_id" value={reportId} />
      <div className="flex items-center gap-2">
        <Gavel className="h-5 w-5 text-[#D62828]" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-[#0B2D5C]">Record a case action</h2>
      </div>
      <label htmlFor="case-action" className="mt-5 block text-sm font-semibold text-[#0B2D5C]">
        Action
      </label>
      <select
        id="case-action"
        name="action"
        value={action}
        onChange={(event) => setAction(event.target.value)}
        disabled={pending}
        className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-3 text-sm text-[#1A2332] outline-none focus:border-[#0B2D5C]/45 focus:ring-2 focus:ring-[#0B2D5C]/10"
      >
        <option value="begin_review">Begin review</option>
        <option value="escalate">Escalate</option>
        <option value="warn">Warn member</option>
        <option value="restrict">Restrict profile</option>
        <option value="suspend">Suspend member interactions</option>
        <option value="remove">Remove profile from Forge</option>
        <option value="safety_block">Apply safety block</option>
        <option value="resolve">Resolve case</option>
        <option value="dismiss">Dismiss case</option>
      </select>

      {enforcement ? (
        <div className="mt-4 rounded-2xl border border-[#D62828]/20 bg-[#FFF5F4] px-4 py-3 text-xs leading-relaxed text-[#8F1D1D]">
          This is an enforcement action. The report, evidence, operator identity, reason, outcome, and timestamp remain preserved.
        </div>
      ) : null}

      <label htmlFor="case-reason" className="mt-5 block text-sm font-semibold text-[#0B2D5C]">
        Required reason
      </label>
      <textarea
        id="case-reason"
        name="reason"
        required
        minLength={3}
        maxLength={2000}
        rows={5}
        disabled={pending}
        placeholder="Record the facts supporting this decision. Do not include unnecessary sensitive information."
        className="mt-2 w-full resize-y rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-3 text-sm text-[#1A2332] outline-none placeholder:text-[#98A2B3] focus:border-[#0B2D5C]/45 focus:ring-2 focus:ring-[#0B2D5C]/10"
      />

      {enforcement ? (
        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-[#0B2D5C]/10 bg-[#F6F8FB] p-4 text-sm text-[#344054]">
          <input type="checkbox" name="notify_member" className="mt-0.5 h-4 w-4 accent-[#0B2D5C]" />
          <span>
            Notify the affected member by email and include a protected appeal link. Delivery outcome is audited separately.
          </span>
        </label>
      ) : null}

      {state.message ? (
        <p
          role={state.success ? 'status' : 'alert'}
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            state.success
              ? 'border-[#2E7D5B]/20 bg-[#F0F8F4] text-[#236548]'
              : 'border-[#B42318]/20 bg-[#FFF5F4] text-[#9B1C1C]'
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123E78] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? 'Saving action…' : 'Save case action'}
      </button>
    </form>
  );
}

export default function ReportReviewWorkspace({
  data,
  loadError,
}: {
  data: OperatorReportReviewData | null;
  loadError?: string | null;
}) {
  const counts = {
    pending: data?.cases.filter((item) => item.status === 'pending').length ?? 0,
    reviewing: data?.cases.filter((item) => item.status === 'reviewing').length ?? 0,
    resolved: data?.cases.filter((item) => item.status === 'resolved').length ?? 0,
    dismissed: data?.cases.filter((item) => item.status === 'dismissed').length ?? 0,
  };
  const selected = data?.selectedCase ?? null;

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]">
            <ShieldCheck className="h-4 w-4 text-[#D62828]" aria-hidden="true" />
            MFA-protected operator workspace
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#0B2D5C] sm:text-5xl">
            Safety report review
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#5A6575]">
            Review private member reports and evidence, record bounded enforcement, preserve every decision, and track appeals.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3" aria-label="Operator tools">
          <Link href="/internal/photo-moderation" className="rounded-2xl border border-[#0B2D5C]/14 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]">
            Photo moderation
          </Link>
          <Link href="/internal/operator-security?redirectTo=/internal/report-review" className="rounded-2xl border border-[#0B2D5C]/14 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]">
            Account security
          </Link>
        </nav>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Case counts">
        {(['pending', 'reviewing', 'resolved', 'dismissed'] as const).map((status) => (
          <div key={status} className="rounded-2xl border border-[#0B2D5C]/08 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">{STATUS_LABELS[status]}</p>
            <p className="mt-2 text-3xl font-semibold text-[#0B2D5C]">{counts[status]}</p>
          </div>
        ))}
      </section>

      {loadError ? (
        <p className="mt-6 rounded-2xl border border-[#B42318]/20 bg-[#FFF5F4] px-5 py-4 text-sm text-[#9B1C1C]" role="alert">
          {loadError}
        </p>
      ) : null}

      {!loadError && data && data.cases.length === 0 ? (
        <section className="mt-6 rounded-[1.75rem] border border-[#2E7D5B]/15 bg-[#F2F8F5] px-6 py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#2E7D5B]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">No report cases are waiting</h2>
        </section>
      ) : null}

      {data && selected ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)_22rem]">
          <aside className="rounded-[1.5rem] border border-[#0B2D5C]/10 bg-white/80 p-3 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
            <h2 className="px-2 py-2 text-sm font-semibold text-[#0B2D5C]">Case queue</h2>
            <div className="mt-1 space-y-2">
              {data.cases.map((item) => (
                <Link
                  key={item.reportId}
                  href={`/internal/report-review?case=${encodeURIComponent(item.reportId)}`}
                  aria-current={item.reportId === selected.reportId ? 'page' : undefined}
                  className={`block rounded-2xl border p-4 transition ${
                    item.reportId === selected.reportId
                      ? 'border-[#0B2D5C]/25 bg-[#EEF3F9]'
                      : 'border-[#0B2D5C]/08 bg-white hover:border-[#0B2D5C]/18'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASSES[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                    <span className="text-[11px] text-[#7A8494]">{item.evidenceCount} evidence</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#0B2D5C]">{item.reasonLabel}</p>
                  <p className="mt-1 text-xs text-[#667085]">Against {item.reportedUserName}</p>
                  <p className="mt-2 font-mono text-[10px] text-[#98A2B3]">{item.reportId.slice(0, 8)}</p>
                </Link>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <article className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-5 shadow-[0_16px_45px_rgba(11,45,92,0.06)] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">{selected.reasonLabel}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#0B2D5C]">{selected.reporterName} reported {selected.reportedUserName}</h2>
                  <p className="mt-2 text-sm text-[#667085]">Submitted {formatDate(selected.createdAt)}</p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_CLASSES[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>

              <dl className="mt-6 grid gap-4 rounded-2xl bg-[#F6F8FB] p-5 text-sm sm:grid-cols-2">
                <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8494]">Reporter</dt><dd className="mt-1 break-all text-[#1A2332]">{selected.reporterName} · {selected.reporterId}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8494]">Reported member</dt><dd className="mt-1 break-all text-[#1A2332]">{selected.reportedUserName} · {selected.reportedUserId}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8494]">Conversation</dt><dd className="mt-1 break-all text-[#1A2332]">{selected.conversationId ?? 'Not linked'}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8494]">Admin alert</dt><dd className="mt-1 text-[#1A2332]">{selected.alertStatus ?? 'No ledger row'}</dd></div>
              </dl>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[#0B2D5C]">Member-provided details</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-[#0B2D5C]/08 bg-white px-4 py-4 text-sm leading-relaxed text-[#344054]">
                  {selected.details || 'No additional details were provided.'}
                </p>
              </div>
            </article>

            <section className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-5 sm:p-7">
              <div className="flex items-center gap-2"><FileWarning className="h-5 w-5 text-[#D62828]" aria-hidden="true" /><h2 className="text-xl font-semibold text-[#0B2D5C]">Private evidence</h2></div>
              <p className="mt-2 text-xs leading-relaxed text-[#667085]">Signed links expire after five minutes. Evidence remains private and immutable.</p>
              {data.evidence.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {data.evidence.map((evidence) => (
                    <a key={evidence.id} href={evidence.signedUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-[#0B2D5C]/10 bg-[#0B2D5C]">
                      {/* Private, expiring operator evidence URL. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={evidence.signedUrl} alt={`Private report evidence ${evidence.fileName}`} className="h-64 w-full object-contain" />
                      <span className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-xs text-[#344054]">
                        <span className="truncate">{evidence.fileName}</span><ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-[#F6F8FB] px-4 py-6 text-center text-sm text-[#667085]">No screenshot evidence is attached.</p>
              )}
            </section>

            {data.appeals.length ? (
              <section className="rounded-[1.75rem] border border-[#C98A14]/20 bg-[#FFF8E8] p-5 sm:p-7">
                <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[#9A6508]" aria-hidden="true" /><h2 className="text-xl font-semibold text-[#0B2D5C]">Appeals</h2></div>
                <div className="mt-4 space-y-3">
                  {data.appeals.map((appeal) => (
                    <article key={appeal.id} className="rounded-2xl bg-white p-4 text-sm text-[#344054]"><p className="font-semibold text-[#0B2D5C]">{appeal.status} · {formatDate(appeal.createdAt)}</p><p className="mt-2 whitespace-pre-wrap leading-relaxed">{appeal.details}</p></article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-5 sm:p-7">
              <div className="flex items-center gap-2"><Archive className="h-5 w-5 text-[#0B2D5C]" aria-hidden="true" /><h2 className="text-xl font-semibold text-[#0B2D5C]">Append-only case history</h2></div>
              <div className="mt-5 space-y-4">
                {data.events.length ? data.events.map((event) => (
                  <article key={event.id} className="border-l-2 border-[#0B2D5C]/15 pl-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold capitalize text-[#0B2D5C]">{event.action.replaceAll('_', ' ')}</p><p className="text-xs text-[#7A8494]">{formatDate(event.createdAt)}</p></div><p className="mt-1 text-sm text-[#344054]">{event.reason}</p><p className="mt-1 text-xs text-[#667085]">{event.outcome} · operator {event.operatorId.slice(0, 8)}</p></article>
                )) : <p className="text-sm text-[#667085]">No operator action has been recorded yet.</p>}
              </div>
            </section>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <CaseActionForm reportId={selected.reportId} />
            <section className="rounded-[1.5rem] border border-[#D62828]/15 bg-[#FFF5F4] p-5">
              <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-[#B42318]" aria-hidden="true" /><h2 className="font-semibold text-[#0B2D5C]">Operator standard</h2></div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#5A4A4A]"><li>Use the least severe action that addresses the documented risk.</li><li>Record facts, not guesses or diagnoses.</li><li>Preserve evidence and never download it to an unmanaged device.</li><li>Escalate credible imminent-danger or legal-risk cases.</li></ul>
            </section>
            {data.enforcements.length ? (
              <section className="rounded-[1.5rem] border border-[#0B2D5C]/10 bg-white p-5"><h2 className="font-semibold text-[#0B2D5C]">Enforcement ledger</h2><div className="mt-3 space-y-3">{data.enforcements.map((item) => (<article key={item.id} className="rounded-xl bg-[#F6F8FB] p-3 text-xs text-[#344054]"><p className="font-semibold capitalize text-[#0B2D5C]">{item.action.replaceAll('_', ' ')}</p><p className="mt-1">Notification: {item.notificationOutcome}</p><p className="mt-1 text-[#7A8494]">{formatDate(item.createdAt)}</p></article>))}</div></section>
            ) : null}
            <div className="inline-flex items-center gap-2 text-xs text-[#667085]"><Clock3 className="h-4 w-4" aria-hidden="true" />Case data is always loaded fresh.</div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
