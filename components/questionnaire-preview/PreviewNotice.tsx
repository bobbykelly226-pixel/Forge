'use client';

type PreviewNoticeProps = {
  className?: string;
};

export default function PreviewNotice({ className = '' }: PreviewNoticeProps) {
  return (
    <p
      role="status"
      className={`rounded-xl border border-[color-mix(in_srgb,var(--forge-silver)_55%,transparent)] bg-[var(--forge-surface-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--forge-graphite)] ${className}`}
    >
      Preview mode. Your answers are not being saved yet.
    </p>
  );
}
