'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { ChevronDown, MoreVertical } from 'lucide-react';

import {
  blockUserAction,
  endConnectionAction,
  reportUserAction,
} from '@/app/actions/conversations';
import { REPORT_REASON_OPTIONS } from '@/lib/conversations/constants';
import type { ReportReasonValue } from '@/lib/conversations/constants';

type ConversationSafetyMenuProps = {
  peerUserId: string;
  peerFirstName: string;
  connectionId: string;
  conversationId: string;
  profileHref: string;
  isSeed?: boolean;
  onEnded?: () => void;
  onBlocked?: () => void;
};

type DialogKind = 'end' | 'block' | 'report' | null;

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

function SafetyDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmTone = 'primary',
  busy,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: 'primary' | 'danger';
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => primaryRef.current?.focus(), 30);

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const confirmClasses =
    confirmTone === 'danger'
      ? 'bg-[#D62828] hover:bg-[#B82222]'
      : 'bg-[#0B2D5C] hover:bg-[#0A2540]';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[#0B2D5C]/45 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative z-[91] w-full max-w-md overflow-hidden rounded-t-[1.75rem] bg-[#F8F6F2] shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:rounded-[1.75rem]"
      >
        <div className="max-h-[88vh] overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          <h2
            id={titleId}
            className="text-[1.35rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            {title}
          </h2>
          <p id={descriptionId} className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
            {description}
          </p>
          {children}
          <div className="mt-6 flex flex-col gap-3">
            <button
              ref={primaryRef}
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-base font-semibold text-white transition disabled:opacity-60 ${confirmClasses}`}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConversationSafetyMenu({
  peerUserId,
  peerFirstName,
  connectionId,
  conversationId,
  profileHref,
  isSeed = false,
  onEnded,
  onBlocked,
}: ConversationSafetyMenuProps) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReasonValue>('unwanted_behavior');
  const [reportDetails, setReportDetails] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setReportDetails('');
    setReportReason('unwanted_behavior');
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const handleEnd = async () => {
    setBusy(true);
    try {
      if (isSeed) {
        showFeedback('Connection ended.');
        onEnded?.();
        setDialog(null);
        return;
      }
      const result = await endConnectionAction(connectionId);
      if (!result.success) {
        showFeedback(result.message ?? 'Could not end this connection.');
        return;
      }
      showFeedback('Connection ended.');
      onEnded?.();
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = async () => {
    setBusy(true);
    try {
      if (isSeed) {
        showFeedback(`${peerFirstName} has been blocked.`);
        onBlocked?.();
        setDialog(null);
        return;
      }
      const result = await blockUserAction(peerUserId);
      if (!result.success) {
        showFeedback(result.message ?? 'Could not block this person.');
        return;
      }
      showFeedback(`${peerFirstName} has been blocked.`);
      onBlocked?.();
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  const handleReport = async () => {
    setBusy(true);
    try {
      if (isSeed) {
        showFeedback('Report submitted. Thank you for helping keep Forge safe.');
        setDialog(null);
        return;
      }
      const result = await reportUserAction({
        reportedUserId: peerUserId,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
        conversationId,
      });
      if (!result.success) {
        showFeedback(result.message ?? 'Could not submit your report.');
        return;
      }
      showFeedback('Report submitted. Thank you for helping keep Forge safe.');
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0B2D5C]/12 bg-white text-[#0B2D5C] transition hover:border-[#0B2D5C]/25 hover:bg-[#F8F6F2]"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label="Conversation options"
        >
          <MoreVertical className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>

        {menuOpen ? (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-[#0B2D5C]/10 bg-white py-1 shadow-[0_12px_40px_rgba(11,45,92,0.12)]"
          >
            <Link
              href={profileHref}
              role="menuitem"
              className="block px-4 py-3 text-sm font-medium text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
              onClick={() => setMenuOpen(false)}
            >
              View profile
            </Link>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-3 text-left text-sm font-medium text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
              onClick={() => {
                setMenuOpen(false);
                setDialog('end');
              }}
            >
              End connection
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-3 text-left text-sm font-medium text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
              onClick={() => {
                setMenuOpen(false);
                setDialog('block');
              }}
            >
              Block
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-3 text-left text-sm font-medium text-[#D62828] transition hover:bg-[#F8F6F2]"
              onClick={() => {
                setMenuOpen(false);
                setDialog('report');
              }}
            >
              Report
            </button>
          </div>
        ) : null}
      </div>

      {feedback ? (
        <div
          className="fixed inset-x-4 top-4 z-[95] mx-auto max-w-md rounded-2xl border border-[#0B2D5C]/10 bg-white px-4 py-3 text-center text-sm font-medium text-[#0B2D5C] shadow-lg"
          role="status"
        >
          {feedback}
        </div>
      ) : null}

      <SafetyDialog
        open={dialog === 'end'}
        title="End connection?"
        description={`Ending your connection with ${peerFirstName} closes messaging between you. Your profiles remain visible in Forge, but you will no longer be able to message each other.`}
        confirmLabel="End connection"
        confirmTone="danger"
        busy={busy}
        onClose={closeDialog}
        onConfirm={handleEnd}
      />

      <SafetyDialog
        open={dialog === 'block'}
        title={`Block ${peerFirstName}?`}
        description={`Blocking ends your connection and prevents future contact. ${peerFirstName} will not be able to message you or appear in your Discovery results.`}
        confirmLabel="Block"
        confirmTone="danger"
        busy={busy}
        onClose={closeDialog}
        onConfirm={handleBlock}
      />

      <SafetyDialog
        open={dialog === 'report'}
        title={`Report ${peerFirstName}`}
        description="Reports are reviewed by Forge. Reporting does not automatically block this person — you can block separately if you need to."
        confirmLabel="Submit report"
        confirmTone="danger"
        busy={busy}
        onClose={closeDialog}
        onConfirm={handleReport}
      >
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-[#0B2D5C]">Reason</span>
            <div className="relative mt-2">
              <select
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value as ReportReasonValue)}
                className="w-full appearance-none rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-3 pr-10 text-[15px] text-[#0B2D5C] outline-none focus:border-[#0B2D5C]/35"
              >
                {REPORT_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8494]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#0B2D5C]">
              Additional details <span className="font-normal text-[#8A93A0]">(optional)</span>
            </span>
            <textarea
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-3 text-[15px] leading-relaxed text-[#0B2D5C] outline-none focus:border-[#0B2D5C]/35"
              placeholder="Share any context that may help our review."
            />
          </label>
        </div>
      </SafetyDialog>
    </>
  );
}
