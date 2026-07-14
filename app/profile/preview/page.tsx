import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import SelfProfilePreviewCard from '@/components/profile/SelfProfilePreviewCard';
import { loadSelfProfilePreview } from '@/lib/data/bundle';
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

export const metadata = {
  title: 'Profile Preview | Forge',
  description: 'How your Forge profile may appear to others.',
  robots: { index: false, follow: false },
};

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
  const hasStartedProfile = Boolean(
    profile?.full_name?.trim() ||
      profile?.short_bio?.trim() ||
      profile?.profile_photo_url ||
      (profile?.things_i_enjoy && profile.things_i_enjoy.length > 0)
  );

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div className="min-h-screen pb-16 pt-6 lg:pt-10">
        <div className="mx-auto mb-8 w-full max-w-lg px-4 sm:px-6 lg:mb-10 lg:max-w-5xl lg:px-8 xl:max-w-6xl">
          <h1
            className="text-3xl tracking-tight text-[#0B2D5C] sm:text-4xl"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            How others may see you
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#555555] sm:text-lg">
            This is your saved Forge profile — without Discovery actions. Empty sections stay
            hidden until you add them.
          </p>
        </div>

        {!hasStartedProfile || !profile ? (
          <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:max-w-5xl lg:px-8">
            <div className="rounded-[2rem] border border-[#0B2D5C]/12 bg-white p-8 text-center shadow-[0_18px_50px_rgba(11,45,92,0.08)] sm:p-10">
              <p className="mb-3 text-xl font-semibold text-[#0B2D5C]">
                Your profile is starting to take shape.
              </p>
              <p className="mb-8 text-base leading-relaxed text-[#555555]">
                Add a few details when you are ready. You can still show yourself in Discovery with
                a partial profile.
              </p>
              <Link
                href="/profile/edit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] sm:w-auto sm:px-10"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        ) : (
          <SelfProfilePreviewCard profile={profile} />
        )}
      </div>
    </ForgeAppCanvas>
  );
}
