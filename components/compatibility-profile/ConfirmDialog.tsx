'use client';

type ConfirmDialogProps = {
  heading: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export default function ConfirmDialog({
  heading,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="compatibility-confirm-title"
      aria-describedby="compatibility-confirm-description"
      className="rounded-2xl border border-[color-mix(in_srgb,var(--forge-navy)_25%,var(--forge-silver))] bg-[var(--forge-surface-soft)] px-5 py-4"
    >
      <p
        id="compatibility-confirm-title"
        className="text-base font-semibold text-[var(--forge-navy)]"
      >
        {heading}
      </p>
      <p
        id="compatibility-confirm-description"
        className="mt-2 text-sm leading-relaxed text-[#3A4556]"
      >
        {body}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="forge-btn-primary inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] disabled:opacity-45"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] disabled:opacity-45"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
