import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import MyProfileHub from '@/components/profile/MyProfileHub';
import { loadCurrentUserProfileBundle } from '@/lib/data/bundle';
import { MY_PROFILE_SECTION_CARDS } from '@/lib/profile-v2-mock';
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
  title: 'My Profile | Forge',
  description: 'Your home inside Forge — manage how you show up.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MyProfileHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/profile');
  }

  const bundle = await loadCurrentUserProfileBundle();

  if (!bundle.success) {
    return (
      <ForgeAppCanvas
        className={`${display.variable} ${sans.variable}`}
        style={{
          fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <p className="text-[#0B2D5C]">{bundle.message}</p>
        </div>
      </ForgeAppCanvas>
    );
  }

  const { profile, completionPercent, completionSections, appState } = bundle.data;
  const displayName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    profile?.full_name?.trim() ||
    'Your profile';

  const checklist = completionSections.map((section) => ({
    id: section.id,
    label: section.label,
    complete: section.complete,
  }));

  const sectionCards = MY_PROFILE_SECTION_CARDS.map((card) => {
    if (card.comingSoon) {
      return card;
    }
    const match = completionSections.find((section) => section.id === card.id);
    if (card.id === 'signals') {
      return card;
    }
    if (card.id === 'privacy' || card.id === 'subscription') {
      return card;
    }
    if (match) {
      return {
        ...card,
        href: '/profile/edit',
      };
    }
    return { ...card, href: '/profile/edit' };
  });

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <MyProfileHub
        displayName={displayName}
        location={profile?.location ?? null}
        photoUrl={profile?.profile_photo_url ?? null}
        completionPercent={completionPercent}
        checklist={checklist}
        sectionCards={sectionCards}
        onboardingCompleted={Boolean(appState?.onboarding_completed)}
      />
    </ForgeAppCanvas>
  );
}
