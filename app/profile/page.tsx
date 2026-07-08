import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/profile';
import { redirect } from 'next/navigation';

import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/profile');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return <ProfileForm profile={profile as Profile | null} />;
}
