'use client';

import DemoCompatibilityDetail from '@/components/demo/DemoCompatibilityDetail';
import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import type { DemoConnection } from '@/lib/demo/demo-connections';

export default function DemoDetailChrome({
  connection,
}: {
  connection: DemoConnection;
}) {
  return (
    <>
      <div className="mx-auto min-h-screen w-full lg:max-w-[1280px] lg:px-8 lg:py-8 xl:max-w-[1360px] xl:px-10">
        <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-12">
          <aside className="sticky top-8 hidden self-start lg:block">
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
                Compatibility
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
                Detailed alignment view for a demo connection.
              </p>
              <ForgeDesktopAppNav active="connections" />
            </div>
          </aside>

          <div className="min-h-screen w-full lg:min-h-0">
            <div className="hidden lg:block">
              <DiscoveryDesktopTopBar onPrototypeAction={() => undefined} />
            </div>
            <DemoCompatibilityDetail connection={connection} />
          </div>
        </div>
      </div>
      <ForgeAppBottomNav active="connections" />
    </>
  );
}
