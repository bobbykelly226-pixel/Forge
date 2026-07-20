import { Fraunces, Manrope } from 'next/font/google';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  getConversationThreadMetaAction,
  listConversationMessagesAction,
  markConversationReadAction,
} from '@/app/actions/conversations';
import ConversationThread from '@/components/conversations/ConversationThread';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import NotificationsProvider from '@/components/notifications/NotificationsProvider';
import { loadConversationAlignmentContext } from '@/lib/conversations/alignment-context';
import { buildConversationStarters } from '@/lib/conversations/starters';
import { getCurrentUserProfile } from '@/lib/data/profile';
import { getDiscoveryProfile } from '@/lib/data/discovery';
import { isSeedProfileId } from '@/lib/seed/access';
import {
  buildSeedMessages,
  buildSeedThreadMeta,
  isSeedConversationId,
  seedPeerIdFromConversationId,
} from '@/lib/seed/conversations';
import { getSeedProfileById } from '@/lib/seed/catalog';
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
  title: 'Conversation | Forge',
  robots: { index: false, follow: false },
};

export default async function ConversationThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/connections/c/${conversationId}`);
  }

  const isSeed = isSeedConversationId(conversationId);

  if (isSeed) {
    const meta = buildSeedThreadMeta(conversationId);
    if (!meta) notFound();
    const peerId = seedPeerIdFromConversationId(conversationId);
    const seedProfile = peerId ? getSeedProfileById(peerId) : null;
    const alignmentContext = peerId
      ? await loadConversationAlignmentContext(peerId)
      : null;
    const starters = buildConversationStarters({
      peerFirstName: meta.peerFirstName,
      thingsIEnjoy: seedProfile?.thingsIEnjoy ?? null,
      career: seedProfile?.career ?? null,
      relocation: seedProfile?.relocation ?? null,
      sharedStrengthCopies: alignmentContext?.sharedStrengths.map((item) => item.copy) ?? [],
      viewerThingsIEnjoy: ['Hiking', 'Cooking', 'Board games'],
    });

    return (
      <ForgeAppCanvas
        desktopViewportLock
        className={`${display.variable} ${sans.variable}`}
        style={{
          fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
          <p className="mb-3">
            <Link
              href="/connections?tab=conversations"
              className="text-sm font-semibold text-[#0B2D5C] underline decoration-[#0B2D5C]/35 underline-offset-4"
            >
              ← Messages
            </Link>
          </p>
          <ConversationThread
            meta={meta}
            initialMessages={buildSeedMessages(conversationId)}
            viewerUserId="seed-demo-viewer"
            alignmentContext={alignmentContext}
            starters={starters}
            isSeed
          />
        </div>
        <ForgeAppBottomNav active="messages" />
      </ForgeAppCanvas>
    );
  }

  const [metaResult, messagesResult] = await Promise.all([
    getConversationThreadMetaAction(conversationId),
    listConversationMessagesAction(conversationId),
  ]);

  if (!metaResult.success || !metaResult.data) {
    notFound();
  }

  const meta = metaResult.data;
  const messages = messagesResult.success ? (messagesResult.data?.messages ?? []) : [];
  const hasMore = messagesResult.success ? Boolean(messagesResult.data?.hasMore) : false;

  void markConversationReadAction(conversationId);

  const [alignmentContext, peerProfile, viewerProfile] = await Promise.all([
    loadConversationAlignmentContext(meta.peerUserId),
    isSeedProfileId(meta.peerUserId)
      ? Promise.resolve(null)
      : getDiscoveryProfile(meta.peerUserId),
    getCurrentUserProfile(),
  ]);

  const peer = peerProfile?.success ? peerProfile.data : null;
  const starters = buildConversationStarters({
    peerFirstName: meta.peerFirstName,
    thingsIEnjoy: peer?.things_i_enjoy ?? null,
    career: peer?.career ?? null,
    relocation: peer?.relocation ?? null,
    sharedStrengthCopies: alignmentContext?.sharedStrengths.map((item) => item.copy) ?? [],
    viewerThingsIEnjoy:
      viewerProfile.success && viewerProfile.data
        ? viewerProfile.data.things_i_enjoy
        : null,
  });

  return (
    <ForgeAppCanvas
      desktopViewportLock
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <NotificationsProvider initialMessagesUnread={false}>
        <div className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
          <p className="mb-3">
            <Link
              href="/connections?tab=conversations"
              className="text-sm font-semibold text-[#0B2D5C] underline decoration-[#0B2D5C]/35 underline-offset-4"
            >
              ← Messages
            </Link>
          </p>
          <ConversationThread
            meta={meta}
            initialMessages={messages}
            hasMoreInitial={hasMore}
            viewerUserId={user.id}
            alignmentContext={alignmentContext}
            starters={starters}
          />
        </div>
        <ForgeAppBottomNav active="messages" />
      </NotificationsProvider>
    </ForgeAppCanvas>
  );
}
