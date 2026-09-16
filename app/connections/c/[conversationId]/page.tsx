import type { Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
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
import {
  buildSeedMessages,
  buildSeedThreadMeta,
  isSeedConversationId,
} from '@/lib/seed/conversations';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
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
    return (
      <ForgeAppCanvas
        desktopViewportLock
        className={`${display.variable} ${sans.variable}`}
        style={{
          fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
          <ConversationThread
            meta={meta}
            initialMessages={buildSeedMessages(conversationId)}
            viewerUserId="seed-demo-viewer"
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
          <ConversationThread
            meta={meta}
            initialMessages={messages}
            hasMoreInitial={hasMore}
            viewerUserId={user.id}
          />
        </div>
        <ForgeAppBottomNav active="messages" />
      </NotificationsProvider>
    </ForgeAppCanvas>
  );
}
