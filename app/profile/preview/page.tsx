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

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-16 pb-20 max-w-xl mx-auto px-5 sm:px-6">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-wide text-[#D62828] font-semibold mb-4">
            Profile Preview
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2D5C] mb-4">
            How Your Profile Looks
          </h1>
          <p className="text-base sm:text-lg text-[#444444] leading-relaxed">
            This is a simple preview of how your Forge profile may appear to others later.
          </p>
        </div>

        {!profile?.full_name ? (
          <div className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-8 sm:p-10 shadow-sm text-center">
            <p className="text-lg text-[#444444] leading-relaxed mb-6">
              Create your profile first, then come back here to preview it.
            </p>
            <Link
              href="/profile"
              className="inline-block bg-[#D62828] hover:bg-[#A61F1F] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition"
            >
              Go to Profile
            </Link>
          </div>
        ) : (
          <ProfilePreviewCard profile={profile as Profile} />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            href="/profile"
            className="text-[#0B2D5C] hover:text-[#D62828] font-medium transition py-2"
          >
            Edit Profile
          </Link>
          <Link
            href="/app"
            className="text-[#0B2D5C] hover:text-[#D62828] font-medium transition py-2"
          >
            Back to App
          </Link>
        </div>
      </main>
    </div>
  );
}
