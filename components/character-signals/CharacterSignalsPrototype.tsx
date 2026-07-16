'use client';

import { useCallback, useRef, useState } from 'react';

import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeAuthenticatedTwoColumnShell from '@/components/ForgeAuthenticatedTwoColumnShell';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import HowCharacterSignalsWorkDrawer from '@/components/character-signals/HowCharacterSignalsWorkDrawer';
import {
  LearnMoreSection,
  NewRecognitionSection,
  RecognitionHistorySection,
  VisibleOnProfileSection,
} from '@/components/character-signals/CharacterSignalsSections';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';

export default function CharacterSignalsPrototype() {
  const { signals, history } = useCharacterSignals();
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const learnMoreTriggerRef = useRef<HTMLButtonElement | null>(null);

  const flashNote = (_message: string) => {
    // Desktop top-bar prototype actions remain placeholders.
  };

  const openLearnMore = useCallback(() => {
    setLearnMoreOpen(true);
  }, []);

  const closeLearnMore = useCallback(() => {
    setLearnMoreOpen(false);
    window.requestAnimationFrame(() => learnMoreTriggerRef.current?.focus());
  }, []);

  return (
    <>
      <style>{`
        @keyframes characterSignalsFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <ForgeAuthenticatedTwoColumnShell
        wide
        asideStyle={{ animation: 'characterSignalsFadeUp 0.45s ease-out both' }}
        aside={
          <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_12px_32px_rgba(11,45,92,0.04)] backdrop-blur-sm xl:p-7">
            <img
              src="/Logos/forgedinlife-header-dark.png"
              alt="Forge"
              className="h-12 w-auto"
            />

            <h1
              className="mt-8 text-[1.75rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Character Signals
            </h1>

            <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
              Manage which positive qualities appear on your profile.
            </p>

            <ForgeDesktopAppNav active="profile" />
          </div>
        }
      >
        <div className="hidden px-0 lg:block">
          <DiscoveryDesktopTopBar onPrototypeAction={flashNote} />
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-2xl lg:px-0 lg:pb-10 lg:pt-0">
          {/* Section 1 — intro */}
          <header
            className="shrink-0"
            style={{ animation: 'characterSignalsFadeUp 0.45s ease-out both' }}
          >
            <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
              <img
                src="/Logos/forgedinlife-header-dark.png"
                alt="Forge"
                className="h-12 w-auto sm:h-14"
              />
              <p className="rounded-full border border-[#0B2D5C]/12 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B2D5C]/65">
                Prototype
              </p>
            </div>

            <h1
              className="text-[2rem] leading-none tracking-[-0.02em] text-[#0B2D5C] sm:text-[2.25rem] lg:text-[2rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Character Signals
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#5A6575] sm:text-base">
              Character Signals help highlight the positive qualities others have independently
              recognized after meaningful interactions.
            </p>
          </header>

          <div
            className="mt-8 flex min-w-0 flex-col gap-8 lg:mt-9 lg:gap-9"
            style={{
              animation: 'characterSignalsFadeUp 0.5s ease-out both',
              animationDelay: '50ms',
            }}
          >
            <VisibleOnProfileSection signals={signals} />
            <NewRecognitionSection signals={signals} />
            <RecognitionHistorySection history={history} />
            <LearnMoreSection
              onLearnMore={openLearnMore}
              learnMoreButtonRef={learnMoreTriggerRef}
            />
          </div>

          <p className="mt-10 text-xs leading-relaxed text-[#8A93A0] lg:mt-12">
            Forge Character Signals — profile management prototype.
            <br />
            Supports Discovery Profiles. No reviews, ratings, or persistent data.
          </p>
        </div>
      </ForgeAuthenticatedTwoColumnShell>

      <HowCharacterSignalsWorkDrawer open={learnMoreOpen} onClose={closeLearnMore} />
      <ForgeAppBottomNav active="profile" />
    </>
  );
}
