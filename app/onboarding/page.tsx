import { redirect } from 'next/navigation';

import OnboardingShell from '@/components/OnboardingShell';
import { loadOnboardingBootstrap } from '@/app/actions/onboarding';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/onboarding');
  }

  const bootstrap = await loadOnboardingBootstrap();

  if (bootstrap.completed) {
    redirect('/profile');
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <OnboardingShell
        initialAnswers={bootstrap.answers}
        initialStep={bootstrap.initialStep}
      />
    </main>
  );
}
