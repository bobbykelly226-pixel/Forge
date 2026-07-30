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
import { createPortal } from 'react-dom';
import { ChevronDown, ImagePlus, MoreVertical, X } from 'lucide-react';

import {
  blockUserAction,
  endConnectionAction,
  reportUserAction,
  unblockUserAction,
} from '@/app/actions/conversations';
import {
  REPORT_EVIDENCE_BUCKET,
  REPORT_EVIDENCE_MAX_FILES,
  REPORT_REASON_OPTIONS,
} from '@/lib/conversations/constants';
import type { ReportReasonValue } from '@/lib/conversations/constants';
import type { ReportEvidenceInput } from '@/lib/conversations/types';
import {
  createReportEvidencePath,
  getReportEvidenceMimeType,
  sanitizeReportEvidenceName,
  validateReportEvidenceFiles,
} from '@/lib/safety/report-evidence';
import { createClient } from '@/lib/supabase/client';

type ConversationSafetyMenuProps = {
  peerUserId: string;
  peerFirstName: string;
  connectionId: string;
  conversationId: string;
  profileHref: string;
  blockedByViewer?: boolean;
  isSeed?: boolean;
  onEnded?: () => void;
  onBlocked?: () => void;
  onUnblocked?: () => void;
};

type DialogKind = 'end' | 'block' | 'unblock' | 'report' | null;

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
  focusConfirm = true,
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
  focusConfirm?: boolean;
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

    const focusTimer = window.setTimeout(() => {
      if (focusConfirm) {
        primaryRef.current?.focus();
      } else {
        panelRef.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
      }
    }, 30);

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [focusConfirm, open, onClose]);

  if (!open) return null;

  const confirmClasses =
    confirmTone === 'danger'
      ? 'bg-[#D62828] hover:bg-[#B82222]'
      : 'bg-[#0B2D5C] hover:bg-[#0A2540]';

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain p-3 sm:p-6"
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
        className="relative z-[91] my-auto w-full max-w-md overflow-hidden rounded-[1.75rem] bg-[#F8F6F2] shadow-[0_18px_60px_rgba(11,45,92,0.22)] outline-none"
      >
        <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain px-5 py-6 sm:max-h-[calc(100dvh-3rem)] sm:px-7 sm:py-7">
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
    </div>,
    document.body
  );
}

