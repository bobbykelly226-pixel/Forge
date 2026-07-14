import Header from '@/components/Header';
import SelfProfilePreviewCard from '@/components/profile/SelfProfilePreviewCard';
import { loadSelfProfilePreview } from '@/lib/data/bundle';
import { createClient } from '@/lib/supabase/server';
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

  const preview = await loadSelfProfilePreview();
  if (!preview.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-6">
        <p className="text-[#0B2D5C]">{preview.message}</p>
      </div>
    );
  }

  const profile = preview.data;
  const hasStartedProfile = Boolean(profile?.full_name);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="mx-auto max-w-md px-4 pb-28 pt-8 sm:max-w-lg sm:px-6 sm:pt-12">
        <div className="mb-7 sm:mb-9">
          <Link
            href="/profile"
            className="mb-5 inline-flex items-center text-sm font-medium text-[#0B2D5C] transition hover:text-[#D62828]"
          >
            ← Back to My Profile
          </Link>

          <div className="mb-4 inline-flex items-center rounded-full border border-[#0B2D5C]/15 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
            Your Profile Preview
          </div>

          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
            How others may see you
          </h1>
          <p className="text-base leading-relaxed text-[#555555] sm:text-lg">
            This is your saved Forge profile — not a discovery match, and without Interested or Open
            to Chat actions.
          </p>
        </div>

        {!hasStartedProfile || !profile ? (
          <div className="rounded-[2rem] border border-[#0B2D5C]/12 bg-white p-8 text-center shadow-[0_18px_50px_rgba(11,45,92,0.08)] sm:p-10">
            <p className="mb-3 text-xl font-semibold text-[#0B2D5C]">
              Your profile is starting to take shape.
            </p>
            <p className="mb-8 text-base leading-relaxed text-[#555555]">
              Add your name and details so future matches can understand what matters to you.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F]"
            >
              Edit Profile
            </Link>
          </div>
        ) : (
          <SelfProfilePreviewCard profile={profile} />
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/profile/edit"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F]"
          >
            Edit Profile
          </Link>
          <Link
            href="/profile"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-white/80"
          >
            Back to My Profile
          </Link>
        </div>
      </main>
    </div>
  );
}
