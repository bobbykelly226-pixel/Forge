'use client';

import Link from 'next/link';

import DemoConnectionCard from '@/components/demo/DemoConnectionCard';
import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import type { DemoConnection } from '@/lib/demo/demo-connections';

export default function DemoConnectionsHub({
  connections,
}: {
  connections: DemoConnection[];
}) {
  return (
    <>
      <style>{`
        @keyframes demoConnectionsFadeUp {
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

      <div className="mx-auto min-h-screen w-full lg:max-w-[1280px] lg:px-8 lg:py-8 xl:max-w-[1360px] xl:px-10">
        <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-12">
          <aside
            className="sticky top-8 hidden max-h-[calc(100vh-4rem)] self-start overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgba(11,45,92,0.28)_transparent] lg:block"
            style={{ animation: 'demoConnectionsFadeUp 0.5s ease-out both' }}
          >
            <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_16px_44px_rgba(11,45,92,0.05)] backdrop-blur-sm xl:p-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Logos/forgedinlife-header-dark.png"
                alt="Forge"
                className="h-12 w-auto"
              />

              <h1
                className="mt-8 text-[1.85rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Demo Connections
              </h1>

              <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
                A private showcase of Forge compatibility language when live connections are empty.
              </p>

              <ForgeDesktopAppNav active="connections" />

              <div className="mt-8 border-t border-[#0B2D5C]/08 pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                  Demo note
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
                  Read-only fixtures. No live users, messages, or relationship actions.
                </p>
                <Link
                  href="/connections"
                  className="mt-4 inline-flex text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                >
                  ← Back to Connections
                </Link>
              </div>
            </div>
          </aside>

          <div className="min-h-screen w-full lg:min-h-0">
            <div className="hidden px-0 lg:block">
              <DiscoveryDesktopTopBar onPrototypeAction={() => undefined} />
            </div>

            <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10 lg:pt-0">
              <header
                className="shrink-0 lg:hidden"
                style={{ animation: 'demoConnectionsFadeUp 0.5s ease-out both' }}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Logos/forgedinlife-header-dark.png"
                    alt="Forge"
                    className="h-12 w-auto sm:h-14"
                  />
                  <span className="inline-flex rounded-full border border-[#0B2D5C]/12 bg-[#E8EEF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0B2D5C]/75">
                    Demo
                  </span>
                </div>

                <h1
                  className="text-[2.1rem] leading-none tracking-[-0.02em] text-[#0B2D5C] sm:text-[2.45rem]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  Demo Connections
                </h1>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#5A6575] sm:text-base">
                  Sample profiles that demonstrate Forge&apos;s Connections and compatibility
                  experience without touching live data.
                </p>
                <Link
                  href="/connections"
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828]"
                >
                  ← Back to Connections
                </Link>
              </header>

              <p
                className="mt-6 hidden rounded-2xl border border-[#0B2D5C]/08 bg-white/60 px-4 py-3 text-sm text-[#5A6575] lg:block"
                style={{
                  animation: 'demoConnectionsFadeUp 0.55s ease-out both',
                  animationDelay: '40ms',
                }}
              >
                Five demonstration connections covering Strong Alignment, Promising Alignment, More
                to Discover, Important Alignment Factors, and Not Enough Information.
              </p>

              <div
                className="mt-7 flex flex-col gap-6 lg:mt-6"
                style={{
                  animation: 'demoConnectionsFadeUp 0.55s ease-out both',
                  animationDelay: '80ms',
                }}
              >
                {connections.map((connection) => (
                  <DemoConnectionCard key={connection.id} connection={connection} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ForgeAppBottomNav active="connections" />
    </>
  );
}
