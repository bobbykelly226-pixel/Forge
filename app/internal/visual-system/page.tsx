import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';

import SignatureV3Review from '@/components/internal/SignatureV3Review';
import SignatureV4Review from '@/components/internal/SignatureV4Review';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import ForgeButton from '@/components/ui/ForgeButton';
import ForgeSignatureV3 from '@/components/ui/ForgeSignatureV3';
import { SIGNATURE_V4_COMPARE } from '@/components/ui/ForgeSignatureV4';

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
  title: 'Forge Visual System | Signature V4 Review',
  description:
    'Internal visual review for ForgeSignatureV4 navy candidate. Not rolled out to product routes.',
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
            Internal · Visual review · Signature V4
          </p>
          <h1
            className="mt-3 text-[2rem] leading-none tracking-[-0.03em] text-[#0B2D5C] sm:text-[2.35rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Signature V4 Navy Review
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
            Primary review renders only <code>ForgeSignatureV4</code> with{' '}
            <code>data-visual-candidate=&quot;{SIGNATURE_V4_COMPARE.dataCandidate}&quot;</code>. Exact
            navy crop is the sole visual source of truth. Manual approval has not been granted. No
            product-route rollout.
          </p>
          <p className="mt-2 text-sm text-[#8A93A0]">
            <Link href="/" className="underline-offset-2 hover:underline">
              ← Back to app
            </Link>
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <Section
            title="Primary · Navy reference vs Signature V4"
            description="Exact navy crop beside ForgeSignatureV4 at identical dimensions. Multi-layer chrome SVG — not a single gradient stroke."
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]">
              Implementation candidate — Signature V4
            </p>
            <SignatureV4Review />
          </Section>

          <Section title="Historical experiments — not current candidate">
            <p className="mb-4 text-sm text-[#5A6575]">
              Prior builds only. Do not treat these as the primary implementation candidate.
            </p>

            <div className="space-y-6">
              <div>
                <Label>Signature V3 (superseded)</Label>
                <div
                  className="flex flex-wrap items-center gap-3 p-4"
                  style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
                >
                  <ForgeSignatureV3 compareSize={false} className="!h-[72px] !w-[220px]" />
                </div>
                <p className="mt-1 text-[11px] text-[#8A93A0]">
                  Kept for history — not mounted in the primary candidate slot. SignatureV3Review
                  remains available below for archival comparison only.
                </p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                    Show archival V3 review tool
                  </summary>
                  <div className="mt-3 opacity-80">
                    <SignatureV3Review />
                  </div>
                </details>
              </div>

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
                <Label>Frozen Tier 2 / Tier 3 (unchanged this pass)</Label>
                <div
                  className="flex flex-wrap items-center gap-3 p-4"
                  style={{ background: 'var(--forge-app-background, #E8EBF0)' }}
                >
                  <ForgeButton tier={2} surface="soft-slate">
                    Browse Gallery
                  </ForgeButton>
                  <ForgeButton tier={3}>Learn More</ForgeButton>
                </div>
              </div>
            </div>
          </Section>

          <p className="text-center text-xs text-[#8A93A0]">
            Scope lock: /internal/visual-system only. Signature V4 Implementation Candidate awaiting
            manual visual approval.
          </p>
        </div>
      </div>
    </ForgeAppCanvas>
  );
}
