import Header from '@/components/Header';
import ProfilePreviewCard from '@/components/ProfilePreviewCard';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/profile';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProfilePreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/profile/preview');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const hasStartedProfile = Boolean(profile?.full_name);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="mx-auto max-w-md px-4 pb-28 pt-8 sm:max-w-lg sm:px-6 sm:pt-12">
        <div className="mb-7 sm:mb-9">
          <Link
            href="/app"
            className="mb-5 inline-flex items-center text-sm font-medium text-[#0B2D5C] transition hover:text-[#D62828]"
          >
            ← Back to App
          </Link>

          <div className="mb-4 inline-flex items-center rounded-full border border-[#0B2D5C]/15 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
            Preview Mode
          </div>

          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
            How others may see you
          </h1>
          <p className="text-base leading-relaxed text-[#555555] sm:text-lg">
            This is a quiet look at how your Forge profile can introduce you to someone who values
            intentional connection. Not a swipe card. A first impression rooted in character.
          </p>
        </div>

        {!hasStartedProfile ? (
          <div className="rounded-[2rem] border border-[#0B2D5C]/12 bg-white p-8 text-center shadow-[0_18px_50px_rgba(11,45,92,0.08)] sm:p-10">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#0B2D5C]/10">
              <span className="text-4xl font-bold text-[#0B2D5C]">F</span>
            </div>
            <p className="mb-3 text-xl font-semibold text-[#0B2D5C]">
              Your profile is starting to take shape.
            </p>
            <p className="mb-8 text-base leading-relaxed text-[#555555]">
              Add more detail so future matches can understand what matters to you. The more
              intentional your profile is, the better Forge can help surface meaningful alignment.
            </p>
            <Link
              href="/profile"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F]"
            >
              Edit Profile
            </Link>
          </div>
        ) : (
          <ProfilePreviewCard profile={profile as Profile} />
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/profile"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F]"
          >
            Edit Profile
          </Link>
          <Link
            href="/app"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-white/80"
          >
            Back to App
          </Link>
        </div>
      </main>
    </div>
  );
}
