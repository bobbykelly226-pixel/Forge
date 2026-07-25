import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import CompatibilityProfileShell from '@/components/compatibility-profile/CompatibilityProfileShell';
import { loadCompatibilityProfileStateAction } from '@/app/actions/questionnaire';
import { getQuestionnaireCatalog } from '@/lib/questionnaire/catalog';
import { COMPATIBILITY_PROFILE_PAGE_DESCRIPTION } from '@/lib/questionnaire/persistence/copy';
import { createClient } from '@/lib/supabase/server';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-preview-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-preview-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Compatibility Profile | Forge',
  description: COMPATIBILITY_PROFILE_PAGE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CompatibilityProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/compatibility-profile');
  }

  const loaded = await loadCompatibilityProfileStateAction();
  if (!loaded.success || !loaded.data) {
    return (
      <ForgeAppCanvas
        className={`${display.variable} ${sans.variable}`}
        style={{
          fontFamily: 'var(--font-preview-sans), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <main className="flex min-h-screen items-center justify-center px-6 text-center">
          <p className="text-[var(--forge-navy)]">
            {loaded.success === false
              ? loaded.message
              : 'Could not load your Compatibility Profile.'}
          </p>
        </main>
      </ForgeAppCanvas>
    );
  }

  const catalog = getQuestionnaireCatalog();

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-preview-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <CompatibilityProfileShell
          categories={catalog.categories}
          initialAnswersByCategory={loaded.data.state.answersByCategory}
          initialProgress={loaded.data.state.progress}
          parentingProfile={loaded.data.parentingProfile}
        />
      </main>
    </ForgeAppCanvas>
  );
}
