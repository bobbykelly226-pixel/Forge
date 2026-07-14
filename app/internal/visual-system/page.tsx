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
    'Internal review surface for the corrected Forge metallic button system. Not rolled out to product routes.',
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
    <section className="rounded-[1.25rem] border border-[#0B2D5C]/10 bg-white/90 p-6 shadow-[0_12px_32px_rgba(11,45,92,0.04)] sm:p-8">
      <h2
        className="text-xl tracking-[-0.015em] text-[#0B2D5C]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5A6575]">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
      {children}
    </p>
  );
}

/** Plain navy gradient control — rejected comparison specimen only */
function RejectedPlainButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-12 items-center justify-center px-8 text-[14px] font-semibold uppercase tracking-[0.09em] text-white"
      style={{
        borderRadius: '0.375rem',
        border: '1.5px solid #9aa3af',
        background:
          'linear-gradient(180deg, color-mix(in srgb, #0B2D5C 78%, #ffffff) 0%, #0B2D5C 42%, #071e3d 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 18px rgba(11,45,92,0.16)',
      }}
    >
      {children}
    </button>
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
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="mb-10 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
            Internal · Visual System · Correction Review
          </p>
          <h1
            className="mt-3 text-[2.15rem] leading-none tracking-[-0.03em] text-[#0B2D5C] sm:text-[2.5rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Forge Button System
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
            Micro-radius rectangle — outer frame exactly <strong>4px</strong>, recessed inner face
            exactly <strong>3px</strong>. Polished silver metallic frame with graphite separator and
            restrained glass highlight. Prior navy-gradient implementation is rejected; this page is
            the correction review only. Not applied to product routes yet.
          </p>
          <p className="mt-3 text-sm text-[#8A93A0]">
            <Link href="/" className="underline-offset-2 hover:underline">
              ← Back to app
            </Link>
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {/* Rejected vs corrected */}
          <Section
            title="Corrected vs rejected"
            description="Side-by-side: the corrected forged metallic Tier 1 versus a plain navy gradient button (the rejected look). The silver frame must be unmistakable."
          >
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <Label>Corrected — forged metallic Tier 1</Label>
                <ForgeButton tier={1}>View My Profile</ForgeButton>
                <p className="mt-3 text-xs leading-relaxed text-[#5A6575]">
                  Visible polished silver perimeter, graphite separator, recessed navy face, upper
                  glass only, 4px / 3px geometry, weight 500 / tracking 0.12em.
                </p>
              </div>
              <div>
                <Label>Rejected — plain navy gradient</Label>
                <RejectedPlainButton>View My Profile</RejectedPlainButton>
                <p className="mt-3 text-xs leading-relaxed text-[#5A6575]">
                  Soft ~6px rounding, faint gray outline, broad glossy navy face — not Forge metallic.
                </p>
              </div>
            </div>
          </Section>

          {/* Hierarchy */}
          <Section
            title="Hierarchy — Soft Slate"
            description="Tier 1 forged · Tier 2 supports · Tier 3 gets out of the way. Side-by-side on Soft Slate."
          >
            <div className="flex flex-wrap items-center gap-4">
              <ForgeButton tier={1}>View My Profile</ForgeButton>
              <ForgeButton tier={2}>Browse Gallery</ForgeButton>
              <ForgeButton tier={3}>Learn More</ForgeButton>
            </div>
          </Section>

          {/* Surfaces */}
          <Section
            title="Tier 1 on Soft Slate"
            description="Official light-surface Tier 1: polished silver frame, graphite separator, recessed Forge Navy (#0B2D5C) face, white text."
          >
            <div
              className="rounded-xl p-8"
              style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
            >
              <Label>Soft Slate canvas · navy face</Label>
              <ForgeButton tier={1}>View My Profile</ForgeButton>
            </div>
          </Section>

          <Section
            title="Tier 1 on white"
            description="Same official navy-faced Tier 1 on a white surface — silver frame remains clearly visible."
          >
            <div className="rounded-xl border border-[#0B2D5C]/08 bg-white p-8">
              <Label>White surface · navy face</Label>
              <ForgeButton tier={1}>View My Profile</ForgeButton>
            </div>
          </Section>

          <Section
            title="On deep navy"
            description="Official dark-surface hierarchy. Tier 1 switches to Soft Slate face with navy text — navy-faced Tier 1 on navy is rejected."
          >
            <div
              className="rounded-xl p-8"
              style={{ background: 'var(--forge-navy, #0B2D5C)' }}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <Label>
                    <span className="text-white/55">Tier 1 · Soft Slate face</span>
                  </Label>
                  <ForgeButton tier={1} onDark>
                    View My Profile
                  </ForgeButton>
                </div>
                <div>
                  <Label>
                    <span className="text-white/55">Tier 2 · light outline</span>
                  </Label>
                  <ForgeButton tier={2} onDark>
                    Browse Gallery
                  </ForgeButton>
                </div>
                <div>
                  <Label>
                    <span className="text-white/55">Tier 3 · near-white link</span>
                  </Label>
                  <ForgeButton tier={3} onDark>
                    Learn More
                  </ForgeButton>
                </div>
              </div>
            </div>
          </Section>

          {/* Tier 2 surfaces */}
          <Section
            title="Tier 2 surfaces"
            description="Quiet Premium supporting action — same 4px silhouette and 48px height as Tier 1; no metallic frame."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                className="rounded-xl p-6"
                style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
              >
                <Label>On Soft Slate</Label>
                <ForgeButton tier={2}>Browse Gallery</ForgeButton>
              </div>
              <div className="rounded-xl border border-[#0B2D5C]/08 bg-white p-6">
                <Label>On white</Label>
                <ForgeButton tier={2}>Browse Gallery</ForgeButton>
              </div>
            </div>
          </Section>

          {/* Tier 3 */}
          <Section
            title="Tier 3"
            description="Typography-only with restrained underline and generous invisible touch target. Readable on light and deep navy."
          >
            <div className="flex flex-wrap items-center gap-8">
              <div>
                <Label>On Soft Slate</Label>
                <ForgeButton tier={3}>Learn More</ForgeButton>
              </div>
              <div
                className="rounded-xl px-6 py-4"
                style={{ background: 'var(--forge-navy, #0B2D5C)' }}
              >
                <Label>
                  <span className="text-white/55">On deep navy</span>
                </Label>
                <ForgeButton tier={3} onDark>
                  Learn More
                </ForgeButton>
              </div>
            </div>
          </Section>

          {/* States */}
          <Section
            title="States"
            description="Default, hover/pressed guidance, keyboard focus, disabled, and loading — all on the corrected geometry."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Default</Label>
                <ForgeButton tier={1}>View My Profile</ForgeButton>
              </div>
              <div>
                <Label>Hover guidance</Label>
                <p className="mb-3 text-xs text-[#5A6575]">
                  Slightly stronger silver edge, restrained face brightness, ~0.5px lift — no scale,
                  no glow.
                </p>
                <ForgeButton tier={1}>Hover Me</ForgeButton>
              </div>
              <div>
                <Label>Pressed guidance</Label>
                <p className="mb-3 text-xs text-[#5A6575]">
                  Moves ~1px down; outer shadow reduces; silhouette stays exact 4px rectangle.
                </p>
                <ForgeButton tier={1}>Press Me</ForgeButton>
              </div>
              <div>
                <Label>Keyboard focus</Label>
                <p className="mb-3 text-xs text-[#5A6575]">
                  Tab to this button — external 2px outline, offset 3px; no rounded wrapper.
                </p>
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
            </div>
          </Section>

          {/* Implementations */}
          <Section
            title="Button and link implementations"
            description="Real button and Next.js Link share the same geometry and metallic construction."
          >
            <div className="flex flex-wrap items-center gap-4">
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

          {/* Sizes */}
          <Section
            title="Sizes"
            description="Small, standard (48px), and large — outer radius stays 4px and inner face stays 3px at every size."
          >
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Small</Label>
                <ForgeButton tier={1} size="sm">
                  Small
                </ForgeButton>
              </div>
              <div>
                <Label>Standard · 48px</Label>
                <ForgeButton tier={1} size="md">
                  Standard
                </ForgeButton>
              </div>
              <div>
                <Label>Large</Label>
                <ForgeButton tier={1} size="lg">
                  Large
                </ForgeButton>
              </div>
            </div>
          </Section>

          {/* Mobile full-width */}
          <Section
            title="Full-width mobile stack"
            description="Full-width Tier 1 / 2 / 3 stack — radius remains 4px / 3px; must not read as a pill."
          >
            <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
              <ForgeButton tier={1} block>
                View My Profile
              </ForgeButton>
              <ForgeButton tier={2} block>
                Browse Gallery
              </ForgeButton>
              <ForgeButton tier={3} block>
                Learn More
              </ForgeButton>
            </div>
          </Section>

          {/* Material studies */}
          <Section
            title="Material studies"
            description="Silver-frame construction across face colors. Navy and Soft Slate are official treatments; graphite is optional study; red is reference-only — not a product primary or destructive default."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                className="rounded-xl p-6"
                style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
              >
                <Label>Navy — official on Soft Slate / white</Label>
                <ForgeButton tier={1} face="navy">
                  View My Profile
                </ForgeButton>
              </div>
              <div
                className="rounded-xl p-6"
                style={{ background: 'var(--forge-navy, #0B2D5C)' }}
              >
                <Label>
                  <span className="text-white/55">Soft Slate — official on deep navy</span>
                </Label>
                <ForgeButton tier={1} face="soft-slate">
                  View My Profile
                </ForgeButton>
              </div>
              <div className="rounded-xl border border-[#0B2D5C]/08 bg-white p-6">
                <Label>Graphite — optional material study</Label>
                <ForgeButton tier={1} face="graphite">
                  View My Profile
                </ForgeButton>
              </div>
              <div className="rounded-xl border border-[#D62828]/15 bg-white p-6">
                <Label>Red (reference only)</Label>
                <ForgeButton tier={1} face="red">
                  View My Profile
                </ForgeButton>
                <p className="mt-3 text-xs leading-relaxed text-[#5A6575]">
                  Reference-only material study. Do not use as ordinary primary. Do not use as the
                  default destructive treatment. Not a standard glossy product action.
                </p>
              </div>
            </div>
          </Section>

          {/* Geometry lock */}
          <Section
            title="Geometry lock"
            description="Documented exact values for this review version — do not approximate."
          >
            <ul className="space-y-2 text-sm text-[#5A6575]">
              <li>
                Tier 1 outer metallic frame: <code className="text-[#0B2D5C]">border-radius: 4px</code>
              </li>
              <li>
                Tier 1 recessed inner face: <code className="text-[#0B2D5C]">border-radius: 3px</code>
              </li>
              <li>
                Tier 2: <code className="text-[#0B2D5C]">border-radius: 4px</code>
              </li>
              <li>
                Standard height: <code className="text-[#0B2D5C]">48px</code> · horizontal padding:{' '}
                <code className="text-[#0B2D5C]">32px</code>
              </li>
              <li>
                Typography: <code className="text-[#0B2D5C]">14px / 500 / uppercase / 0.12em</code>
              </li>
            </ul>
          </Section>

          <p className="text-center text-xs text-[#8A93A0]">
            Scope lock: /internal/visual-system only. No product-route rollout until manual approval.
          </p>
        </div>
      </div>
    </ForgeAppCanvas>
  );
}
