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
  description: 'Internal review surface for Forge button shape, finish, and hierarchy.',
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
            Internal · Visual System
          </p>
          <h1
            className="mt-3 text-[2.15rem] leading-none tracking-[-0.03em] text-[#0B2D5C] sm:text-[2.5rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Forge Button System
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
            Softened rectangular silhouette with restrained curvature — not pills. Soft Slate canvas,
            Forge Navy primary metallic, quiet secondary outline, typography-only tertiary. Review
            shape, finish, hierarchy, and states here before broader adoption.
          </p>
          <p className="mt-3 text-sm text-[#8A93A0]">
            <Link href="/" className="font-semibold text-[#0B2D5C] underline-offset-2 hover:underline">
              ← Back to Forge
            </Link>
          </p>
        </header>

        <div className="space-y-8">
          <Section
            title="Hierarchy — Soft Slate"
            description="Tier 1 is the only full metallic treatment. Tier 2 stays quieter. Tier 3 is typography-only."
          >
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <Label>Tier 1 · Primary CTA</Label>
                <ForgeButton tier={1}>View My Profile</ForgeButton>
                <p className="mt-3 text-xs leading-relaxed text-[#8A93A0]">
                  Premium / Primary — navy metallic face, precision silver frame, soft glass sheen.
                </p>
              </div>
              <div>
                <Label>Tier 2 · Secondary</Label>
                <ForgeButton tier={2}>Browse Gallery</ForgeButton>
                <p className="mt-3 text-xs leading-relaxed text-[#8A93A0]">
                  Quiet outline — same rectangular silhouette, no heavy chrome frame.
                </p>
              </div>
              <div>
                <Label>Tier 3 · Tertiary</Label>
                <ForgeButton tier={3}>Learn More</ForgeButton>
                <p className="mt-3 text-xs leading-relaxed text-[#8A93A0]">
                  Minimalist underlined action — no container, no metallic finish.
                </p>
              </div>
            </div>
          </Section>

          <Section
            title="States"
            description="Hover, active, focus, and disabled should remain calm and accessible."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Default</Label>
                <ForgeButton tier={1}>Continue</ForgeButton>
              </div>
              <div>
                <Label>Disabled</Label>
                <ForgeButton tier={1} disabled>
                  Continue
                </ForgeButton>
              </div>
              <div>
                <Label>Secondary disabled</Label>
                <ForgeButton tier={2} disabled>
                  Cancel
                </ForgeButton>
              </div>
              <div>
                <Label>As link</Label>
                <ForgeButton tier={1} href="/profile">
                  Open Profile
                </ForgeButton>
              </div>
            </div>
            <p className="mt-5 text-xs text-[#8A93A0]">
              Tab to a button to review the focus ring. Prefer keyboard and reduced-motion settings when
              evaluating.
            </p>
          </Section>

          <Section
            title="Sizes & full width"
            description="Proportions stay architectural across compact, default, and large sizes."
          >
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Small</Label>
                <ForgeButton tier={1} size="sm">
                  Save
                </ForgeButton>
              </div>
              <div>
                <Label>Default</Label>
                <ForgeButton tier={1}>Save Section</ForgeButton>
              </div>
              <div>
                <Label>Large</Label>
                <ForgeButton tier={1} size="lg">
                  Confirm Photo
                </ForgeButton>
              </div>
            </div>
            <div className="mt-6 max-w-md">
              <Label>Block</Label>
              <ForgeButton tier={1} block>
                Manage My Profile
              </ForgeButton>
            </div>
          </Section>

          <Section
            title="Material study — Tier 1 face colors"
            description="Navy is the product primary. White and graphite inform quieter surfaces. Red is a material reference only — not a standard primary or destructive style."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Navy (primary)</Label>
                <ForgeButton tier={1} face="navy">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>White / pale</Label>
                <ForgeButton tier={1} face="white">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>Graphite</Label>
                <ForgeButton tier={1} face="graphite">
                  View My Profile
                </ForgeButton>
              </div>
              <div>
                <Label>Red (reference only)</Label>
                <ForgeButton tier={1} face="red">
                  View My Profile
                </ForgeButton>
                <p className="mt-2 text-[11px] leading-relaxed text-[#8A93A0]">
                  Do not use as ordinary primary or glossy destructive default.
                </p>
              </div>
            </div>
          </Section>

          <section className="overflow-hidden rounded-[1.25rem] border border-[#0B2D5C]/15 bg-[linear-gradient(160deg,#0B2D5C_0%,#0A2540_55%,#1A2332_100%)] p-6 shadow-[0_16px_40px_rgba(11,45,92,0.18)] sm:p-8">
            <h2
              className="text-xl tracking-[-0.015em] text-white"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              On deep navy (contrast check)
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Hierarchy still holds on darker surfaces. Tier 2 and Tier 3 use light-on-dark treatments;
              avoid large navy canvases in the product app — Soft Slate remains the environment.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <ForgeButton tier={1}>View My Profile</ForgeButton>
              <ForgeButton tier={2} onDark>
                Browse Gallery
              </ForgeButton>
              <ForgeButton tier={3} onDark>
                Learn More
              </ForgeButton>
            </div>
          </section>

          <Section
            title="Responsive stack"
            description="On narrow widths, primary actions can stack full-width without becoming pills."
          >
            <div className="mx-auto max-w-sm space-y-3 rounded-xl border border-dashed border-[#C5CCD6] bg-[#F4F6F8] p-4">
              <ForgeButton tier={1} block>
                View My Profile
              </ForgeButton>
              <ForgeButton tier={2} block>
                Browse Gallery
              </ForgeButton>
              <div className="pt-1 text-center">
                <ForgeButton tier={3}>Learn More</ForgeButton>
              </div>
            </div>
          </Section>

          <section className="rounded-[1.25rem] border border-[#0B2D5C]/08 bg-[#EEF2F7] px-6 py-5 text-sm leading-relaxed text-[#5A6575]">
            <p className="font-semibold text-[#0B2D5C]">Review checklist</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Corners feel softened but rectangular — never pill-shaped.</li>
              <li>Metallic finish feels precise and calm — not arcade, casino, or chrome-heavy.</li>
              <li>Tier 1 dominates; Tier 2 is quieter; Tier 3 is text-only.</li>
              <li>Navy metallic is the primary product treatment.</li>
              <li>Focus rings and disabled states remain clear.</li>
            </ul>
          </section>
        </div>
      </div>
    </ForgeAppCanvas>
  );
}
