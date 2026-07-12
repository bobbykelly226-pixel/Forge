'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

/**
 * Design-only Discovery Profile prototype.
 * No Supabase, matching, messaging, scoring, or live actions.
 */

const GALLERY = [
  {
    id: 'g1',
    label: 'Portrait one',
    gradient: 'linear-gradient(145deg, #2A4060 0%, #8FA3BC 45%, #D9C4B0 100%)',
  },
  {
    id: 'g2',
    label: 'Portrait two',
    gradient: 'linear-gradient(160deg, #3D2C29 0%, #A67C6D 50%, #E8D5C4 100%)',
  },
  {
    id: 'g3',
    label: 'Portrait three',
    gradient: 'linear-gradient(135deg, #1F3A5F 0%, #5C7A99 48%, #C5B7A5 100%)',
  },
  {
    id: 'g4',
    label: 'Portrait four',
    gradient: 'linear-gradient(150deg, #243447 0%, #6B7F8F 42%, #C9B8A6 100%)',
  },
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
        animation: 'discoveryFadeUp 0.7s ease-out both',
        animationDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function DiscoveryProfilePrototype() {
  const [pressedAction, setPressedAction] = useState<string | null>(null);

  const flashPress = (action: string) => {
    setPressedAction(action);
    window.setTimeout(() => setPressedAction(null), 450);
  };

  return (
    <>
      <style>{`
        @keyframes discoveryFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes discoveryPhotoIn {
          from {
            opacity: 0;
            transform: scale(1.03);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-8">
        <SectionReveal>
          <div className="mb-5 flex items-start justify-between gap-4">
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

        {/* Portrait */}
        <SectionReveal delayMs={60}>
          <div className="overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(11,45,92,0.14)]">
            <div
              className="relative aspect-[3/4] w-full"
              style={{
                background:
                  'linear-gradient(160deg, #1B2F4A 0%, #3E566F 38%, #A8927D 72%, #E6D5C3 100%)',
                animation: 'discoveryPhotoIn 1s ease-out both',
              }}
              role="img"
              aria-label="Jessica, placeholder portrait"
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
                  Placeholder portrait
                </p>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Identity */}
        <SectionReveal delayMs={140}>
          <header className="mt-7 sm:mt-8">
            <h1
              className="text-[2.35rem] leading-none tracking-[-0.02em] text-[#0B2D5C] sm:text-5xl"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Jessica, 29
            </h1>
            <p className="mt-3 text-base text-[#5A6575] sm:text-lg">Denver, Colorado</p>
          </header>
        </SectionReveal>

        {/* Relationship Alignment */}
        <SectionReveal delayMs={220}>
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

            <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#0B2D5C]/06 pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                  Confidence
                </p>
                <p className="mt-1.5 text-lg font-semibold text-[#0B2D5C]">Moderate</p>
              </div>
            </div>

            <p className="mt-5 text-[15px] leading-relaxed text-[#5A6575]">
              Based on shared values, life goals, and completed compatibility questions.
            </p>

            <button
              type="button"
              onClick={() => flashPress('learn-why')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828]"
            >
              Learn why
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
            {pressedAction === 'learn-why' && (
              <p className="mt-2 text-xs text-[#7A8494]">Prototype only — no action yet.</p>
            )}
          </section>
        </SectionReveal>

        {/* Important Difference */}
        <SectionReveal delayMs={300}>
          <section
            className="mt-4 rounded-[1.75rem] border border-amber-200/80 bg-[#FBF6EE] p-6 shadow-[0_8px_28px_rgba(146,112,48,0.06)] sm:p-7"
            aria-labelledby="difference-title"
          >
            <div className="flex gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm text-amber-800/80"
                aria-hidden="true"
              >
                !
              </span>
              <div>
                <h2
                  id="difference-title"
                  className="text-lg font-semibold tracking-tight text-[#6B5428]"
                >
                  Important Difference to Review
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#7A6848]">
                  One important life preference differs.
                </p>
                <button
                  type="button"
                  onClick={() => flashPress('difference')}
                  className="mt-4 text-sm font-semibold text-[#8A6B35] transition hover:text-[#6B5428]"
                >
                  Tap to learn more
                </button>
                {pressedAction === 'difference' && (
                  <p className="mt-2 text-xs text-[#9A8760]">Prototype only — no action yet.</p>
                )}
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* Bio */}
        <SectionReveal delayMs={360}>
          <section className="mt-8" aria-labelledby="bio-title">
            <h2
              id="bio-title"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]"
            >
              About
            </h2>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#3D4654]">
              I value honesty, steady growth, and relationships that are built with intention. I
              love quiet mornings, hiking near the foothills, and dinners that last longer than
              planned. Looking for someone who takes faith, family, and emotional maturity
              seriously — and still knows how to laugh.
            </p>
          </section>
        </SectionReveal>

        {/* Why Forge surfaced */}
        <SectionReveal delayMs={420}>
          <section className={`${cardClassName} mt-8`} aria-labelledby="why-title">
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
                  Strong matches
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
                  Growing Alignment
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
                  Needs More Information
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

        {/* Character Signals */}
        <SectionReveal delayMs={480}>
          <section className={`${cardClassName} mt-4`} aria-labelledby="signals-title">
            <h2
              id="signals-title"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-2xl"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Character Signals
            </h2>
            <p className="mt-2 text-sm text-[#7A8494]">Placeholder only — not live confirmations.</p>

            <ul className="mt-6 space-y-5">
              {[
                { label: 'Respectful Communicator', count: 4 },
                { label: 'Good Listener', count: 3 },
                { label: 'Genuine and Present', count: 2 },
              ].map((signal) => (
                <li key={signal.label} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B2D5C] text-[11px] font-bold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[#0B2D5C]">{signal.label}</p>
                    <p className="mt-1 text-sm text-[#7A8494]">
                      Confirmed by {signal.count} people
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </SectionReveal>

        {/* Photo gallery */}
        <SectionReveal delayMs={540}>
          <section className="mt-8" aria-labelledby="gallery-title">
            <h2
              id="gallery-title"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]"
            >
              Photos
            </h2>
            <div className="mt-4 -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GALLERY.map((photo) => (
                <div
                  key={photo.id}
                  className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(11,45,92,0.1)] transition duration-300 hover:scale-[1.02] sm:h-40 sm:w-32"
                  style={{ background: photo.gradient }}
                  role="img"
                  aria-label={photo.label}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        {/* Actions */}
        <SectionReveal delayMs={600}>
          <section className="mt-10" aria-label="Prototype actions">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => flashPress('interested')}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_28px_rgba(214,40,40,0.22)] transition hover:bg-[#A61F1F] hover:shadow-[0_12px_32px_rgba(214,40,40,0.28)] active:scale-[0.99]"
              >
                Interested
              </button>
              <button
                type="button"
                onClick={() => flashPress('open-to-chat')}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/25 bg-white/80 px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C]/45 hover:bg-white active:scale-[0.99]"
              >
                Open to Chat
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-8">
              <button
                type="button"
                onClick={() => flashPress('save')}
                className="text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
              >
                Save for Later
              </button>
              <button
                type="button"
                onClick={() => flashPress('not-for-me')}
                className="text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
              >
                Not for Me
              </button>
            </div>

            {pressedAction &&
              ['interested', 'open-to-chat', 'save', 'not-for-me'].includes(pressedAction) && (
                <p className="mt-4 text-center text-xs text-[#7A8494]">
                  Prototype only — no matching, chat, or save actions.
                </p>
              )}
          </section>
        </SectionReveal>

        <p className="mt-12 text-center text-xs leading-relaxed text-[#8A93A0]">
          Forge Discovery Profile — UI/UX prototype.
          <br />
          No matching, scoring, messaging, or live data.
        </p>
      </div>
    </>
  );
}
