import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import ForgeButton from '@/components/ui/ForgeButton';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-discovery-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-discovery-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Forge Visual System | Buttons',
  description:
    'Internal review surface for the Forge metallic button system. Visual material matching — not rolled out to product routes.',
  robots: {
    index: false,
    follow: false,
  },
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[#0B2D5C]/10 bg-white/90 p-5 sm:p-6">
      <h2
        className="text-lg tracking-[-0.015em] text-[#0B2D5C]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5A6575]">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
      {children}
    </p>
  );
}

function SurfaceRow({
  label,
  bg,
  dark,
  surface,
}: {
  label: string;
  bg: string;
  dark?: boolean;
  surface: 'soft-slate' | 'white' | 'navy';
}) {
  return (
    <div className="p-5 sm:p-6" style={{ background: bg }}>
      <Label>
        {dark ? <span className="text-white/55">{label}</span> : label}
      </Label>
      <div className="flex flex-wrap items-center gap-3">
        <ForgeButton tier={1} surface={surface} onDark={dark}>
          View My Profile
        </ForgeButton>
        <ForgeButton tier={2} surface={surface} onDark={dark}>
          Browse Gallery
        </ForgeButton>
        <ForgeButton tier={3} surface={surface} onDark={dark}>
          Learn More
        </ForgeButton>
      </div>
    </div>
  );
}