export default function ConversationSafetyMenu({
  peerUserId,
  peerFirstName,
  connectionId,
  conversationId,
  profileHref,
  blockedByViewer = false,
  isSeed = false,
  onEnded,
  onBlocked,
  onUnblocked,
}: ConversationSafetyMenuProps) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReasonValue>('unwanted_behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [reportEvidence, setReportEvidence] = useState<File[]>([]);
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
    setReportEvidence([]);
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

  const handleUnblock = async () => {
    setBusy(true);
    try {
      if (isSeed) {
        showFeedback(`${peerFirstName} has been unblocked. Messaging remains closed.`);
        onUnblocked?.();
        setDialog(null);
        return;
      }
      const result = await unblockUserAction(peerUserId);
      if (!result.success) {
        showFeedback(result.message ?? 'Could not unblock this person.');
        return;
      }
      showFeedback(`${peerFirstName} has been unblocked. Messaging remains closed.`);
      onUnblocked?.();
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  const removeUploadedEvidence = async (paths: string[]) => {
    if (!paths.length) return;
    const supabase = createClient();
    await supabase.storage.from(REPORT_EVIDENCE_BUCKET).remove(paths);
  };

  const handleReport = async () => {
    setBusy(true);
    const uploadedPaths: string[] = [];
    try {
      if (isSeed) {
        showFeedback('Report submitted. Thank you for helping keep Forge safe.');
        setDialog(null);
        return;
      }

      const validationMessage = validateReportEvidenceFiles(reportEvidence);
      if (validationMessage) {
        showFeedback(validationMessage);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showFeedback('You must be signed in to submit a report.');
        return;
      }

      const submissionId = crypto.randomUUID();
      const evidence: ReportEvidenceInput[] = [];
      for (const file of reportEvidence) {
        const mimeType = getReportEvidenceMimeType(file);
        if (!mimeType) {
          showFeedback('Choose a JPG, PNG, WebP, HEIC, or HEIF image.');
          await removeUploadedEvidence(uploadedPaths);
          return;
        }
        const storagePath = createReportEvidencePath(
          user.id,
          submissionId,
          crypto.randomUUID(),
          file.name
        );
        const { error } = await supabase.storage
          .from(REPORT_EVIDENCE_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '0',
            contentType: mimeType,
            upsert: false,
          });
        if (error) {
          await removeUploadedEvidence(uploadedPaths);
          showFeedback('A screenshot could not be uploaded. Please try again.');
          return;
        }
        uploadedPaths.push(storagePath);
        evidence.push({
          storage_path: storagePath,
          file_name: sanitizeReportEvidenceName(file.name),
          mime_type: mimeType,
          file_size: file.size,
        });
      }

      const result = await reportUserAction({
        reportedUserId: peerUserId,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
        conversationId,
        evidence,
      });
      if (!result.success) {
        await removeUploadedEvidence(uploadedPaths);
        showFeedback(result.message ?? 'Could not submit your report.');
        return;
      }
      if (result.data?.duplicate) {
        await removeUploadedEvidence(uploadedPaths);
        showFeedback('You already submitted this report. The original remains on file.');
        setDialog(null);
        return;
      }
      showFeedback('Report submitted. Thank you for helping keep Forge safe.');
      setReportEvidence([]);
      setDialog(null);
    } catch {
      await removeUploadedEvidence(uploadedPaths);
      showFeedback('Could not submit your report. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleEvidenceSelection = (files: File[]) => {
    const next = [...reportEvidence, ...files].slice(0, REPORT_EVIDENCE_MAX_FILES);
    const validationMessage = validateReportEvidenceFiles(next);
    if (validationMessage) {
      showFeedback(validationMessage);
      return;
    }
    if (reportEvidence.length + files.length > REPORT_EVIDENCE_MAX_FILES) {
      showFeedback(`You can attach up to ${REPORT_EVIDENCE_MAX_FILES} screenshots.`);
    }
    setReportEvidence(next);
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
            {!blockedByViewer ? (
              <>
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
              </>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-3 text-left text-sm font-medium text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
                onClick={() => {
                  setMenuOpen(false);
                  setDialog('unblock');
                }}
              >
                Unblock
              </button>
            )}
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
        description={`Ending your connection with ${peerFirstName} makes this conversation read-only for both of you. You will both keep the existing messages, photos, and files, but neither person can send anything new.`}
        confirmLabel="End connection"
        confirmTone="danger"
        busy={busy}
        onClose={closeDialog}
        onConfirm={handleEnd}
      />

      <SafetyDialog
        open={dialog === 'block'}
        title={`Block ${peerFirstName}?`}
        description={`Blocking ends the connection immediately. ${peerFirstName} will lose access to your profile, this conversation, its photos and files, and related notifications. You will keep the history for reporting or documentation.`}
        confirmLabel="Block"
        confirmTone="danger"
        busy={busy}
        onClose={closeDialog}
        onConfirm={handleBlock}
      />

      <SafetyDialog
        open={dialog === 'unblock'}
        title={`Unblock ${peerFirstName}?`}
        description={`Unblocking restores access to the existing history and profile when otherwise available. It does not reconnect you or reopen messaging.`}
        confirmLabel="Unblock"
        busy={busy}
        onClose={closeDialog}
        onConfirm={handleUnblock}
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
        focusConfirm={false}
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
              autoFocus
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-3 text-[15px] leading-relaxed text-[#0B2D5C] outline-none focus:border-[#0B2D5C]/35"
              placeholder="Share any context that may help our review."
            />
          </label>
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#0B2D5C]">
                Screenshots <span className="font-normal text-[#8A93A0]">(optional)</span>
              </span>
              <span className="text-xs text-[#8A93A0]">
                {reportEvidence.length}/{REPORT_EVIDENCE_MAX_FILES}
              </span>
            </div>
            <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0B2D5C]/25 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C]/40 hover:bg-[#F8F6F2]">
              <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Add screenshots
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                disabled={busy || reportEvidence.length >= REPORT_EVIDENCE_MAX_FILES}
                onChange={(event) => {
                  handleEvidenceSelection(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
            </label>
            {reportEvidence.length ? (
              <ul className="mt-3 space-y-2">
                {reportEvidence.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#0B2D5C]/10 bg-white px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-xs text-[#5A6575]">{file.name}</span>
                    <button
                      type="button"
                      className="shrink-0 rounded-full p-1 text-[#7A8494] transition hover:bg-[#F8F6F2] hover:text-[#D62828]"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setReportEvidence((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-[#7A8494]">
              Up to three images, 5 MB each. Evidence is private and available only to Forge
              safety reviewers.
            </p>
          </div>
        </div>
      </SafetyDialog>
    </>
  );
}
