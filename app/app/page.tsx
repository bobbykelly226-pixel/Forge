import Header from '@/components/Header';
import LogoutButton from '@/components/LogoutButton';
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

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-16 pb-20 max-w-2xl mx-auto px-5 sm:px-6 text-center">
        <p className="text-sm uppercase tracking-wide text-[#D62828] font-semibold mb-4">
          Forge App
        </p>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-6">
          You&apos;re signed in
        </h1>

        <p className="text-lg text-[#444444] leading-relaxed mb-4">
          Welcome to the first version of the Forge app experience.
        </p>

        <p className="text-base text-[#666666] mb-10 break-words">
          Signed in as <span className="font-medium text-[#0B2D5C]">{user.email}</span>
        </p>

        <div className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-8 sm:p-10 shadow-sm mb-6 text-left sm:text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#0B2D5C] mb-3">
            Start your Forge onboarding
          </h2>
          <p className="text-lg text-[#444444] leading-relaxed mb-6">
            Answer a few intentional questions so Forge can begin shaping your compatibility
            profile.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex w-full sm:w-auto items-center justify-center bg-[#D62828] hover:bg-[#A61F1F] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition"
          >
            Start Onboarding
          </Link>
        </div>

        <div className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-8 sm:p-10 shadow-sm mb-10">
          <p className="text-lg text-[#444444] leading-relaxed mb-6">
            Your profile is the next step. Add the basics so Forge can start building
            around who you are and what you are looking for.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/profile"
              className="inline-block bg-[#0B2D5C] hover:bg-[#0A2540] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition"
            >
              Go to Your Profile →
            </Link>
            <Link
              href="/profile/preview"
              className="inline-block border border-[#0B2D5C]/20 bg-white hover:bg-[#F8F6F2] text-[#0B2D5C] px-8 py-4 rounded-2xl font-semibold text-lg transition"
            >
              Preview Profile
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <LogoutButton />
          <Link
            href="/"
            className="text-[#0B2D5C] hover:text-[#D62828] font-medium transition py-2"
          >
            Back to Homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
