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

      <main className="pt-10 sm:pt-14 pb-24 max-w-lg mx-auto px-5 sm:px-6">
        <div className="mb-8 sm:mb-10">
          <Link
            href="/app"
            className="inline-flex items-center text-sm font-medium text-[#0B2D5C] hover:text-[#D62828] transition mb-6"
          >
            ← Back to App
          </Link>

          <p className="text-sm uppercase tracking-wide text-[#D62828] font-semibold mb-3">
            Profile Preview
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2D5C] mb-3">
            How others may see you
          </h1>
          <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
            This is a quiet look at how your Forge profile can introduce you to someone who
            values intentional connection.
          </p>
        </div>

        {!hasStartedProfile ? (
          <div className="bg-white border border-[#0B2D5C]/10 rounded-[2rem] p-8 sm:p-10 shadow-sm text-center">
            <p className="text-lg text-[#0B2D5C] font-semibold mb-3">
              Your profile is starting to take shape.
            </p>
            <p className="text-base text-[#555555] leading-relaxed mb-8">
              Add more detail so future matches can understand what matters to you. The more
              intentional your profile is, the better Forge can help surface meaningful alignment.
            </p>
            <Link
              href="/profile"
              className="inline-block w-full sm:w-auto bg-[#D62828] hover:bg-[#A61F1F] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition"
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
            className="inline-flex items-center justify-center w-full bg-[#D62828] hover:bg-[#A61F1F] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition"
          >
            Edit Profile
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center w-full bg-white hover:bg-[#F8F6F2] text-[#0B2D5C] border border-[#0B2D5C]/20 px-8 py-4 rounded-2xl font-semibold text-lg transition"
          >
            Back to App
          </Link>
        </div>
      </main>
    </div>
  );
}
