import { Fraunces, Manrope } from 'next/font/google';
import Image from 'next/image';
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
  title: 'Forge Visual System | Button Candidates',
  description:
    'Internal visual review for Forge button candidates. Not rolled out to product routes.',
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
  description?: string;
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
      {description ? (
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5A6575]">{description}</p>
      ) : null}
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
      <Label>{dark ? <span className="text-white/55">{label}</span> : label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        <ForgeButton tier={1} variant="referenceFaithful" surface={surface} onDark={dark}>
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
            Internal · Visual review · Candidate comparison
          </p>
          <h1
            className="mt-3 text-[2rem] leading-none tracking-[-0.03em] text-[#0B2D5C] sm:text-[2.35rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Forge Button Candidates
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
            Side-by-side visual review against the approved metallic rendering. Manual approval has
            not been granted. No product-route rollout.
          </p>
          <p className="mt-2 text-sm text-[#8A93A0]">
            <Link href="/" className="underline-offset-2 hover:underline">
              ← Back to app
            </Link>
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {/* SECTION 1 */}
          <Section title="1 · Reference and implementation candidate">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <Label>Approved reference</Label>
                <div className="overflow-hidden border border-[#0B2D5C]/12 bg-[#1a1a1a]">
                  <Image
                    src="/internal/forge-button-approved-reference.png"
                    alt="Approved metallic button reference rendering — navy, red, white, and graphite faces"
                    width={1536}
                    height={1024}
                    className="h-auto w-full"
                    priority
                  />
                </div>
                <p className="mt-2 text-[11px] text-[#8A93A0]">
                  Internal review asset only — not an interactive control; not used on product
                  routes.
                </p>
              </div>
              <div>
                <Label>Implementation candidate — referenceFaithful</Label>
                <div
                  className="flex min-h-[220px] flex-col items-center justify-center gap-5 p-8"
                  style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
                >
                  <ForgeButton tier={1} variant="referenceFaithful" size="lg">
                    View My Profile
                  </ForgeButton>
                  <ForgeButton tier={1} variant="referenceFaithful" face="red">
                    View My Profile
                  </ForgeButton>
                  <div className="flex flex-wrap justify-center gap-3">
                    <ForgeButton tier={1} variant="referenceFaithful" face="white">
                      View My Profile
                    </ForgeButton>
                    <ForgeButton tier={1} variant="referenceFaithful" face="graphite">
                      View My Profile
                    </ForgeButton>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[#8A93A0]">
                  Independent SVG chassis candidate — compare material weight to the reference.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#0B2D5C]/08 pt-5">
              <Label>Prior experimental CSS chassis (not the candidate)</Label>
              <div
                className="flex flex-wrap items-center gap-3 p-5"
                style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
              >
                <ForgeButton tier={1} variant="experimental">
                  View My Profile
                </ForgeButton>
                <p className="text-xs text-[#5A6575]">
                  Previous thin-frame experiment retained for comparison only.
                </p>
              </div>
            </div>
          </Section>

          {/* SECTION 2 */}
          <Section title="2 · Enlarged detail">
            <div
              className="flex flex-col items-start gap-6 overflow-x-auto p-8 sm:flex-row sm:items-center"
              style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
            >
              <div style={{ transform: 'scale(2)', transformOrigin: 'left center' }}>
                <ForgeButton tier={1} variant="referenceFaithful">
                  View My Profile
                </ForgeButton>
              </div>
              <ol className="max-w-sm space-y-1.5 text-xs leading-relaxed text-[#5A6575]">
                <li>
                  <strong className="text-[#0B2D5C]">Outer polished lip</strong> — near-white top /
                  left specular edge
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">Main chassis</strong> — bright-to-dark silver /
                  steel (~17% height)
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">Lower steel depth</strong> — darker BR shading
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">Inner silver bevel</strong> — complete rim around
                  face
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">Graphite channel</strong> — recessed separation
                  groove
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">Recessed face</strong> — Forge Navy tonal depth
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">Glass reflection</strong> — shaped upper-left
                  taper
                </li>
                <li>
                  <strong className="text-[#0B2D5C]">Contact shadow</strong> — weighty anchor beneath
                </li>
              </ol>
            </div>
          </Section>

          {/* SECTION 3 */}
          <Section title="3 · Surface matrix">
            <div className="overflow-hidden border border-[#0B2D5C]/10">
              <SurfaceRow
                label="Soft Slate"
                bg="var(--forge-app-background, #E8EBF0)"
                surface="soft-slate"
              />
              <SurfaceRow label="White" bg="#ffffff" surface="white" />
              <SurfaceRow
                label="Deep navy"
                bg="var(--forge-navy, #0B2D5C)"
                surface="navy"
                dark
              />
            </div>
          </Section>

          {/* SECTION 4 */}
          <Section title="4 · Sizes">
            <div className="flex flex-col gap-5">
              <div>
                <Label>Large / hero CTA · 68px</Label>
                <ForgeButton tier={1} variant="referenceFaithful" size="lg">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>Standard signature CTA · 58px</Label>
                <ForgeButton tier={1} variant="referenceFaithful" size="md">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>Compact experimental · 48px — not automatically approved</Label>
                <ForgeButton tier={1} variant="referenceFaithful" size="compact">
                  View My Profile
                </ForgeButton>
              </div>
            </div>
          </Section>

          {/* SECTION 5 */}
          <Section title="5 · States">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Default</Label>
                <ForgeButton tier={1} variant="referenceFaithful">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>Hover</Label>
                <ForgeButton tier={1} variant="referenceFaithful">
                  Hover Me
                </ForgeButton>
              </div>
              <div>
                <Label>Pressed</Label>
                <ForgeButton tier={1} variant="referenceFaithful">
                  Press Me
                </ForgeButton>
              </div>
              <div>
                <Label>Focus</Label>
                <ForgeButton tier={1} variant="referenceFaithful">
                  Focus Target
                </ForgeButton>
              </div>
              <div>
                <Label>Disabled</Label>
                <ForgeButton tier={1} variant="referenceFaithful" disabled>
                  Unavailable
                </ForgeButton>
              </div>
              <div>
                <Label>Loading</Label>
                <ForgeButton tier={1} variant="referenceFaithful" loading>
                  Saving
                </ForgeButton>
              </div>
              <div>
                <Label>Button</Label>
                <ForgeButton tier={1} variant="referenceFaithful" type="button">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>Link</Label>
                <ForgeButton tier={1} variant="referenceFaithful" href="/internal/visual-system">
                  View My Profile
                </ForgeButton>
              </div>
            </div>
          </Section>

          {/* SECTION 6 */}
          <Section title="6 · Mobile full width">
            <div className="mx-auto w-full max-w-[390px]">
              <Label>Actual mobile width stack</Label>
              <div className="flex flex-col gap-2.5">
                <ForgeButton tier={1} variant="referenceFaithful" block>
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
          </Section>

          <p className="text-center text-xs text-[#8A93A0]">
            Scope lock: /internal/visual-system only. Candidate awaiting manual visual approval.
          </p>
        </div>
      </div>
    </ForgeAppCanvas>
  );
}
