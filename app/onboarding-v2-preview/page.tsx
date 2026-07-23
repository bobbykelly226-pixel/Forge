import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import Category01PreviewShell from '@/components/questionnaire-preview/Category01PreviewShell';
import { CATEGORY_01 } from '@/lib/questionnaire/catalog';
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

  // Authenticated preview only — do not gate on legacy onboarding completion.
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-preview-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Category01PreviewShell category={CATEGORY_01} />
      </main>
    </ForgeAppCanvas>
  );
}
