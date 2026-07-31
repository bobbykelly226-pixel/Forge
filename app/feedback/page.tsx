import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import BetaFeedbackWorkspace from '@/components/feedback/BetaFeedbackWorkspace';
import NotificationsProvider from '@/components/notifications/NotificationsProvider';
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
  title: 'Beta Feedback | Forge',
  description: 'Share private product feedback with the Forge beta team.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BetaFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/feedback');
  }

  return (
    <ForgeAppCanvas
      desktopViewportLock
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <NotificationsProvider>
        <BetaFeedbackWorkspace />
      </NotificationsProvider>
    </ForgeAppCanvas>
  );
}
