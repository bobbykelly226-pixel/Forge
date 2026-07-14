import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { fetchDiscoveryProfileAction } from '@/app/actions/discovery';
import { getOpenToChatEducationSeenAction } from '@/app/actions/relationships';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { DiscoveryActionsProvider } from '@/components/discovery/DiscoveryActionsProvider';
import DiscoveryProfileView from '@/components/discovery/DiscoveryProfileView';
import { createEmptyActionState } from '@/lib/discovery-actions-types';
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
  title: 'Discovery Profile | Forge',
  description: 'View a Forge member profile in Discovery.',
  robots: { index: false, follow: false },
};

export default async function DiscoveryProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/discovery/profile/${profileId}`);
  }

  if (profileId === user.id) {
    redirect('/profile/preview');
  }

  const [result, education] = await Promise.all([
    fetchDiscoveryProfileAction(profileId),
    getOpenToChatEducationSeenAction(),
  ]);

  if (!result.success) {
    return (
      <ForgeAppCanvas
        className={`${display.variable} ${sans.variable}`}
        style={{
          fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <h1
            className="text-2xl text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Profile unavailable
          </h1>
          <p className="mt-3 text-[#5A6575]">{result.message}</p>
          <Link href="/discovery" className="mt-8 font-semibold text-[#D62828]">
            Back to Discovery
          </Link>
        </div>
      </ForgeAppCanvas>
    );
  }

  if (result.unavailable || !result.profile) {
    return (
      <ForgeAppCanvas
        className={`${display.variable} ${sans.variable}`}
        style={{
          fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <h1
            className="text-2xl text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Profile unavailable
          </h1>
          <p className="mt-3 text-[#5A6575]">
            This profile is not available in Discovery right now.
          </p>
          <Link href="/discovery" className="mt-8 font-semibold text-[#D62828]">
            Back to Discovery
          </Link>
        </div>
      </ForgeAppCanvas>
    );
  }

  const actionState = result.actionState
    ? {
        [profileId]: {
          ...createEmptyActionState(),
          interested: result.actionState.interested,
          openToChatSent: result.actionState.openToChatSent,
          openToChatNote: result.actionState.openToChatNote,
          saved: result.actionState.saved,
          passed: result.actionState.passed,
        },
      }
    : {};

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <DiscoveryActionsProvider
        initialActionState={actionState}
        initialEducationSeen={education.success ? education.data : false}
      >
        <DiscoveryProfileView profile={result.profile} />
      </DiscoveryActionsProvider>
    </ForgeAppCanvas>
  );
}
