'use client';

import Link from 'next/link';
import { useCallback, useId, useRef, useState, type ReactNode } from 'react';

import AlignmentDetailsDrawer from '@/components/AlignmentDetailsDrawer';
import PublicCharacterSignalsSection from '@/components/character-signals/PublicCharacterSignalsSection';
import DiscoveryActionTiles from '@/components/discovery/DiscoveryActionTiles';
import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';
import ImportantAlignmentFactorsDrawer from '@/components/ImportantAlignmentFactorsDrawer';

const PROFILE_ID = 'jessica';
const PROFILE_NAME = 'Jessica';

const GALLERY = [
  {
    id: 'g1',
    label: 'Additional profile photo one',
    gradient: 'linear-gradient(145deg, #2A4060 0%, #8FA3BC 45%, #D9C4B0 100%)',
  },
  {
    id: 'g2',
    label: 'Additional profile photo two',
    gradient: 'linear-gradient(160deg, #3D2C29 0%, #A67C6D 50%, #E8D5C4 100%)',
  },
  {
    id: 'g3',
    label: 'Additional profile photo three',
    gradient: 'linear-gradient(135deg, #1F3A5F 0%, #5C7A99 48%, #C5B7A5 100%)',
  },
  {
    id: 'g4',
    label: 'Additional profile photo four',
    gradient: 'linear-gradient(150deg, #243447 0%, #6B7F8F 42%, #C9B8A6 100%)',
  },
] as const;

const PROFILE_DETAILS = [
  { label: 'Relationship Goal', value: 'Marriage-minded' },
  { label: 'Children', value: 'Wants children' },
  { label: 'Has Children', value: 'No' },
  { label: 'Faith', value: 'Important' },
  { label: 'Education', value: 'College graduate' },
  { label: 'Pets', value: 'Loves dogs' },
  { label: 'Smoking', value: 'Non-smoker' },
  { label: 'Drinking', value: 'Occasionally' },
  { label: 'Career', value: 'Healthcare professional' },
  { label: 'Relocation', value: 'Open to the right situation' },
  { label: 'Service Background', value: 'Community volunteer' },
] as const;

const cardClassName =
  'rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.06)] backdrop-blur-sm sm:p-7';

