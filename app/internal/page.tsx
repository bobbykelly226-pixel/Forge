import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';
import { FileWarning, Images, KeyRound, ShieldCheck } from 'lucide-react';
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
          Choose the private Forge tool you need. Every action remains protected by the approved
          administrator account, authenticator verification, and permanent audit records.
        </p>

        <section className="mt-9 grid gap-5 md:grid-cols-3" aria-label="Administrator tools">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-[0_16px_45px_rgba(11,45,92,0.06)] transition hover:-translate-y-0.5 hover:border-[#0B2D5C]/20 hover:shadow-[0_20px_50px_rgba(11,45,92,0.1)]"
              >
                <span className="inline-flex rounded-2xl bg-[#EEF3F9] p-3 text-[#0B2D5C] transition group-hover:bg-[#0B2D5C] group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-[#0B2D5C]">{tool.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">{tool.description}</p>
                <p className="mt-5 text-sm font-semibold text-[#D62828]">Open {tool.title} →</p>
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
