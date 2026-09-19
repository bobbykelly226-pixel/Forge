'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Mail, ShieldCheck, UserCheck, UserX } from 'lucide-react';

import {
  reviewFoundingBetaRequestAction,
  type FoundingBetaReviewState,
} from '@/app/actions/founding-beta-review';
import type { FoundingBetaRequest, FoundingBetaRequestStatus } from '@/lib/operator/founding-beta';

const INITIAL_STATE: FoundingBetaReviewState = { success: false, message: '' };

const LABELS: Record<string, string> = {
  man: 'Man', woman: 'Woman', men: 'Men', women: 'Women',
  marriage: 'Marriage', serious_relationship: 'Serious relationship', intentional_dating: 'Intentional dating',
};

function ReviewForm({ request }: { request: FoundingBetaRequest }) {
  const [state, formAction, pending] = useActionState(reviewFoundingBetaRequestAction, INITIAL_STATE);
  const [action, setAction] = useState(request.status === 'approved' || request.status === 'invited' ? 'resend' : 'approve');
  return (
    <form action={formAction} className="mt-5 border-t border-[#C9CBCE] pt-5">
      <input type="hidden" name="request_id" value={request.id} />
      <label className="text-sm font-semibold text-[#0B2D5C]">
        Decision
        <select name="action" value={action} onChange={(event) => setAction(event.target.value)} disabled={pending} className="mt-2 w-full border border-[#0B2D5C] bg-white px-4 py-3 text-black">
          {request.status === 'pending' ? <option value="approve">Approve and email invitation</option> : null}
          {request.status === 'pending' ? <option value="decline">Decline request</option> : null}
          {request.status === 'approved' || request.status === 'invited' ? <option value="resend">Send invitation again</option> : null}
        </select>
      </label>
      <label className="mt-4 block text-sm font-semibold text-[#0B2D5C]">
        Required private note
        <textarea name="reason" required minLength={3} maxLength={1000} rows={3} disabled={pending} defaultValue={action === 'resend' ? 'Invitation email requested again by administrator.' : ''} placeholder="Record why this person is being approved or declined." className="mt-2 w-full resize-y border border-[#0B2D5C] bg-white px-4 py-3 text-black" />
      </label>
      {state.message ? <p role={state.success ? 'status' : 'alert'} className={`mt-4 border px-4 py-3 text-sm ${state.success ? 'border-[#2E7D5B] bg-[#F0F8F4] text-[#236548]' : 'border-[#C92027] bg-[#FFF5F4] text-[#8F1D1D]'}`}>{state.message}</p> : null}
      <button type="submit" disabled={pending} className={`mt-4 w-full px-5 py-3.5 font-semibold text-white disabled:opacity-55 ${action === 'decline' ? 'bg-[#C92027]' : 'bg-[#0B2D5C]'}`}>
        {pending ? 'Saving…' : action === 'approve' ? 'Approve and send invitation' : action === 'decline' ? 'Decline request' : 'Send invitation again'}
      </button>
    </form>
  );
}

const QUEUES: Array<{
  status: FoundingBetaRequestStatus;
  label: string;
  description: string;
  icon: typeof Clock3;
  group: 'attention' | 'history';
}> = [
  { status: 'pending', label: 'Pending review', description: 'New requests waiting for a decision.', icon: Clock3, group: 'attention' },
  { status: 'approved', label: 'Email pending', description: 'Approved requests whose invitation still needs attention.', icon: UserCheck, group: 'attention' },
  { status: 'invited', label: 'Invited', description: 'Requests with an invitation already sent.', icon: Mail, group: 'history' },
  { status: 'declined', label: 'Declined', description: 'Requests that were not invited.', icon: UserX, group: 'history' },
];

