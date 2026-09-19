import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';
import { ArrowRight, FileWarning, Images, KeyRound, Scale, ShieldCheck, UsersRound } from 'lucide-react';
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
    icon: UsersRound,
  },
  {
    href: '/internal/account-governance',
    title: 'Account Governance',
    description: 'Manage retention schedules, deletion holds, and account lifecycle audit history.',
    icon: Scale,
  },
  {
    href: '/internal/photo-moderation',
    title: 'Photo Moderation',
    description: 'Approve or reject new and replacement member profile photos.',
    icon: Images,
  },
  {
    href: '/internal/report-review',
    title: 'Safety Reports',
    description: 'Review member reports, private evidence, decisions, notifications, and appeals.',
    icon: FileWarning,
  },
  {
    href: '/internal/operator-security?redirectTo=/internal',
    title: 'Account Security',
    description: 'Confirm the administrator account and authenticator protection for this session.',
    icon: KeyRound,
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
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]">
          <ShieldCheck className="h-4 w-4 text-[#D62828]" aria-hidden="true" />
          MFA-protected administrator workspace
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-discovery-display)] text-4xl font-semibold tracking-[-0.03em] text-[#0B2D5C] sm:text-5xl">
          Administrator Home
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#5A6575]">
          Choose one work area. Each tile opens its own focused workspace, and every workspace has
          a clear path back here.
        </p>

        <section className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Administrator tools">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group border border-[#0B2D5C] bg-[#E6E6E7] p-6 shadow-[0_12px_32px_rgba(11,45,92,0.08)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(11,45,92,0.12)]"
              >
                <span className="inline-flex border border-[#0B2D5C] bg-white p-3 text-[#0B2D5C] transition group-hover:bg-[#0B2D5C] group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-[#0B2D5C]">{tool.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-black">{tool.description}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#C92027]">Open workspace <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></p>
              </Link>
            );
          })}
        </section>

        <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-[#0B2D5C] hover:underline">
          Return to the Forge homepage
        </Link>
      </main>
    </ForgeAppCanvas>
  );
}