export default function VisualSystemPage() {
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-8 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
            Internal · Visual System · Metallic Reconstruction
          </p>
          <h1
            className="mt-3 text-[2rem] leading-none tracking-[-0.03em] text-[#0B2D5C] sm:text-[2.35rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Forge Button System
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
            Goal: match the approved metallic rendering as a manufactured object — substantial
            polished silver chassis, bevel, graphite separator, recessed face, glass reflection —
            not a navy rectangle with a thin outline. Review only; no product-route rollout.
          </p>
          <p className="mt-2 text-sm text-[#8A93A0]">
            <Link href="/" className="underline-offset-2 hover:underline">
              ← Back to app
            </Link>
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {/* SECTION 1 */}
          <Section
            title="1 · Approved reference target"
            description="The attached approved rendering is the visual source of truth. Match material construction — polished metal, dimensional glass, engineered structure — not merely navy fill color. The uploaded reference is not shipped as a production asset."
          >
            <ul className="grid gap-2 text-sm text-[#5A6575] sm:grid-cols-2">
              <li>• Substantial polished metallic perimeter (~4.5px chassis)</li>
              <li>• Bright / mid / dark steel transitions (not flat gray)</li>
              <li>• Inner metallic bevel + graphite separator</li>
              <li>• Recessed colored face with upper glass reflection</li>
              <li>• Micro-radius rectangle — outer 4px · inner 2.5px</li>
              <li>• Premium manufactured-object quality</li>
            </ul>
          </Section>

          {/* SECTION 2 */}
          <Section
            title="2 · Primary surface matrix"
            description="Tier 1 / 2 / 3 at realistic size on Soft Slate, white, and deep navy. Official surface pairings."
          >
            <div className="overflow-hidden border border-[#0B2D5C]/10">
              <SurfaceRow
                label="Soft Slate — navy Tier 1 · white Tier 2 · navy Tier 3"
                bg="var(--forge-app-background, #E8EBF0)"
                surface="soft-slate"
              />
              <SurfaceRow
                label="White — navy Tier 1 · Soft Slate Tier 2 · navy Tier 3"
                bg="#ffffff"
                surface="white"
              />
              <SurfaceRow
                label="Deep navy — Soft Slate Tier 1 · translucent Tier 2 · near-white Tier 3"
                bg="var(--forge-navy, #0B2D5C)"
                surface="navy"
                dark
              />
            </div>
          </Section>

          {/* SECTION 3 */}
          <Section
            title="3 · Metallic detail (enlarged)"
            description="Scaled specimen so chassis, bevel, graphite, face, glass, depth, and shadow are inspectable."
          >
            <div
              className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center"
              style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
            >
              <div style={{ transform: 'scale(1.75)', transformOrigin: 'left center' }}>
                <ForgeButton tier={1}>View My Profile</ForgeButton>
              </div>
              <ol className="max-w-sm space-y-1.5 text-xs leading-relaxed text-[#5A6575]">
                <li>
                  <strong className="text-[#0B2D5C]">1 Outer chassis</strong> — SVG + CSS metallic
                  fill, ~4.5px visible silver on all sides
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">2 Inner bevel</strong> — light top / dark bottom
                  metal edge
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">3 Graphite separator</strong> — #26303A ring
                  between metal and face
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">4 Recessed face</strong> — Forge Navy #0B2D5C with
                  tonal depth
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">5 Glass reflection</strong> — shaped upper ~48%
                  highlight
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">6 Lower depth</strong> — inset shadow inside face
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">7 External shadow</strong> — restrained anchor
                  beneath object
                </li>
              </ol>
            </div>
          </Section>

          {/* SECTION 4 */}
          <Section
            title="4 · States"
            description="Default, hover, pressed, focus, disabled, loading — plus real button and link."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Default</Label>
                <ForgeButton tier={1}>View My Profile</ForgeButton>
              </div>
              <div>
                <Label>Hover</Label>
                <p className="mb-2 text-[11px] text-[#5A6575]">Stronger silver · ≤0.5px lift</p>
                <ForgeButton tier={1}>Hover Me</ForgeButton>
              </div>
              <div>
                <Label>Pressed</Label>
                <p className="mb-2 text-[11px] text-[#5A6575]">+1px down · reduced shadow</p>
                <ForgeButton tier={1}>Press Me</ForgeButton>
              </div>
              <div>
                <Label>Focus</Label>
                <p className="mb-2 text-[11px] text-[#5A6575]">Tab here — external ring</p>
                <ForgeButton tier={1}>Focus Target</ForgeButton>
              </div>
              <div>
                <Label>Disabled</Label>
                <ForgeButton tier={1} disabled>
                  Unavailable
                </ForgeButton>
              </div>
              <div>
                <Label>Loading</Label>
                <ForgeButton tier={1} loading>
                  Saving
                </ForgeButton>
              </div>
              <div>
                <Label>Real button</Label>
                <ForgeButton tier={1} type="button">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>Real link</Label>
                <ForgeButton tier={1} href="/internal/visual-system">
                  View My Profile
                </ForgeButton>
              </div>
            </div>
          </Section>

          {/* SECTION 5 */}
          <Section
            title="5 · Responsive"
            description="Content-width, large, and full-width mobile — same 4px outer / 2.5px inner / 4.5px chassis."
          >
            <div className="flex flex-col gap-4">
              <div>
                <Label>Content width</Label>
                <ForgeButton tier={1}>View My Profile</ForgeButton>
              </div>
              <div>
                <Label>Large</Label>
                <ForgeButton tier={1} size="lg">
                  View My Profile
                </ForgeButton>
              </div>
              <div className="max-w-sm">
                <Label>Full-width mobile stack</Label>
                <div className="flex flex-col gap-2.5">
                  <ForgeButton tier={1} block>
                    View My Profile
                  </ForgeButton>
                  <ForgeButton tier={2} block surface="soft-slate">
                    Browse Gallery
                  </ForgeButton>
                  <ForgeButton tier={3} block>
                    Learn More
                  </ForgeButton>
                </div>
              </div>
            </div>
          </Section>

          {/* Material studies — compact */}
          <Section
            title="Material studies"
            description="Silver chassis across face colors. Red is reference-only — not a product primary or default destructive."
          >
            <div
              className="flex flex-wrap items-center gap-3 p-5"
              style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
            >
              <ForgeButton tier={1} face="navy">
                Navy
              </ForgeButton>
              <div className="rounded px-3 py-2" style={{ background: 'var(--forge-navy)' }}>
                <ForgeButton tier={1} face="soft-slate">
                  Soft Slate
                </ForgeButton>
              </div>
              <ForgeButton tier={1} face="graphite">
                Graphite
              </ForgeButton>
              <div>
                <ForgeButton tier={1} face="red">
                  Red
                </ForgeButton>
                <p className="mt-1 text-[10px] text-[#8A93A0]">
                  Red (reference only) — Do not use as ordinary primary
                </p>
              </div>
            </div>
          </Section>

          <p className="text-center text-xs text-[#8A93A0]">
            Scope lock: /internal/visual-system only. Manual approval required before product
            rollout.
          </p>
        </div>
      </div>
    </ForgeAppCanvas>
  );
}
