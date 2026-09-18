'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { CheckCircle2, Clock3, Mail, ShieldCheck, UserCheck, UserX } from 'lucide-react';

import {
  reviewFoundingBetaRequestAction,
  type FoundingBetaReviewState,
} from '@/app/actions/founding-beta-review';
import type { FoundingBetaRequest } from '@/lib/operator/founding-beta';

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

export default function FoundingBetaWorkspace({ requests, loadError }: { requests: FoundingBetaRequest[]; loadError?: string | null }) {
  const counts = {
    pending: requests.filter((item) => item.status === 'pending').length,
    invited: requests.filter((item) => item.status === 'invited').length,
    approved: requests.filter((item) => item.status === 'approved').length,
    declined: requests.filter((item) => item.status === 'declined').length,
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 border border-[#0B2D5C]/15 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]"><ShieldCheck className="h-4 w-4 text-[#C92027]" /> MFA-protected administrator workspace</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#0B2D5C] sm:text-5xl">Founding Beta requests</h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-[#5C636B]">Review requests, build a balanced first cohort, and issue personal seven-day invitations. Submission details are private.</p>
        </div>
        <Link href="/internal" className="border border-[#0B2D5C] bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]">Administrator Home</Link>
      </header>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Request counts">
        {[
          ['Pending', counts.pending, Clock3], ['Invited', counts.invited, Mail], ['Approved, email pending', counts.approved, UserCheck], ['Declined', counts.declined, UserX],
        ].map(([label, count, Icon]) => {
          const CountIcon = Icon as typeof Clock3;
          return <div key={String(label)} className="border border-[#0B2D5C]/15 bg-white p-4"><CountIcon className="h-5 w-5 text-[#C92027]" /><p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">{String(count)}</p><p className="mt-1 text-xs text-[#5C636B]">{String(label)}</p></div>;
        })}
      </section>

      {loadError ? <p role="alert" className="mt-6 border border-[#C92027] bg-[#FFF5F4] p-4 text-[#8F1D1D]">{loadError}</p> : null}
      {!loadError && requests.length === 0 ? <section className="mt-6 border border-[#2E7D5B] bg-[#F0F8F4] px-6 py-12 text-center"><CheckCircle2 className="mx-auto h-11 w-11 text-[#2E7D5B]" /><h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">No requests yet</h2><p className="mt-2 text-black">Share the Founding Beta request page to begin building the cohort.</p></section> : null}

      <section className="mt-6 grid gap-5 lg:grid-cols-2" aria-label="Founding Beta request queue">
        {requests.map((request) => (
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
      </section>
    </main>
  );
}
