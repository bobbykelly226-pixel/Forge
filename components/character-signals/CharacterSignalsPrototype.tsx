'use client';

import { Sparkles } from 'lucide-react';

import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import {
  GrowingSignalsSection,
  HowCharacterSignalsWorkSection,
  PendingSignalsSection,
  PublicSignalsSection,
  RecognitionHistorySection,
} from '@/components/character-signals/CharacterSignalsSections';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';

export default function CharacterSignalsPrototype() {
  const { signals, history, recipients, openRecognition, registerRecognitionTrigger } =
    useCharacterSignals();

  const flashNote = (_message: string) => {
    // Desktop top-bar prototype actions remain placeholders.
  };

  const hasEligibleRecipient = recipients.length > 0;

  const recognizeButton = hasEligibleRecipient ? (
    <button
      ref={registerRecognitionTrigger}
      type="button"
      onClick={() => openRecognition()}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] sm:w-auto"
    >
      <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      Recognize Someone
    </button>
  ) : (
    <p className="rounded-2xl border border-[#0B2D5C]/08 bg-white/70 px-4 py-3 text-sm leading-relaxed text-[#5A6575]">
      There are no eligible connections to recognize right now.
    </p>
  );

  return (
    <>
      <style>{`
        @keyframes characterSignalsFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mx-auto min-h-screen w-full lg:max-w-[1280px] lg:px-8 lg:py-8 xl:max-w-[1440px] xl:px-10">
        <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-12">
          <aside
            className="sticky top-8 hidden max-h-[calc(100vh-4rem)] self-start overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgba(11,45,92,0.28)_transparent] lg:block [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#0B2D5C]/25 [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ animation: 'characterSignalsFadeUp 0.5s ease-out both' }}
          >
            <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_16px_44px_rgba(11,45,92,0.05)] backdrop-blur-sm xl:p-7">
              <img
                src="/Logos/forgedinlife-header-dark.png"
                alt="Forge"
                className="h-12 w-auto"
              />

              <h1
                className="mt-8 text-[1.85rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Character Signals
              </h1>

              <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
                Recognitions of how you show up in conversations and meaningful interactions.
              </p>

              <ForgeDesktopAppNav active="character-signals" />

              <div className="mt-8 border-t border-[#0B2D5C]/08 pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                  Actions
                </p>
                <p className="text-sm leading-relaxed text-[#5A6575]">
                  Use Recognize Someone in the main panel to start a prototype recognition.
                </p>
              </div>
            </div>
          </aside>

          <div className="min-h-screen w-full min-w-0 lg:min-h-0">
            <div className="hidden px-0 lg:block">
              <DiscoveryDesktopTopBar onPrototypeAction={flashNote} />
            </div>

            <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10 lg:pt-0">
              {/* SECTION 1: Page header */}
              <header
                className="shrink-0"
                style={{ animation: 'characterSignalsFadeUp 0.5s ease-out both' }}
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

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-[2.1rem] leading-none tracking-[-0.02em] text-[#0B2D5C] sm:text-[2.45rem] lg:text-[2.15rem]"
                      style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                    >
                      <span className="lg:hidden">Character Signals</span>
                      <span className="hidden lg:inline">Your Character Signals</span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#5A6575] sm:text-base lg:mt-2">
                      Review, approve, and understand recognitions of how you show up.
                    </p>
                  </div>
                  <div className="shrink-0">{recognizeButton}</div>
                </div>
              </header>

              <div
                className="mt-7 flex min-w-0 flex-col gap-6 lg:mt-8 lg:gap-8"
                style={{
                  animation: 'characterSignalsFadeUp 0.55s ease-out both',
                  animationDelay: '60ms',
                }}
              >
                {/* SECTION 2: Public (~62%) + Pending (~38%) */}
                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,1fr)] lg:items-stretch lg:gap-7 xl:gap-8">
                  <PublicSignalsSection signals={signals} />
                  <PendingSignalsSection signals={signals} />
                </div>

                {/* SECTION 3: Growing Signals — full width, 2-col cards */}
                <GrowingSignalsSection signals={signals} />

                {/* SECTION 4: Recognition History — full width, 2-col activity */}
                <RecognitionHistorySection history={history} />

                {/* SECTION 5: How It Works */}
                <HowCharacterSignalsWorkSection />
              </div>

              <p className="mt-10 text-xs leading-relaxed text-[#8A93A0] lg:mt-12">
                Forge Character Signals — UI/UX prototype.
                <br />
                No reviews, ratings, moderation, messaging, or persistent data.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ForgeAppBottomNav active="profile" />
    </>
  );
}
