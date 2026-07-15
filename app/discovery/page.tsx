import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import { fetchDiscoveryFeedAction } from '@/app/actions/discovery';
import { getOpenToChatEducationSeenAction } from '@/app/actions/relationships';
import DiscoveryFeed from '@/components/DiscoveryFeedPrototype';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { DiscoveryActionsProvider } from '@/components/discovery/DiscoveryActionsProvider';
import {
  buildSampleDiscoveryActionState,
  countRealDiscoveryCandidates,
  injectSampleDiscoveryProfiles,
  shouldInjectSampleDiscoveryForRequest,
} from '@/lib/demo/inject-sample-discovery';
import { createEmptyActionState } from '@/lib/discovery-actions-types';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/data/profile';
import { firstNameFromFullName } from '@/lib/discovery/presentation';

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
  title: 'Discovery | Forge',
  description: 'Thoughtful introductions on Forge — not endless swiping.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DiscoveryFeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ demo?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/discovery');
  }

  const [feed, education, profile] = await Promise.all([
    fetchDiscoveryFeedAction(),
    getOpenToChatEducationSeenAction(),
    getCurrentUserProfile(),
  ]);

  const params = searchParams ? await searchParams : {};
  const forceDemoQuery = params.demo === '1';
  const realProfiles = feed.success ? feed.profiles : [];
  const realCandidateCount = countRealDiscoveryCandidates(realProfiles);
  const shouldInject = shouldInjectSampleDiscoveryForRequest({
    realCandidateCount,
    forceDemoQuery,
  });

  const profiles = shouldInject
    ? injectSampleDiscoveryProfiles(realProfiles)
    : realProfiles;
  const sampleProfilesInjected = shouldInject;

  const baseActionState = Object.fromEntries(
    Object.entries(feed.actionState ?? {}).map(([id, state]) => [
      id,
      {
        ...createEmptyActionState(),
        interested: state.interested,
        openToChatSent: state.openToChatSent,
        openToChatNote: state.openToChatNote,
        saved: state.saved,
        passed: state.passed,
      },
    ])
  );

  const initialActionState = sampleProfilesInjected
    ? { ...buildSampleDiscoveryActionState(), ...baseActionState }
    : baseActionState;

  const viewerName = profile.success
    ? firstNameFromFullName(profile.data?.full_name)
    : 'there';

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <DiscoveryActionsProvider
        initialActionState={initialActionState}
        initialEducationSeen={education.success ? education.data : false}
      >
        <DiscoveryFeed
          profiles={profiles}
          viewerName={viewerName}
          loadError={feed.success ? null : feed.message}
          sampleProfilesInjected={sampleProfilesInjected}
        />
      </DiscoveryActionsProvider>
    </ForgeAppCanvas>
  );
}
