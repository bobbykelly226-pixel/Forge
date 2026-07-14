'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  EyeOff,
  Handshake,
  Heart,
  MessageSquareOff,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

type HowCharacterSignalsWorkDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const PRINCIPLES: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: 'Positive recognition only',
    description: 'Character Signals celebrate respectful behavior — never ratings or criticism.',
    icon: Heart,
  },
  {
    title: 'Multiple independent confirmations',
    description: 'A signal becomes eligible only after several people recognize the same quality.',
    icon: Users,
  },
  {
    title: 'Recipient controls public display',
    description: 'You choose what appears on your profile. Nothing is automatic.',
    icon: EyeOff,
  },
  {
    title: 'No public written reviews',
    description: 'There are no comments, star ratings, or public testimonials.',
    icon: MessageSquareOff,
  },
  {
    title: 'No negative badges',
    description: 'Character Signals never display negative traits or popularity scores.',
    icon: Handshake,
  },
  {
    title: 'Safety reports are handled separately',
    description: 'Reporting and blocking remain a separate path from Character Signals.',
    icon: ShieldCheck,
  },
];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export default function HowCharacterSignalsWorkDrawer({
  open,
  onClose,
}: HowCharacterSignalsWorkDrawerProps) {
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

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6"
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
        className="relative z-[86] flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] bg-[#F8F6F2] shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:max-h-[88vh] sm:rounded-[1.75rem]"
      >
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-7">
          <h2
            id={titleId}
            className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            How Character Signals Work
          </h2>
          <p id={descriptionId} className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
            Character Signals highlight positive qualities others have independently noticed after
            meaningful interactions. They support Discovery Profiles — they are not ratings,
            reviews, or a progression system.
          </p>

          <ul className="mt-6 space-y-3">
            {PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <li
                  key={principle.title}
                  className="flex items-start gap-3 rounded-2xl border border-[#0B2D5C]/08 bg-white/80 px-4 py-3.5"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#5B6B7C]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0B2D5C]">{principle.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5A6575]">
                      {principle.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-[15px] leading-relaxed text-[#0B2D5C]">
            Character Signals are designed to encourage respectful dating, not judge someone&apos;s
            worth.
          </p>

          <button
            ref={primaryRef}
            type="button"
            onClick={onClose}
            className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
