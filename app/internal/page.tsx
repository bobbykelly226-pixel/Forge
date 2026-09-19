import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createClient } from '@/lib/supabase/server';

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

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Administrator Home | Forge',
  description: 'Private Forge administrator tools.',
  robots: { index: false, follow: false },
};

const TOOLS = [
  {
    href: '/internal/founding-beta',
    title: 'Founding Beta Requests',
    description: 'Review access requests and issue personal seven-day beta invitations.',
  },
  {
    href: '/internal/account-governance',
    title: 'Account Governance',
    description: 'Manage retention schedules, deletion holds, and account lifecycle audit history.',
  },
  {
    href: '/internal/photo-moderation',
    title: 'Photo Moderation',
    description: 'Approve or reject new and replacement member profile photos.',
  },
  {
    href: '/internal/report-review',
    title: 'Safety Reports',
    description: 'Review member reports, private evidence, decisions, notifications, and appeals.',
  },
  {
    href: '/internal/operator-security?redirectTo=/internal',
    title: 'Account Security',
    description: 'Confirm the administrator account and authenticator protection for this session.',
  },
] as const;

export default async function AdministratorHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/internal');
  }
  if (!isForgeOperatorUser(user)) {
    notFound();
  }

  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') {
    redirect('/internal/operator-security?redirectTo=/internal');
  }

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{ fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif' }}
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="inline-flex border border-[#0B2D5C] bg-[#E6E6E7] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0B2D5C]">
          MFA-protected administrator workspace
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-discovery-display)] text-3xl font-semibold tracking-[-0.02em] text-[#0B2D5C] sm:text-4xl">
          Administrator Home
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black sm:text-base">
          Choose a work area. Use its Back button to return here.
        </p>

        <section className="mt-6 grid gap-3 md:grid-cols-2" aria-label="Administrator tools">
          {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group !bg-[#E6E6E7] p-4 text-[#0B2D5C] shadow-[inset_0_0_0_1px_#0B2D5C] transition hover:!bg-white sm:p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-[#0B2D5C]">{tool.title}</h2>
                  <span className="shrink-0 text-sm font-semibold text-[#C92027]">Open →</span>
                </div>
                <p className="mt-1 text-sm leading-snug text-black">{tool.description}</p>
              </Link>
          ))}
        </section>

        <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-[#0B2D5C] underline">
          Return to the Forge homepage
        </Link>
      </main>
    </ForgeAppCanvas>
  );
}
