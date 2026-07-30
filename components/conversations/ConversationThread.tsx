'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { ChevronDown, ChevronUp, FileUp, Paperclip, Smile, X } from 'lucide-react';

import {
  listConversationMessagesAction,
  sendConversationMessageAction,
} from '@/app/actions/conversations';
import ConversationSafetyMenu from '@/components/conversations/ConversationSafetyMenu';
import MessageAttachment from '@/components/conversations/MessageAttachment';
import ConversationStarters from '@/components/conversations/ConversationStarters';
import { partnerSaidLabel, viewerSaidLabel } from '@/lib/compatibility/answer-labels';
import {
  createAttachmentPath,
  readImageDimensions,
  sanitizeAttachmentName,
  validateMessageAttachment,
} from '@/lib/conversations/attachments';
import {
  normalizeComposerOutboundText,
  shouldSubmitComposerOnKeyDown,
} from '@/lib/conversations/composer';
import {
  MESSAGE_ATTACHMENT_BUCKET,
  MESSAGE_EMOJI_OPTIONS,
  MESSAGE_MAX_LENGTH,
} from '@/lib/conversations/constants';
import { formatConversationTimestamp } from '@/lib/conversations/format';
import {
  calculateVisibleConversationHeight,
  isLikelyMobileKeyboardOpen,
} from '@/lib/conversations/mobile-viewport';
import type {
  ConversationAlignmentContext,
  ConversationAttachmentInput,
  ConversationMessage,
  ConversationStarter,
  ConversationThreadMeta,
} from '@/lib/conversations/types';
import { createClient } from '@/lib/supabase/client';

type ConversationThreadProps = {
  meta: ConversationThreadMeta;
  initialMessages: ConversationMessage[];
  hasMoreInitial?: boolean;
  viewerUserId: string;
  alignmentContext: ConversationAlignmentContext | null;
  starters: ConversationStarter[];
  isSeed?: boolean;
};

function createClientMessageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sortMessagesChronologically(messages: ConversationMessage[]): ConversationMessage[] {
  return [...messages].sort((a, b) => {
    const timeCompare = a.createdAt.localeCompare(b.createdAt);
    if (timeCompare !== 0) return timeCompare;
    return a.id.localeCompare(b.id);
  });
}

function mergeMessages(
  existing: ConversationMessage[],
  incoming: ConversationMessage[]
): ConversationMessage[] {
  const byKey = new Map<string, ConversationMessage>();
  for (const message of existing) {
    const key = message.clientMessageId ?? message.id;
    byKey.set(key, message);
  }
  for (const message of incoming) {
    const key = message.clientMessageId ?? message.id;
    byKey.set(key, message);
  }
  return sortMessagesChronologically(Array.from(byKey.values()));
}

