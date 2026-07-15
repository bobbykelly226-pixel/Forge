import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';

import SignatureV3Review from '@/components/internal/SignatureV3Review';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import ForgeButton from '@/components/ui/ForgeButton';
import { SIGNATURE_V3_COMPARE } from '@/components/ui/ForgeSignatureV3';

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
  title: 'Forge Visual System | Signature V3 Review',
  description:
    'Internal visual review for ForgeSignatureV3 navy candidate. Not rolled out to product routes.',
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
            Internal · Visual review · Signature V3
          </p>
          <h1
            className="mt-3 text-[2rem] leading-none tracking-[-0.03em] text-[#0B2D5C] sm:text-[2.35rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Signature V3 Navy Review
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
            Primary review renders only <code>ForgeSignatureV3</code> with{' '}
            <code>data-visual-candidate=&quot;{SIGNATURE_V3_COMPARE.dataCandidate}&quot;</code>. Prior
            referenceFaithful / experimental builds are historical only. Manual approval has not been
            granted. No product-route rollout.
          </p>
          <p className="mt-2 text-sm text-[#8A93A0]">
            <Link href="/" className="underline-offset-2 hover:underline">
              ← Back to app
            </Link>
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {/* PRIMARY — Signature V3 only */}
          <Section
            title="Primary · Navy reference vs Signature V3"
            description="Exact navy crop from the approved reference plate beside ForgeSignatureV3 at identical dimensions. Overlay mode is a design-review tool only."
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]">
              Implementation candidate — Signature V3
            </p>
            <SignatureV3Review />
          </Section>

          {/* HISTORICAL — clearly separated */}
          <Section title="Historical experiments — not current candidate">
            <p className="mb-4 text-sm text-[#5A6575]">
              These are prior builds kept only to avoid confusion. They must not be treated as the
              primary implementation candidate.
            </p>

            <div className="space-y-6">
              <div>
                <Label>referenceFaithful (prior SVG chassis via ForgeButton)</Label>
                <div
                  className="flex flex-wrap items-center gap-3 p-4"
                  style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
                >
                  <ForgeButton tier={1} variant="referenceFaithful" face="navy">
                    View My Profile
                  </ForgeButton>
                </div>
              </div>

              <div>
                <Label>experimental (prior thin CSS chassis)</Label>
                <div
                  className="flex flex-wrap items-center gap-3 p-4"
                  style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
                >
                  <ForgeButton tier={1} variant="experimental">
                    View My Profile
                  </ForgeButton>
                </div>
              </div>

              <div>
                <Label>Frozen Tier 2 / Tier 3 surface matrix (unchanged this pass)</Label>
                <div
                  className="flex flex-wrap items-center gap-3 p-4"
                  style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
                >
                  <ForgeButton tier={2} surface="soft-slate">
                    Browse Gallery
                  </ForgeButton>
                  <ForgeButton tier={3}>Learn More</ForgeButton>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 bg-white p-4">
                  <ForgeButton tier={2} surface="white">
                    Browse Gallery
                  </ForgeButton>
                  <ForgeButton tier={3}>Learn More</ForgeButton>
                </div>
                <div
                  className="mt-2 flex flex-wrap items-center gap-3 p-4"
                  style={{ background: 'var(--forge-navy, #0B2D5C)' }}
                >
                  <ForgeButton tier={2} surface="navy" onDark>
                    Browse Gallery
                  </ForgeButton>
                  <ForgeButton tier={3} onDark>
                    Learn More
                  </ForgeButton>
                </div>
              </div>
            </div>
          </Section>

          <p className="text-center text-xs text-[#8A93A0]">
            Scope lock: /internal/visual-system only. Signature V3 Implementation Candidate awaiting
            manual visual approval.
          </p>
        </div>
      </div>
    </ForgeAppCanvas>
  );
}