function SectionReveal({
  children,
  delayMs = 0,
}: {
  children: ReactNode;
  delayMs?: number;
}) {
  return (
    <div
      style={{
        animation: 'discoveryFadeUp 0.55s ease-out both',
        animationDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function DiscoveryProfilePrototype() {
  const [pressedAction, setPressedAction] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [alignmentDrawerOpen, setAlignmentDrawerOpen] = useState(false);
  const [factorsDrawerOpen, setFactorsDrawerOpen] = useState(false);
  const { isPassed } = useDiscoveryActions();
  const detailsPanelId = useId();
  const alignmentTriggerRef = useRef<HTMLButtonElement>(null);
  const factorsTriggerRef = useRef<HTMLButtonElement>(null);

  const flashPress = (action: string) => {
    setPressedAction(action);
    window.setTimeout(() => setPressedAction(null), 450);
  };

  const openAlignmentDrawer = () => {
    setFactorsDrawerOpen(false);
    setAlignmentDrawerOpen(true);
  };

  const closeAlignmentDrawer = useCallback(() => {
    setAlignmentDrawerOpen(false);
    window.requestAnimationFrame(() => {
      alignmentTriggerRef.current?.focus();
    });
  }, []);

  const openFactorsDrawer = () => {
    setAlignmentDrawerOpen(false);
    setFactorsDrawerOpen(true);
  };

  const closeFactorsDrawer = useCallback(() => {
    setFactorsDrawerOpen(false);
    window.requestAnimationFrame(() => {
      factorsTriggerRef.current?.focus();
    });
  }, []);

  if (isPassed(PROFILE_ID)) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-8">
        <div className="rounded-[2rem] border border-[#0B2D5C]/08 bg-white/90 px-8 py-16 text-center shadow-[0_16px_44px_rgba(11,45,92,0.06)]">
          <h1
            className="text-2xl tracking-[-0.01em] text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Introduction passed.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
            {PROFILE_NAME} was removed from your current introductions. Refresh the page to restore
            this prototype profile.
          </p>
          <Link
            href="/discovery"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
          >
            Return to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes discoveryFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes discoveryPhotoIn {
          from {
            opacity: 0;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-8">
        <SectionReveal>
          <div className="mb-6 flex items-start justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-[#0B2D5C]/70 transition hover:text-[#D62828]"
            >
              ← Back
            </Link>
            <p className="rounded-full border border-[#0B2D5C]/12 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B2D5C]/65">
              Design prototype
            </p>
          </div>
        </SectionReveal>

        {/* 1–2. Identity */}
        <SectionReveal delayMs={40}>
          <header>
            <h1
              className="text-[2.35rem] leading-none tracking-[-0.02em] text-[#0B2D5C] sm:text-5xl"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Jessica, 29
            </h1>
            <p className="mt-3 text-base text-[#5A6575] sm:text-lg">Denver, Colorado</p>
          </header>
        </SectionReveal>

        {/* 3. Relationship Alignment */}
        <SectionReveal delayMs={100}>
          <section className={`${cardClassName} mt-7`} aria-labelledby="alignment-title">
            <p
              id="alignment-title"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]"
            >
              Relationship Alignment
            </p>
            <h2
              className="mt-3 text-2xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.65rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Promising Alignment
            </h2>

            <div className="mt-5 border-t border-[#0B2D5C]/06 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                Confidence
              </p>
              <p className="mt-1.5 text-lg font-semibold text-[#0B2D5C]">Moderate</p>
            </div>

            <p className="mt-5 text-[15px] leading-relaxed text-[#5A6575]">
              Based on shared values, life goals, and completed compatibility questions.
            </p>

            <button
              ref={alignmentTriggerRef}
              type="button"
              onClick={openAlignmentDrawer}
              className="mt-6 -mx-2 inline-flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-2xl px-2 py-3 text-left text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/04 hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
              aria-haspopup="dialog"
              aria-expanded={alignmentDrawerOpen}
            >
              <span>See why you align</span>
              <span aria-hidden="true">→</span>
            </button>
          </section>
        </SectionReveal>

        {/* 4. Important Alignment Factors */}
        <SectionReveal delayMs={160}>
          <button
            ref={factorsTriggerRef}
            type="button"
            onClick={openFactorsDrawer}
            aria-haspopup="dialog"
            aria-expanded={factorsDrawerOpen}
            aria-labelledby="alignment-factors-title"
            className="mt-4 w-full rounded-[1.75rem] border-2 border-[#D62828] bg-[#FBF6EE] p-6 text-left shadow-[0_8px_28px_rgba(214,40,40,0.08)] transition hover:shadow-[0_10px_32px_rgba(214,40,40,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D62828] sm:p-7"
          >
            <div className="flex gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-sm font-bold text-white"
                aria-hidden="true"
              >
                !
              </span>
              <div>
                <span
                  id="alignment-factors-title"
                  className="block text-lg font-semibold tracking-tight text-[#0B2D5C]"
                >
                  Important Alignment Factors
                </span>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5A6575]">
                  One important life preference may differ.
                </p>
                <p className="mt-4 text-sm font-semibold text-[#0B2D5C]">
                  Tap to review the details
                  <span aria-hidden="true"> →</span>
                </p>
              </div>
            </div>
          </button>
        </SectionReveal>

        {/* 5. Main Portrait */}
        <SectionReveal delayMs={220}>
          <div className="mt-8 overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(11,45,92,0.14)]">
            <div
              className="relative aspect-[3/4] w-full"
              style={{
                background:
                  'linear-gradient(160deg, #1B2F4A 0%, #3E566F 38%, #A8927D 72%, #E6D5C3 100%)',
                animation: 'discoveryPhotoIn 0.9s ease-out both',
              }}
              role="img"
              aria-label="Jessica, main placeholder portrait"
            >
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 70% 70%, rgba(11,45,92,0.25), transparent 48%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2D5C]/45 via-[#0B2D5C]/10 to-transparent px-6 pb-6 pt-24">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                  Main portrait
                </p>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* 6. Additional Photos */}
        <SectionReveal delayMs={280}>
          <section className="mt-5" aria-labelledby="gallery-title">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2
                id="gallery-title"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]"
              >
                Additional Photos
              </h2>
              <p className="text-xs text-[#8A93A0]">Tap to preview</p>
            </div>
            <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GALLERY.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => flashPress(`gallery-${photo.id}`)}
                  className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(11,45,92,0.1)] transition duration-300 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] sm:h-40 sm:w-32"
                  style={{ background: photo.gradient }}
                  aria-label={photo.label}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#0B2D5C]">
                    {index + 1}
                  </span>
                </button>
              ))}
            </div>
            {pressedAction?.startsWith('gallery-') && (
              <p className="mt-2 text-xs text-[#7A8494]">Prototype only — no photo viewer yet.</p>
            )}
          </section>
        </SectionReveal>

        {/* 7. About */}
        <SectionReveal delayMs={320}>
          <section className="mt-9" aria-labelledby="bio-title">
            <h2
              id="bio-title"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]"
            >
              About
            </h2>
            <p className="mt-4 text-[16px] leading-[1.75] text-[#3D4654]">
              I am grounded, family-oriented, and happiest when I am building a meaningful life with
              the people I care about. I value faith, honesty, laughter, and showing up when it
              matters.
            </p>
          </section>
        </SectionReveal>

        {/* 8. More About Jessica (expandable) */}
        <SectionReveal delayMs={360}>
          <section className={`${cardClassName} mt-6`} aria-labelledby="more-about-title">
            <button
              type="button"
              id="more-about-title"
              aria-expanded={detailsOpen}
              aria-controls={detailsPanelId}
              onClick={() => setDetailsOpen((open) => !open)}
              className="flex w-full items-start justify-between gap-4 text-left"
            >
              <span>
                <span
                  className="block text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.35rem]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  {detailsOpen ? 'Hide Profile Details' : 'More About Jessica'}
                </span>
                {!detailsOpen && (
                  <span className="mt-2 block text-sm leading-relaxed text-[#7A8494]">
                    View lifestyle, family, education, and relationship details
                  </span>
                )}
              </span>
              <span
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/12 bg-[#F8F6F2] text-[#0B2D5C] transition-transform duration-300 ${
                  detailsOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              >
                ⌄
              </span>
            </button>

            <div
              id={detailsPanelId}
              role="region"
              aria-labelledby="more-about-title"
              aria-hidden={!detailsOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                detailsOpen
                  ? 'mt-6 grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className={`min-h-0 overflow-hidden ${detailsOpen ? '' : 'pointer-events-none'}`}>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {PROFILE_DETAILS.map((detail) => (
                    <div
                      key={detail.label}
                      className="rounded-2xl bg-[#F8F6F2]/80 px-4 py-3.5"
                    >
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                        {detail.label}
                      </dt>
                      <dd className="mt-1.5 text-[15px] font-medium leading-snug text-[#0B2D5C]">
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs text-[#8A93A0]">
                  Placeholder details only — not connected to a live profile.
                </p>
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* 9. Why Forge surfaced */}
        <SectionReveal delayMs={400}>
          <section className={`${cardClassName} mt-4`} aria-labelledby="why-title">
            <h2
              id="why-title"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-2xl"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Why Forge surfaced this profile
            </h2>

            <div className="mt-6 space-y-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                  Strong alignment
                </p>
                <ul className="space-y-2.5">
                  {['Relationship Intent', 'Family Goals', 'Lifestyle Priorities'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-[#2C3644]">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2D5C]/08 text-[11px] font-bold text-[#0B2D5C]"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#0B2D5C]/06 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                  Growing alignment
                </p>
                <ul className="space-y-2 text-[15px] text-[#5A6575]">
                  <li className="flex gap-2">
                    <span className="text-[#0B2D5C]/35">•</span> Faith
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#0B2D5C]/35">•</span> Communication Style
                  </li>
                </ul>
              </div>

              <div className="border-t border-[#0B2D5C]/06 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                  Needs more information
                </p>
                <ul className="space-y-2 text-[15px] text-[#5A6575]">
                  <li className="flex gap-2">
                    <span className="text-[#0B2D5C]/35">•</span> Conflict Resolution
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* 10. Character Signals */}
        <SectionReveal delayMs={440}>
          <PublicCharacterSignalsSection cardClassName={cardClassName} />
        </SectionReveal>

        {/* 11. Actions */}
        <SectionReveal delayMs={480}>
          <section className="mt-10" aria-label="Discovery actions">
            <DiscoveryActionTiles
              profileId={PROFILE_ID}
              profileName={PROFILE_NAME}
              layout="profile-stack"
            />
          </section>
        </SectionReveal>

        <p className="mt-12 text-center text-xs leading-relaxed text-[#8A93A0]">
          Forge Discovery Profile — UI/UX prototype.
          <br />
          No matching, scoring, messaging, or live data.
        </p>
      </div>

      <AlignmentDetailsDrawer
        open={alignmentDrawerOpen}
        onClose={closeAlignmentDrawer}
        profileName={PROFILE_NAME}
      />
      <ImportantAlignmentFactorsDrawer
        open={factorsDrawerOpen}
        onClose={closeFactorsDrawer}
        profileName={PROFILE_NAME}
      />
    </>
  );
}