export default function ConversationThread({
  meta,
  initialMessages,
  hasMoreInitial = false,
  viewerUserId,
  alignmentContext,
  starters,
  isSeed = false,
}: ConversationThreadProps) {
  const composerId = useId();
  const liveRegionId = useId();
  const threadRootRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const composerTextRef = useRef('');
  const refreshingMessagesRef = useRef(false);
  const refreshQueuedRef = useRef(false);

  const [messages, setMessages] = useState<ConversationMessage[]>(() =>
    sortMessagesChronologically(initialMessages)
  );
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
  const [threadStatus, setThreadStatus] = useState(meta.status);
  const [endedByViewer, setEndedByViewer] = useState(meta.endedByViewer);
  const [blockedByViewer, setBlockedByViewer] = useState(meta.blockedByViewer);
  const [liveMessage, setLiveMessage] = useState('');

  const profileHref = `/discovery/profile/${meta.peerUserId}`;
  const composerDisabled = threadStatus === 'ended' || meta.isBlocked || sending || uploading;
  const youSaid = viewerSaidLabel();
  const theySaid = partnerSaidLabel(meta.peerFirstName);
  const hasTwoWayExchange =
    messages.some((message) => message.senderId === viewerUserId) &&
    messages.some((message) => message.senderId !== viewerUserId);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const syncMobileViewport = useCallback(() => {
    const viewport = window.visualViewport;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    if (!viewport || isDesktop) {
      setKeyboardOpen(false);
      setMobileViewportHeight(null);
      return;
    }

    const nextKeyboardOpen = isLikelyMobileKeyboardOpen(
      window.innerHeight,
      viewport.height
    );
    setKeyboardOpen(nextKeyboardOpen);

    if (!nextKeyboardOpen) {
      setMobileViewportHeight(null);
      return;
    }

    const threadTop =
      threadRootRef.current?.getBoundingClientRect().top ?? viewport.offsetTop;
    setMobileViewportHeight(
      calculateVisibleConversationHeight({
        visualViewportHeight: viewport.height,
        visualViewportOffsetTop: viewport.offsetTop,
        threadTop,
      })
    );

    if (document.activeElement === textareaRef.current) {
      requestAnimationFrame(() => scrollToBottom('auto'));
    }
  }, [scrollToBottom]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const initialFrame = requestAnimationFrame(syncMobileViewport);
    viewport.addEventListener('resize', syncMobileViewport);
    viewport.addEventListener('scroll', syncMobileViewport, { passive: true });
    window.addEventListener('resize', syncMobileViewport);

    return () => {
      cancelAnimationFrame(initialFrame);
      viewport.removeEventListener('resize', syncMobileViewport);
      viewport.removeEventListener('scroll', syncMobileViewport);
      window.removeEventListener('resize', syncMobileViewport);
    };
  }, [syncMobileViewport]);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      scrollToBottom(messages.length <= initialMessages.length ? 'auto' : 'smooth');
    }
  }, [messages, initialMessages.length, scrollToBottom]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;

    const oldest = messages[0];
    if (!oldest) return;

    setLoadingOlder(true);
    shouldStickToBottomRef.current = false;

    try {
      if (isSeed) {
        setHasMore(false);
        return;
      }

      const result = await listConversationMessagesAction(meta.conversationId, {
        before: oldest.createdAt,
        beforeId: oldest.id,
      });

      if (!result.success) {
        setLiveMessage(result.message ?? 'Could not load earlier messages.');
        return;
      }
      if (!result.data) {
        setLiveMessage('Could not load earlier messages.');
        return;
      }

      const container = scrollContainerRef.current;
      const previousHeight = container?.scrollHeight ?? 0;

      setMessages((current) => mergeMessages(result.data!.messages, current));
      setHasMore(result.data.hasMore);

      requestAnimationFrame(() => {
        const nextContainer = scrollContainerRef.current;
        if (!nextContainer) return;
        const nextHeight = nextContainer.scrollHeight;
        nextContainer.scrollTop = nextHeight - previousHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  };

  const refreshMessages = useCallback(async () => {
    if (isSeed) return;
    if (refreshingMessagesRef.current) {
      refreshQueuedRef.current = true;
      return;
    }
    refreshingMessagesRef.current = true;
    try {
      do {
        refreshQueuedRef.current = false;
        const result = await listConversationMessagesAction(meta.conversationId);
        if (result.success && result.data) {
          setMessages((current) => mergeMessages(current, result.data!.messages));
        }
      } while (refreshQueuedRef.current);
    } finally {
      refreshingMessagesRef.current = false;
    }
  }, [isSeed, meta.conversationId]);

  useEffect(() => {
    if (isSeed) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${meta.conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${meta.conversationId}`,
        },
        () => {
          void refreshMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${meta.conversationId}`,
        },
        (payload) => {
          const next = payload.new as {
            status?: string;
            ended_by_user_id?: string | null;
          };
          if (next.status === 'ended') {
            setThreadStatus('ended');
            setEndedByViewer(next.ended_by_user_id === viewerUserId);
          }
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshMessages();
      }
    }, 5000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshMessages();
      }
    };
    const handleFocus = () => void refreshMessages();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      void supabase.removeChannel(channel);
    };
  }, [isSeed, meta.conversationId, refreshMessages, viewerUserId]);

  const sendMessage = async (
    body: string,
    existingClientMessageId?: string,
    existingAttachment?: ConversationAttachmentInput
  ) => {
    const outbound = normalizeComposerOutboundText(body);
    const pendingFile = existingAttachment ? null : selectedFile;
    if ((!outbound && !pendingFile && !existingAttachment) || sending || composerDisabled) {
      return false;
    }

    const clientMessageId = existingClientMessageId ?? createClientMessageId();
    let attachment = existingAttachment;

    if (pendingFile && !isSeed) {
      const validationMessage = validateMessageAttachment(pendingFile);
      if (validationMessage) {
        setLiveMessage(validationMessage);
        return false;
      }

      setUploading(true);
      const objectId = createClientMessageId();
      const path = createAttachmentPath(
        meta.conversationId,
        viewerUserId,
        pendingFile.name,
        objectId
      );
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(MESSAGE_ATTACHMENT_BUCKET)
        .upload(path, pendingFile, {
          cacheControl: '3600',
          contentType: pendingFile.type,
          upsert: false,
        });
      setUploading(false);
      if (error) {
        setLiveMessage('That attachment could not be uploaded. Please try again.');
        return false;
      }
      attachment = {
        storage_path: path,
        file_name: sanitizeAttachmentName(pendingFile.name),
        mime_type: pendingFile.type,
        file_size: pendingFile.size,
        width: null,
        height: null,
      };
      if (pendingFile.type.startsWith('image/')) {
        const dimensions = await readImageDimensions(pendingFile).catch(() => null);
        if (!dimensions) {
          await supabase.storage.from(MESSAGE_ATTACHMENT_BUCKET).remove([path]);
          setLiveMessage('That image could not be read. Choose another photo.');
          return false;
        }
        attachment.width = dimensions.width;
        attachment.height = dimensions.height;
      }
    }

    const optimisticMessage: ConversationMessage = {
      id: `optimistic-${clientMessageId}`,
      conversationId: meta.conversationId,
      senderId: viewerUserId,
      body: outbound ?? '',
      attachments: attachment
        ? [
            {
              id: null,
              storagePath: attachment.storage_path,
              fileName: attachment.file_name,
              mimeType: attachment.mime_type,
              fileSize: attachment.file_size,
              attachmentKind: attachment.mime_type.startsWith('image/') ? 'photo' : 'file',
              width: attachment.width,
              height: attachment.height,
              position: 0,
            },
          ]
        : [],
      clientMessageId,
      createdAt: new Date().toISOString(),
      localStatus: 'pending',
    };

    setSending(true);
    composerTextRef.current = '';
    setComposerText('');
    setSelectedFile(null);
    setEmojiOpen(false);
    setMessages((current) => mergeMessages(current, [optimisticMessage]));

    try {
      if (isSeed) {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        const sentMessage: ConversationMessage = {
          ...optimisticMessage,
          id: `seed-${clientMessageId}`,
          localStatus: 'sent',
        };
        setMessages((current) =>
          current.map((message) =>
            message.clientMessageId === clientMessageId ? sentMessage : message
          )
        );
        setLiveMessage('Message sent.');
        return true;
      }

      const result = await sendConversationMessageAction({
        conversationId: meta.conversationId,
        body: outbound ?? '',
        clientMessageId,
        attachment,
      });

      if (!result.success) {
        setMessages((current) =>
          current.map((message) =>
            message.clientMessageId === clientMessageId
              ? { ...message, localStatus: 'failed' }
              : message
          )
        );
        setLiveMessage(result.message ?? 'Message could not be sent.');
        return false;
      }
      if (!result.data) {
        setMessages((current) =>
          current.map((message) =>
            message.clientMessageId === clientMessageId
              ? { ...message, localStatus: 'failed' }
              : message
          )
        );
        setLiveMessage('Message could not be sent.');
        return false;
      }

      setMessages((current) =>
        current.map((message) =>
          message.clientMessageId === clientMessageId ? result.data! : message
        )
      );
      void refreshMessages();
      setLiveMessage('Message sent.');
      return true;
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.clientMessageId === clientMessageId
            ? { ...message, localStatus: 'failed' }
            : message
        )
      );
      setLiveMessage('Message could not be sent.');
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (!shouldSubmitComposerOnKeyDown(event)) {
      return;
    }
    event.preventDefault();
    void sendMessage(event.currentTarget.value);
  };

  const handleSendClick = () => {
    void sendMessage(textareaRef.current?.value ?? composerTextRef.current);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;
    const validationMessage = validateMessageAttachment(file);
    if (validationMessage) {
      setLiveMessage(validationMessage);
      return;
    }
    setSelectedFile(file);
    setLiveMessage(`${file.name} ready to send.`);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? composerText.length;
    const end = textarea?.selectionEnd ?? composerText.length;
    const next = `${composerText.slice(0, start)}${emoji}${composerText.slice(end)}`.slice(
      0,
      MESSAGE_MAX_LENGTH
    );
    composerTextRef.current = next;
    setComposerText(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = Math.min(start + emoji.length, next.length);
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  const handleStarterSelect = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setComposerText((current) => {
        const next = current ? `${current}\n\n${text}` : text;
        composerTextRef.current = next;
        return next;
      });
      return;
    }
    const start = textarea.selectionStart ?? composerText.length;
    const end = textarea.selectionEnd ?? composerText.length;
    const next =
      composerText.slice(0, start) +
      (composerText && start > 0 ? '\n\n' : '') +
      text +
      composerText.slice(end);
    composerTextRef.current = next;
    setComposerText(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + (composerText && start > 0 ? 2 : 0) + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const remainingChars = MESSAGE_MAX_LENGTH - composerText.length;
  const showConnectionContext =
    Boolean(alignmentContext) &&
    !hasTwoWayExchange &&
    !composerFocused &&
    !keyboardOpen;

  return (
    <div
      ref={threadRootRef}
      className="flex h-[calc(100dvh-9rem)] min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#0B2D5C]/08 bg-[#FBF9F6] shadow-sm lg:h-[calc(100dvh-5rem)]"
      style={
        mobileViewportHeight === null
          ? undefined
          : { height: `${mobileViewportHeight}px` }
      }
    >
      <header className="sticky top-0 z-30 border-b border-[#0B2D5C]/10 bg-[#FBF9F6]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <Link
              href="/connections?tab=conversations"
              className="text-xs font-medium text-[#7A8494] transition hover:text-[#0B2D5C]"
            >
              ← Messages
            </Link>
            <h1
              className="mt-1 truncate text-xl tracking-[-0.02em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              <Link href={profileHref} className="transition hover:text-[#0A2540]">
                {meta.peerFirstName}
              </Link>
            </h1>
          </div>
          <ConversationSafetyMenu
            peerUserId={meta.peerUserId}
            peerFirstName={meta.peerFirstName}
            connectionId={meta.connectionId}
            conversationId={meta.conversationId}
            profileHref={profileHref}
            isSeed={isSeed}
            onEnded={() => {
              setThreadStatus('ended');
              setEndedByViewer(true);
            }}
            onBlocked={() => {
              setThreadStatus('ended');
              setEndedByViewer(true);
              setBlockedByViewer(true);
            }}
          />
        </div>
      </header>

      {showConnectionContext && alignmentContext ? (
        <section className="border-b border-[#0B2D5C]/08 bg-white/70">
          <div className="mx-auto max-w-2xl px-4 sm:px-5">
            <button
              type="button"
              onClick={() => setContextExpanded((open) => !open)}
              className="flex w-full items-center justify-between gap-3 py-4 text-left"
              aria-expanded={contextExpanded}
            >
              <span
                className="text-base font-semibold text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Forge connection context
              </span>
              {contextExpanded ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-[#7A8494]" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-[#7A8494]" strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
            {contextExpanded ? (
              <div className="space-y-6 pb-5">
                {alignmentContext.whyIntroduced.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                      Why Forge introduced you
                    </p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[#3D4654]">
                      {alignmentContext.whyIntroduced.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D62828]">
                    Relationship Alignment
                  </p>
                  <p
                    className="mt-1.5 text-base font-semibold text-[#0B2D5C]"
                    style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                  >
                    {alignmentContext.alignmentLabel}
                  </p>
                </div>

                {alignmentContext.importantFactors.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                      Important Alignment Factors
                    </p>
                    <ul className="mt-3 space-y-4">
                      {alignmentContext.importantFactors.map((factor) => (
                        <li
                          key={factor.title}
                          className="rounded-2xl border border-[#0B2D5C]/08 bg-[#F8F6F2] p-4"
                        >
                          <h3 className="text-base font-semibold text-[#0B2D5C]">{factor.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
                            {factor.explanation}
                          </p>
                          {(factor.viewerAnswer || factor.partnerAnswer) && (
                            <dl className="mt-4 space-y-3">
                              {factor.viewerAnswer ? (
                                <div className="rounded-xl bg-white px-3 py-2.5">
                                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                                    {youSaid}
                                  </dt>
                                  <dd className="mt-1 text-sm font-medium text-[#0B2D5C]">
                                    “{factor.viewerAnswer}”
                                  </dd>
                                </div>
                              ) : null}
                              {factor.partnerAnswer ? (
                                <div className="rounded-xl bg-white px-3 py-2.5">
                                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                                    {theySaid}
                                  </dt>
                                  <dd className="mt-1 text-sm font-medium text-[#0B2D5C]">
                                    “{factor.partnerAnswer}”
                                  </dd>
                                </div>
                              ) : null}
                            </dl>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {alignmentContext.incompleteAssessmentCopy ? (
                  <p className="text-sm leading-relaxed text-[#7A8494]">
                    {alignmentContext.incompleteAssessmentCopy}
                  </p>
                ) : null}

                <Link
                  href={profileHref}
                  className="inline-flex text-sm font-semibold text-[#0B2D5C] underline-offset-2 hover:underline"
                >
                  View profile
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {threadStatus === 'ended' ? (
        <div
          className="border-b border-[#0B2D5C]/08 bg-[#F8F6F2] px-4 py-3 text-center text-sm text-[#5A6575] sm:px-5"
          role="status"
        >
          {blockedByViewer
            ? `You blocked ${meta.peerFirstName}. You can keep this history for your records, but messaging is closed.`
            : endedByViewer
              ? 'You ended this connection. Your shared history remains available, but messaging is closed.'
              : 'This connection was ended. Your shared history remains available, but messaging is closed.'}
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex max-w-2xl flex-col px-4 py-4 sm:px-5">
          {hasMore ? (
            <button
              type="button"
              onClick={() => void loadOlderMessages()}
              disabled={loadingOlder}
              className="mb-4 self-center rounded-full border border-[#0B2D5C]/15 bg-white px-4 py-2 text-sm font-medium text-[#0B2D5C] transition hover:bg-[#F8F6F2] disabled:opacity-60"
            >
              {loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </button>
          ) : null}

          <ul className="space-y-4" aria-live="off">
            {messages.map((message) => {
              const isSent = message.senderId === viewerUserId;
              const isFailed = message.localStatus === 'failed';
              const isPending = message.localStatus === 'pending';

              return (
                <li
                  key={message.clientMessageId ?? message.id}
                  className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                      isSent
                        ? 'rounded-br-md bg-[#0B2D5C] text-white'
                        : 'rounded-bl-md border border-[#0B2D5C]/08 bg-white text-[#0B2D5C]'
                    } ${isPending ? 'opacity-80' : ''}`}
                  >
                    {message.attachments.map((attachment) => (
                      <MessageAttachment
                        key={attachment.id ?? attachment.storagePath}
                        attachment={attachment}
                        isSent={isSent}
                      />
                    ))}
                    {message.body ? (
                      <p className={`${message.attachments.length ? 'mt-2' : ''} whitespace-pre-wrap break-words`}>
                        {message.body}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2 px-1">
                    <time
                      dateTime={message.createdAt}
                      className="text-[11px] text-[#8A93A0]"
                    >
                      {formatConversationTimestamp(message.createdAt)}
                      {isPending ? ' · Sending…' : ''}
                    </time>
                    {isFailed ? (
                      <button
                        type="button"
                        onClick={() =>
                          void sendMessage(
                            message.body,
                            message.clientMessageId ?? undefined,
                            message.attachments[0]
                              ? {
                                  storage_path: message.attachments[0].storagePath,
                                  file_name: message.attachments[0].fileName,
                                  mime_type: message.attachments[0].mimeType,
                                  file_size: message.attachments[0].fileSize,
                                  width: message.attachments[0].width,
                                  height: message.attachments[0].height,
                                }
                              : undefined
                          )
                        }
                        className="text-[11px] font-semibold text-[#D62828] underline-offset-2 hover:underline"
                      >
                        Retry
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </div>

      <div
        className="sticky bottom-0 shrink-0 border-t border-[#0B2D5C]/10 bg-[#FBF9F6]/95 backdrop-blur-md"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-2xl space-y-3 px-4 py-3 sm:px-5">
          {threadStatus !== 'ended' && !meta.isBlocked && !hasTwoWayExchange ? (
            <ConversationStarters starters={starters} onSelect={handleStarterSelect} />
          ) : null}

          <div className="rounded-[1.25rem] border border-[#0B2D5C]/12 bg-white p-3 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx"
              onChange={handleFileSelect}
              className="sr-only"
              tabIndex={-1}
            />
            {selectedFile ? (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-2.5">
                <FileUp className="h-5 w-5 shrink-0 text-[#0B2D5C]" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#0B2D5C]">
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-full p-1 text-[#7A8494] transition hover:bg-white hover:text-[#0B2D5C]"
                  aria-label={`Remove ${selectedFile.name}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <label htmlFor={composerId} className="sr-only">
              Message {meta.peerFirstName}
            </label>
            <textarea
              ref={textareaRef}
              id={composerId}
              value={composerText}
              onChange={(event) => {
                const next = event.target.value.slice(0, MESSAGE_MAX_LENGTH);
                composerTextRef.current = next;
                setComposerText(next);
              }}
              onKeyDown={handleComposerKeyDown}
              onFocus={() => {
                setComposerFocused(true);
                setContextExpanded(false);
                requestAnimationFrame(() => {
                  syncMobileViewport();
                  scrollToBottom('auto');
                });
              }}
              onBlur={() => {
                requestAnimationFrame(() => {
                  setComposerFocused(document.activeElement === textareaRef.current);
                  syncMobileViewport();
                });
              }}
              disabled={composerDisabled}
              rows={2}
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              autoComplete="off"
              inputMode="text"
              enterKeyHint="send"
              placeholder={
                threadStatus === 'ended'
                  ? 'Messaging is closed for this connection.'
                  : `Message ${meta.peerFirstName}…`
              }
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#0B2D5C] outline-none placeholder:text-[#8A93A0] disabled:opacity-60"
            />
            {emojiOpen ? (
              <div
                className="mt-2 grid grid-cols-10 gap-1 rounded-xl border border-[#0B2D5C]/10 bg-[#F8F6F2] p-2"
                aria-label="Choose an emoji"
              >
                {MESSAGE_EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-white"
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={composerDisabled}
                  className="rounded-full p-2 text-[#0B2D5C] transition hover:bg-[#F8F6F2] disabled:opacity-50"
                  aria-label="Attach a photo or file"
                >
                  <Paperclip className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setEmojiOpen((open) => !open)}
                  disabled={composerDisabled}
                  className="rounded-full p-2 text-[#0B2D5C] transition hover:bg-[#F8F6F2] disabled:opacity-50"
                  aria-label={emojiOpen ? 'Close emoji picker' : 'Choose an emoji'}
                  aria-expanded={emojiOpen}
                >
                  <Smile className="h-5 w-5" aria-hidden="true" />
                </button>
                <span
                  className={`ml-1 text-xs ${remainingChars < 100 ? 'text-[#D62828]' : 'text-[#8A93A0]'}`}
                  aria-live="polite"
                >
                  {remainingChars}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendClick}
                disabled={
                  composerDisabled ||
                  (composerText.trim().length === 0 && !selectedFile) ||
                  composerText.length > MESSAGE_MAX_LENGTH
                }
                className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2540] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
    </div>
  );
}