export default function FoundingBetaWorkspace({
  requests,
  loadError,
  status,
}: {
  requests: FoundingBetaRequest[];
  loadError?: string | null;
  status: FoundingBetaRequestStatus | null;
}) {
  const counts = {
    pending: requests.filter((item) => item.status === 'pending').length,
    invited: requests.filter((item) => item.status === 'invited').length,
    approved: requests.filter((item) => item.status === 'approved').length,
    declined: requests.filter((item) => item.status === 'declined').length,
  };

  const activeQueue = QUEUES.find((queue) => queue.status === status) ?? null;
  const visibleRequests = status ? requests.filter((request) => request.status === status) : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 border border-[#0B2D5C]/15 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]"><ShieldCheck className="h-4 w-4 text-[#C92027]" /> MFA-protected administrator workspace</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#0B2D5C] sm:text-5xl">Founding Beta requests</h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-[#5C636B]">Review requests, build a balanced first cohort, and issue personal seven-day invitations. Submission details are private.</p>
        </div>
        <Link href={status ? '/internal/founding-beta' : '/internal'} className="inline-flex items-center gap-2 border border-[#0B2D5C] bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {status ? 'Back to Founding Beta' : 'Back to Administrator Home'}
        </Link>
      </header>

      {!status ? (
        <>
          <section className="mt-8" aria-labelledby="beta-attention-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C92027]">Work queues</p>
                <h2 id="beta-attention-heading" className="mt-1 text-2xl font-semibold text-[#0B2D5C]">Needs attention</h2>
              </div>
              <p className="text-sm text-[#5C636B]">Open one queue at a time</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {QUEUES.filter((queue) => queue.group === 'attention').map((queue) => {
                const Icon = queue.icon;
                return (
                  <Link key={queue.status} href={`/internal/founding-beta?status=${queue.status}`} className="group border border-[#0B2D5C] bg-[#E6E6E7] p-5 shadow-[0_10px_24px_rgba(11,45,92,0.08)] transition hover:bg-white sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <span className="border border-[#C92027] bg-white p-2.5 text-[#C92027]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                      <span className="text-4xl font-semibold text-[#0B2D5C]">{counts[queue.status]}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-[#0B2D5C]">{queue.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-black">{queue.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#C92027]">Open queue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                  </Link>
                );
              })}
            </div>
          </section>
          <section className="mt-9" aria-labelledby="beta-history-heading">
            <h2 id="beta-history-heading" className="text-2xl font-semibold text-[#0B2D5C]">Completed and history</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {QUEUES.filter((queue) => queue.group === 'history').map((queue) => {
                const Icon = queue.icon;
                return (
                  <Link key={queue.status} href={`/internal/founding-beta?status=${queue.status}`} className="group border border-[#0B2D5C] bg-white p-5 transition hover:bg-[#E6E6E7] sm:p-6">
                    <div className="flex items-start justify-between gap-4"><Icon className="h-6 w-6 text-[#0B2D5C]" aria-hidden="true" /><span className="text-3xl font-semibold text-[#0B2D5C]">{counts[queue.status]}</span></div>
                    <h3 className="mt-4 text-lg font-semibold text-[#0B2D5C]">{queue.label}</h3>
                    <p className="mt-2 text-sm text-black">{queue.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0B2D5C]">View records <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-8 border-b border-[#C9CBCE] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C92027]">Selected queue</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-2xl font-semibold text-[#0B2D5C]">{activeQueue?.label}</h2><p className="mt-1 text-sm text-black">{activeQueue?.description}</p></div>
            <p className="text-lg font-semibold text-[#0B2D5C]">{visibleRequests.length} {visibleRequests.length === 1 ? 'record' : 'records'}</p>
          </div>
        </section>
      )}

      {loadError ? <p role="alert" className="mt-6 border border-[#C92027] bg-[#FFF5F4] p-4 text-[#8F1D1D]">{loadError}</p> : null}
      {!loadError && status && visibleRequests.length === 0 ? <section className="mt-6 border border-[#2E7D5B] bg-[#F0F8F4] px-6 py-12 text-center"><CheckCircle2 className="mx-auto h-11 w-11 text-[#2E7D5B]" /><h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">This queue is clear</h2><p className="mt-2 text-black">There are no {activeQueue?.label.toLowerCase()} records right now.</p></section> : null}

      {status ? <section className="mt-6 grid gap-5 lg:grid-cols-2" aria-label={`${activeQueue?.label ?? 'Founding Beta'} queue`}>
        {visibleRequests.map((request) => (
          <article key={request.id} className="border border-[#0B2D5C] bg-[#E6E6E7] p-5 shadow-[0_12px_32px_rgba(11,45,92,0.08)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C92027]">{request.status}</p><h2 className="mt-1 text-2xl font-semibold text-[#0B2D5C]">{request.firstName}</h2><a href={`mailto:${request.email}`} className="mt-1 block break-all text-sm text-[#0B2D5C] underline">{request.email}</a></div>
              <p className="text-xs text-[#5C636B]">{new Date(request.submittedAt).toLocaleString()}</p>
            </div>
            <dl className="mt-5 grid gap-4 border border-[#C9CBCE] bg-white p-4 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-[#5C636B]">Location</dt><dd className="mt-1 text-black">{request.location}</dd></div>
              <div><dt className="font-semibold text-[#5C636B]">Identity</dt><dd className="mt-1 text-black">{LABELS[request.gender] ?? request.gender}</dd></div>
              <div><dt className="font-semibold text-[#5C636B]">Interested in</dt><dd className="mt-1 text-black">{request.interestedIn.map((value) => LABELS[value] ?? value).join(' and ')}</dd></div>
              <div><dt className="font-semibold text-[#5C636B]">Looking for</dt><dd className="mt-1 text-black">{LABELS[request.relationshipGoal] ?? request.relationshipGoal}</dd></div>
              <div className="sm:col-span-2"><dt className="font-semibold text-[#5C636B]">How they heard about Forge</dt><dd className="mt-1 text-black">{request.heardAboutForge || 'Not provided'}</dd></div>
            </dl>
            {request.decisionNote ? <p className="mt-4 text-sm leading-relaxed text-black"><strong className="text-[#0B2D5C]">Private decision note:</strong> {request.decisionNote}</p> : null}
            {request.invitationSentAt ? <p className="mt-2 text-sm text-[#236548]">Invitation sent {new Date(request.invitationSentAt).toLocaleString()}</p> : null}
            {request.invitationDeliveryError ? <p className="mt-2 text-sm text-[#8F1D1D]">Last delivery error: {request.invitationDeliveryError}</p> : null}
            {request.status !== 'declined' ? <ReviewForm request={request} /> : null}
          </article>
        ))}
      </section> : null}
    </main>
  );
}
