import Header from '@/components/Header';
import LogoutButton from '@/components/LogoutButton';
import { hasOnboardingProgress, loadOnboardingState } from '@/lib/data/onboarding';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const onboarding = await loadOnboardingState();
  if (onboarding.success && hasOnboardingProgress(onboarding.data)) {
    redirect('/profile');
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="mx-auto max-w-2xl px-5 pb-20 pt-16 text-center sm:px-6">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#D62828]">
          Welcome to Forge
        </p>

        <h1 className="mb-5 text-4xl font-bold tracking-tight text-[#0B2D5C] sm:text-5xl">
          Build your profile at your pace
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#444444]">
          Start with the essentials, explore how compatibility works, or open your
          profile. Forge saves your progress as you go.
        </p>

        <section
          className="mb-8 rounded-3xl border border-[#0B2D5C]/10 bg-white p-6 text-left shadow-sm sm:p-8"
          aria-label="Choose where to begin"
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/onboarding"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D62828]"
            >
              Start Onboarding
            </Link>
            <Link
              href="/compatibility-profile"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
            >
              Open Compatibility Profile
            </Link>
            <Link
              href="/profile"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
            >
              Go to My Profile
            </Link>
          </div>
        </section>

        <div className="flex items-center justify-center">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
