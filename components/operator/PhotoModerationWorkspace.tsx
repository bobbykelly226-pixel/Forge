'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';

import {
  moderateProfilePhotoAction,
} from '@/app/actions/photo-moderation';
import type { PhotoModerationActionState } from '@/app/actions/photo-moderation';
import type { OperatorPhotoReviewItem } from '@/lib/operator/photo-moderation';

const INITIAL_PHOTO_MODERATION_ACTION_STATE: PhotoModerationActionState = {
  success: false,
  message: '',
};

function PendingPhotoCard({ photo }: { photo: OperatorPhotoReviewItem }) {
  const [state, formAction, pending] = useActionState(
    moderateProfilePhotoAction,
    INITIAL_PHOTO_MODERATION_ACTION_STATE
  );

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white shadow-[0_16px_45px_rgba(11,45,92,0.07)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(22rem,1.1fr)]">
        <div className="relative min-h-[24rem] bg-[#0B2D5C]">
          {/* Signed private URL; browser optimization is intentionally bypassed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.signedUrl}
            alt={`Pending profile photo for ${photo.ownerName}`}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        <form action={formAction} className="flex flex-col p-5 sm:p-7">
          <input type="hidden" name="photo_id" value={photo.id} />

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Pending review
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0B2D5C]">
                {photo.ownerName}
              </h2>
              <p className="mt-1 text-sm text-[#657184]">
                {photo.ownerLocation || 'Location not provided'} · Photo {photo.displayOrder + 1}
                {photo.isPrimary ? ' · Primary' : ''}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C98A14]/20 bg-[#FFF8E8] px-3 py-1.5 text-xs font-semibold text-[#8A5B06]">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Awaiting decision
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-[#0B2D5C]/08 bg-[#F5F7FA] p-4 text-xs leading-relaxed text-[#5A6575]">
            <p>
              Uploaded {new Date(photo.uploadedAt).toLocaleString()} · Member {photo.ownerId.slice(0, 8)}
            </p>
            <p className="mt-1 break-all font-mono text-[11px] text-[#738093]">
              {photo.storagePath}
            </p>
          </div>

          <div className="mt-6">
            <label htmlFor={`reason-${photo.id}`} className="text-sm font-semibold text-[#0B2D5C]">
              Rejection reason
            </label>
            <p className="mt-1 text-xs leading-relaxed text-[#687384]">
              Required only when rejecting. Keep the reason factual and useful for safe replacement.
            </p>
            <textarea
              id={`reason-${photo.id}`}
              name="rejection_reason"
              maxLength={500}
              rows={4}
              disabled={pending}
              className="mt-3 w-full resize-y rounded-2xl border border-[#0B2D5C]/14 bg-white px-4 py-3 text-sm text-[#1A2332] outline-none transition placeholder:text-[#9AA3AF] focus:border-[#0B2D5C]/45 focus:ring-2 focus:ring-[#0B2D5C]/10 disabled:opacity-60"
              placeholder="Example: Photo is too dark to clearly identify the member."
            />
          </div>

          {state.message ? (
            <p
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                state.success
                  ? 'border-[#2E7D5B]/20 bg-[#F0F8F4] text-[#236548]'
                  : 'border-[#B42318]/20 bg-[#FFF5F4] text-[#9B1C1C]'
              }`}
              role={state.success ? 'status' : 'alert'}
            >
              {state.message}
            </p>
          ) : null}

          <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
            <button
              type="submit"
              name="decision"
              value="rejected"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D62828]/25 bg-white px-5 py-3.5 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF5F4] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {pending ? 'Saving…' : 'Reject photo'}
            </button>
            <button
              type="submit"
              name="decision"
              value="approved"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(11,45,92,0.18)] transition hover:bg-[#123E78] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {pending ? 'Saving…' : 'Approve photo'}
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

export default function PhotoModerationWorkspace({
  photos,
  loadError,
}: {
  photos: OperatorPhotoReviewItem[];
  loadError?: string | null;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]">
            <ShieldCheck className="h-4 w-4 text-[#D62828]" aria-hidden="true" />
            Operator only
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#0B2D5C] sm:text-5xl">
            Photo moderation
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#5A6575]">
            Review every new or replaced profile photo before it can appear to another member.
          </p>
        </div>
        <Link
          href="/internal/operator-security"
          className="inline-flex w-fit items-center justify-center rounded-2xl border border-[#0B2D5C]/14 bg-white/80 px-4 py-3 text-sm font-semibold text-[#0B2D5C] transition hover:bg-white"
        >
          Account security
        </Link>
      </div>

      <section className="mt-8 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/70 p-5 shadow-[0_12px_35px_rgba(11,45,92,0.04)] sm:p-6">
        <p className="text-sm font-semibold text-[#0B2D5C]">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} awaiting review
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#687384]">
          Decisions are recorded with the operator account, timestamp, outcome, and rejection reason.
        </p>
      </section>

      {loadError ? (
        <p className="mt-6 rounded-2xl border border-[#B42318]/20 bg-[#FFF5F4] px-5 py-4 text-sm text-[#9B1C1C]" role="alert">
          {loadError}
        </p>
      ) : null}

      {!loadError && photos.length === 0 ? (
        <section className="mt-6 rounded-[1.75rem] border border-[#2E7D5B]/15 bg-[#F2F8F5] px-6 py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#2E7D5B]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">The queue is clear</h2>
          <p className="mt-2 text-sm text-[#5A6575]">No profile photos are currently waiting for review.</p>
        </section>
      ) : null}

      <div className="mt-6 space-y-6">
        {photos.map((photo) => (
          <PendingPhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
    </main>
  );
}
