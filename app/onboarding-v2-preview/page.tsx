import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import CompatibilityProfilePreviewShell from '@/components/questionnaire-preview/CompatibilityProfilePreviewShell';
import { getPreviewCategories } from '@/lib/questionnaire/catalog';
import { PREVIEW_PAGE_DESCRIPTION } from '@/lib/questionnaire/preview/category-01-preview-flow';
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
  title: 'Onboarding 2.0 Preview | Forge',
  description: PREVIEW_PAGE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OnboardingV2PreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/onboarding-v2-preview');
  }

  const categories = getPreviewCategories();

  // Authenticated preview only — do not gate on legacy onboarding completion.
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-preview-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <CompatibilityProfilePreviewShell categories={categories} />
      </main>
    </ForgeAppCanvas>
  );
}
