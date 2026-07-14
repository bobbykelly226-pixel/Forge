import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/profile';
import { resolveAuthoritativeProfilePhotoUrl } from '@/lib/profile-photo';
import { redirect } from 'next/navigation';

import ProfileForm from './ProfileForm';

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/profile/edit');
  }

  const [{ data: profile }, { data: photos }, { data: privateDetails }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('profile_photos')
        .select('storage_path, is_primary, display_order')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('profile_private_details')
        .select(
          'postal_code, latitude, longitude, location_place_id, location_provider'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  const displayPhotoUrl = resolveAuthoritativeProfilePhotoUrl({
    photos: photos ?? [],
    legacyProfilePhotoUrl: profile?.profile_photo_url,
  });

  const profileForForm = profile
    ? ({ ...profile, profile_photo_url: displayPhotoUrl } as Profile)
    : null;

  return (
    <ProfileForm
      profile={profileForForm}
      privateDetails={privateDetails ?? null}
    />
  );
}
