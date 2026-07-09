import Header from '@/components/Header';
import OnboardingShell from '@/components/OnboardingShell';
import { loadCompatibilityAnswers } from '@/app/actions/compatibility';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/onboarding');
  }

  const initialAnswers = await loadCompatibilityAnswers();

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />
      <OnboardingShell initialAnswers={initialAnswers} />
    </div>
  );
}
