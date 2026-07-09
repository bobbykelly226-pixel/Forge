import Header from '@/components/Header';
import OnboardingShell from '@/components/OnboardingShell';
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

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />
      <OnboardingShell />
    </div>
  );
}
