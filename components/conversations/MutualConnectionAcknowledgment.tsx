'use client';

import Link from 'next/link';

import { stablePortraitGradient } from '@/lib/discovery/presentation';

type MutualConnectionAcknowledgmentProps = {
  firstName: string;
  photoUrl: string | null;
  alignmentSummary: string;
  alignmentLabel: string;
  profileHref: string;
  startHref: string;
  onStart?: () => void;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export default function MutualConnectionAcknowledgment({
  firstName,
  photoUrl,
  alignmentSummary,
  alignmentLabel,
  profileHref,
  startHref,
  onStart,
}: MutualConnectionAcknowledgmentProps) {
  const gradient = stablePortraitGradient(firstName);
  const initials = initialsFromName(firstName);

  return (
    <section className="mx-auto w-full max-w-lg px-4 py-8 sm:px-5">
      <div className="overflow-hidden rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.06)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-[1.25rem]">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- acknowledgment may use seed fixtures
              <img
                src={photoUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-white"
                style={{ backgroundImage: gradient, backgroundSize: 'cover' }}
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
          </div>

          <h2
            className="mt-6 text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            You and {firstName} would both like to get to know each other.
          </h2>

          <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">{alignmentSummary}</p>

          <div className="mt-5 w-full rounded-2xl border border-[#0B2D5C]/08 bg-[#FBF9F6] px-4 py-4 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
              Relationship Alignment
            </p>
            <p
              className="mt-1.5 text-base font-semibold text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {alignmentLabel}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {onStart ? (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
            >
              Start a conversation
            </button>
          ) : (
            <Link
              href={startHref}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
            >
              Start a conversation
            </Link>
          )}
          <Link
            href={profileHref}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
          >
            View profile
          </Link>
        </div>
      </div>
    </section>
  );
}
