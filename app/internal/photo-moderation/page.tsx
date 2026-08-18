import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import PhotoModerationWorkspace from '@/components/operator/PhotoModerationWorkspace';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { loadPendingProfilePhotosForOperator } from '@/lib/operator/photo-moderation';
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

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Photo Moderation | Forge',
  description: 'Private operator review for pending Forge profile photos.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PhotoModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/internal/photo-moderation');
  }

  if (!isForgeOperatorUser(user)) {
    notFound();
  }

  const queue = await loadPendingProfilePhotosForOperator();

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <PhotoModerationWorkspace
        photos={queue.success ? queue.data : []}
        loadError={queue.success ? null : queue.message}
      />
    </ForgeAppCanvas>
  );
}
