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

        <div className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-8 sm:p-10 shadow-sm mb-10">
          <p className="text-lg text-[#444444] leading-relaxed">
            Profiles, matching, and messaging are coming next. Authentication is the
            foundation we are building on first.
          </p>
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
