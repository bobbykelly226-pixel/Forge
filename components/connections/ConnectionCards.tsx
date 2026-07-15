'use client';

import Link from 'next/link';
import { Bookmark, Check, Heart, MessageCircle, RotateCcw, Send, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';

import RecognitionFlowDrawer from '@/components/character-signals/RecognitionFlowDrawer';
import {
  ConnectionAlignment,
  ConnectionIdentity,
  ConnectionPortrait,
  ImportantFactorsBadge,
} from '@/components/connections/ConnectionPortrait';
import { useConnectionsHub } from '@/components/connections/ConnectionsHubProvider';
import ViewOpenToChatNoteDrawer from '@/components/connections/ViewOpenToChatNoteDrawer';
import { RECOGNITION_RECIPIENTS } from '@/lib/character-signals-mock';
import type {
  HubProfileCard,
  IncomingInterestItem,
  IncomingOpenToChatItem,
  MutualConnectionItem,
  SavedHubItem,
  SentHubItem,
} from '@/lib/data/connections-hub';
import { isDemoProfileId } from '@/lib/demo/demo-access';

const cardShell =
  'overflow-hidden rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_12px_40px_rgba(11,45,92,0.06)] backdrop-blur-sm';

function ViewProfileLink({
  profileId,
  className = '',
}: {
  profileId: string;
  className?: string;
}) {
  return (
    <Link
      href={`/discovery/profile/${profileId}`}
      className={`inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C]/35 hover:bg-[#FBF9F6] ${className}`}
    >
      View Profile
    </Link>
  );
}

export function OpenToChatRequestCard({ profile }: { profile: IncomingOpenToChatItem }) {
  const {
    getOpenToChatStatus,
    acceptOpenToChat,
    saveOpenToChatForLater,
    declineOpenToChat,
    acceptTriggerRef,
  } = useConnectionsHub();

  const status = getOpenToChatStatus(profile.id);

  if (status === 'declined') return null;

  const isAccepted = status === 'accepted';
  const isSavedLater = status === 'saved_later';
  const hasNote = Boolean(profile.note && profile.note.trim().length > 0);

  return (
    <article className={cardShell}>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6 lg:gap-6 lg:p-7">
        <ConnectionPortrait profile={profile} size="md" />
        <div className="min-w-0 flex-1">
          <ConnectionIdentity profile={profile} />
          <ConnectionAlignment profile={profile} />
          {profile.aboutPreview ? (
            <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">{profile.aboutPreview}</p>
          ) : null}
          {hasNote ? (
            <div className="mt-4 rounded-2xl border border-[#0B2D5C]/08 bg-[#FBF9F6] px-4 py-4">
              <p className="text-sm font-semibold text-[#0B2D5C]">
                {profile.firstName} included a note
              </p>
              <blockquote className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#3D4654]">
                “{profile.note}”
              </blockquote>
            </div>
          ) : (
            <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
              {profile.firstName} is open to a conversation and would like to learn more before
              deciding.
            </p>
          )}
          <p className="mt-2 text-xs text-[#8A93A0]">Received {profile.relativeTime}</p>
          {isSavedLater && (
            <p className="mt-3 inline-flex rounded-full bg-[#E8EEF6] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
              Saved for Later
            </p>
          )}
          {isAccepted && (
            <p className="mt-3 inline-flex rounded-full bg-[#E8EEF6] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
              Conversation opened
            </p>
          )}
        </div>
      </div>
      {!isAccepted && (
        <div
          className="flex flex-col gap-2 border-t border-[#0B2D5C]/08 px-5 py-4 sm:flex-row sm:flex-wrap sm:px-6 lg:px-7"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={acceptTriggerRef}
            type="button"
            onClick={() => acceptOpenToChat(profile.id, profile.firstName)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] sm:min-w-[10rem]"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Open Conversation
          </button>
          {!isSavedLater && (
            <button
              type="button"
              onClick={() => saveOpenToChatForLater(profile.id, profile.firstName)}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-[#FBF9F6] px-4 py-3 text-sm font-semibold text-[#0B2D5C] transition hover:bg-white sm:min-w-[9rem]"
            >
              Not Right Now
            </button>
          )}
          <button
            type="button"
            onClick={() => declineOpenToChat(profile.id, profile.firstName)}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#0B2D5C]/12 bg-white px-4 py-3 text-sm font-semibold text-[#6B7585] transition hover:text-[#0B2D5C] sm:min-w-[9rem]"
          >
            Decline Privately
          </button>
          <ViewProfileLink profileId={profile.id} className="w-full sm:w-auto" />
        </div>
      )}
      {isAccepted && (
        <div className="border-t border-[#0B2D5C]/08 px-5 py-4 sm:px-6 lg:px-7">
          <ViewProfileLink profileId={profile.id} />
        </div>
      )}
    </article>
  );
}

export function InterestReceivedCard({ profile }: { profile: IncomingInterestItem }) {
  const { getInterestStatus, expressMutualInterest, declineInterest } = useConnectionsHub();
  const status = getInterestStatus(profile.id);

  if (status === 'declined') return null;

  const isMutual = status === 'mutual';

  return (
    <article className={cardShell}>
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex gap-4">
          <ConnectionPortrait profile={profile} size="md" />
          <div>
            <ConnectionIdentity profile={profile} />
            <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
              {profile.firstName} expressed interest in connecting if the feeling is mutual.
            </p>
            {isMutual && (
              <p className="mt-3 text-sm font-semibold text-[#0B2D5C]">
                You and {profile.firstName} have both expressed interest.
              </p>
            )}
          </div>
        </div>
        {!isMutual && (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => expressMutualInterest(profile.id, profile.firstName)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D62828] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#A61F1F]"
            >
              <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Interested Too
            </button>
            <ViewProfileLink profileId={profile.id} />
            <button
              type="button"
              onClick={() => declineInterest(profile.id, profile.firstName)}
              className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/12 px-4 py-3 text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
            >
              Not for Me
            </button>
          </div>
        )}
        {isMutual && (
          <div className="mt-5 flex gap-2">
            <ViewProfileLink profileId={profile.id} />
          </div>
        )}
      </div>
    </article>
  );
}

export function MutualConnectionCard({
  profile,
}: {
  profile: MutualConnectionItem | HubProfileCard;
}) {
  const { isMutualConversationReady, startMutualConversation } = useConnectionsHub();
  const ready = isMutualConversationReady(profile.id);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const recognizeTriggerRef = useRef<HTMLButtonElement>(null);
  const isDemo = isDemoProfileId(profile.id);

  const relativeTime =
    'relativeTime' in profile && typeof profile.relativeTime === 'string'
      ? profile.relativeTime
      : null;

  const recipient = isDemo
    ? null
    : (RECOGNITION_RECIPIENTS.find((entry) => entry.id === profile.id) ?? null);

  return (
    <article className={cardShell}>
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(12rem,28%)_minmax(0,1fr)] lg:gap-6">
        <ConnectionPortrait profile={profile} size="lg" />
        <div className="p-5 sm:p-6 lg:p-7 lg:pl-0">
          <ConnectionIdentity profile={profile} />
          <ConnectionAlignment profile={profile} />
          <ImportantFactorsBadge profile={profile} />
          {profile.characterSignals.length > 0 && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Character Signals
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.characterSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1 text-xs font-medium text-[#0B2D5C]"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </>
          )}
          <p className="mt-4 text-xs text-[#8A93A0]">
            {relativeTime ? `Connected ${relativeTime}` : 'Connected'} · Not yet messaging
          </p>
          {ready && !isDemo && (
            <div className="mt-4 rounded-2xl border border-[#0B2D5C]/10 bg-[#E8EEF6] px-4 py-3">
              <p className="text-sm font-semibold text-[#0B2D5C]">Conversation Ready</p>
              <p className="mt-1 text-xs leading-relaxed text-[#5A6575]">
                Messaging will be available here once the communication system is connected.
              </p>
            </div>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap" onClick={(e) => e.stopPropagation()}>
            {isDemo ? (
              <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/12 px-4 py-3 text-sm font-medium text-[#8A93A0]">
                Start Conversation · Demo only
              </span>
            ) : !ready ? (
              <button
                type="button"
                onClick={() => startMutualConversation(profile.id, profile.firstName)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Start Conversation
              </button>
            ) : null}
            <ViewProfileLink profileId={profile.id} />
            {recipient && (
              <button
                ref={recognizeTriggerRef}
                type="button"
                onClick={() => setRecognitionOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
              >
                <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Recognize a Positive Quality
              </button>
            )}
          </div>
        </div>
      </div>

      {recipient && (
        <RecognitionFlowDrawer
          open={recognitionOpen}
          recipient={recipient}
          onClose={() => {
            setRecognitionOpen(false);
            window.requestAnimationFrame(() => recognizeTriggerRef.current?.focus());
          }}
          successReturnLabel="Return to Connections"
        />
      )}
    </article>
  );
}

export function SavedProfileCard({ profile }: { profile: SavedHubItem }) {
  const {
    isSavedRemoved,
    removeSavedProfile,
    getSavedActionState,
    handleSavedInterested,
    handleUndoSavedInterested,
    handleSavedOpenToChat,
    registerSavedOpenToChatTrigger,
  } = useConnectionsHub();

  const openToChatRef = useRef<HTMLButtonElement>(null);
  const actionState = getSavedActionState(profile.id);

  if (isSavedRemoved(profile.id)) return null;

  const setOpenToChatRef = (node: HTMLButtonElement | null) => {
    openToChatRef.current = node;
    registerSavedOpenToChatTrigger(profile.id, node);
  };

  return (
    <article className={cardShell}>
      <div className="flex flex-col sm:flex-row">
        <ConnectionPortrait profile={profile} size="md" />
        <div className="flex-1 p-5 sm:p-6">
          <ConnectionIdentity profile={profile} />
          <ConnectionAlignment profile={profile} />
          <ImportantFactorsBadge profile={profile} />
          <p className="mt-2 text-xs text-[#8A93A0]">Saved {profile.relativeTime}</p>
          <div
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <ViewProfileLink profileId={profile.id} />
            <button
              type="button"
              aria-pressed={actionState.interested}
              onClick={() => {
                if (!actionState.interested) {
                  handleSavedInterested(profile.id, profile.firstName);
                }
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] ${
                actionState.interested
                  ? 'bg-[#A61F1F] text-white ring-2 ring-[#D62828]/35 ring-offset-2 ring-offset-white'
                  : 'bg-[#D62828] text-white hover:bg-[#A61F1F]'
              }`}
            >
              {actionState.interested ? (
                <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              ) : (
                <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
              Interested
            </button>
            <button
              ref={setOpenToChatRef}
              type="button"
              disabled={actionState.openToChatSent}
              aria-disabled={actionState.openToChatSent}
              onClick={() => handleSavedOpenToChat(profile.id, profile.firstName)}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] disabled:cursor-not-allowed disabled:opacity-70 ${
                actionState.openToChatSent
                  ? 'border-[#0B2D5C]/25 bg-[#E8EEF6] text-[#0B2D5C]'
                  : 'border-[#0B2D5C]/20 bg-white text-[#0B2D5C] hover:bg-[#FBF9F6]'
              }`}
            >
              <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {actionState.openToChatSent ? 'Request Sent' : 'Open to Chat'}
            </button>
            <button
              type="button"
              onClick={() => removeSavedProfile(profile.id, profile.firstName)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/12 px-4 py-2.5 text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
            >
              <Bookmark className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Remove from Saved
            </button>
          </div>
          {actionState.interested && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#0B2D5C]/08 bg-[#F8F6F2] px-4 py-3">
              <p className="text-xs leading-relaxed text-[#5A6575] sm:text-sm">
                If {profile.firstName} is also interested, Forge will let you both know.
              </p>
              <button
                type="button"
                onClick={() => handleUndoSavedInterested(profile.id, profile.firstName)}
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                Undo
              </button>
            </div>
          )}
          {actionState.openToChatSent && (
            <p className="mt-3 text-xs leading-relaxed text-[#5A6575]">
              Request sent — {profile.firstName} can accept, decline privately, or respond later.
              No additional request can be sent in this session.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function SentActivityCard({ entry }: { entry: SentHubItem }) {
  const { isSentWithdrawn, withdrawSentActivity } = useConnectionsHub();
  const profile = entry.profile;
  const [noteOpen, setNoteOpen] = useState(false);
  const noteTriggerRef = useRef<HTMLButtonElement>(null);

  if (isSentWithdrawn(entry.id)) return null;

  const displayProfile: HubProfileCard =
    profile ??
    ({
      id: entry.profileId,
      firstName: 'Member',
      age: null,
      location: 'Unavailable',
      alignmentLabel: 'Alignment pending',
      confidence: 'Emerging',
      hasImportantFactors: false,
      aboutPreview: 'This profile is no longer available in Discovery.',
      characterSignals: [],
      portraitGradient: 'linear-gradient(160deg, #1B2F4A 0%, #3E566F 50%, #A8927D 100%)',
      photoUrl: null,
    } satisfies HubProfileCard);

  const typeLabel = entry.type === 'interested' ? 'Interested' : 'Open to Chat';
  const isOpenToChat = entry.type === 'open_to_chat';
  const hasNote = isOpenToChat && typeof entry.note === 'string' && entry.note.trim().length > 0;
  const noteLabel = isOpenToChat ? (hasNote ? 'Note included' : 'No note') : null;

  return (
    <>
      <article className={cardShell}>
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <ConnectionPortrait profile={displayProfile} size="sm" />
          <div className="min-w-0 flex-1">
            <h3
              className="text-lg text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {displayProfile.firstName}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#F8F6F2] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
                {typeLabel}
              </span>
              <span className="rounded-full border border-[#0B2D5C]/12 px-3 py-1 text-xs font-medium text-[#5A6575]">
                {entry.statusLabel}
              </span>
              {noteLabel && (
                <span className="rounded-full border border-[#0B2D5C]/12 px-3 py-1 text-xs font-medium text-[#5A6575]">
                  {noteLabel}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-[#8A93A0]">{entry.relativeTime}</p>
            <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              {!entry.unavailable && <ViewProfileLink profileId={entry.profileId} />}
              {hasNote && entry.note && (
                <button
                  ref={noteTriggerRef}
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/12 px-4 py-2.5 text-sm font-medium text-[#0B2D5C] transition hover:bg-[#FBF9F6]"
                >
                  View Note
                </button>
              )}
              {entry.canWithdraw && (
                <button
                  type="button"
                  onClick={() => withdrawSentActivity(entry.id, displayProfile.firstName)}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/12 px-4 py-2.5 text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {hasNote && entry.note && (
        <ViewOpenToChatNoteDrawer
          open={noteOpen}
          profileName={displayProfile.firstName}
          note={entry.note}
          onClose={() => {
            setNoteOpen(false);
            window.requestAnimationFrame(() => noteTriggerRef.current?.focus());
          }}
        />
      )}
    </>
  );
}

export function ForYouOverviewCard({
  profile,
  variant,
}: {
  profile: HubProfileCard & { note?: string | null; relativeTime?: string };
  variant: 'open_to_chat' | 'interest' | 'mutual';
}) {
  const {
    acceptOpenToChat,
    expressMutualInterest,
    startMutualConversation,
    declineInterest,
    getOpenToChatStatus,
    getInterestStatus,
    isMutualConversationReady,
  } = useConnectionsHub();

  if (variant === 'open_to_chat' && getOpenToChatStatus(profile.id) === 'declined') {
    return null;
  }

  if (variant === 'interest' && getInterestStatus(profile.id) === 'declined') {
    return null;
  }

  const conversationReady =
    variant === 'mutual' && isMutualConversationReady(profile.id);
  const incomingNote = variant === 'open_to_chat' ? profile.note ?? null : null;
  const hasIncomingNote = Boolean(incomingNote && incomingNote.trim().length > 0);

  return (
    <article className={`${cardShell} p-5 sm:p-6`}>
      <div className="flex gap-4">
        <ConnectionPortrait profile={profile} size="md" />
        <div className="min-w-0 flex-1">
          <ConnectionIdentity profile={profile} compact />
          {variant !== 'interest' && <ConnectionAlignment profile={profile} showConfidence />}
          {variant === 'open_to_chat' &&
            (hasIncomingNote ? (
              <div className="mt-3 rounded-2xl border border-[#0B2D5C]/08 bg-[#FBF9F6] px-3.5 py-3">
                <p className="text-xs font-semibold text-[#0B2D5C]">
                  {profile.firstName} included a note
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5A6575]">
                  “{incomingNote}”
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
                {profile.firstName} is open to a conversation and would like to learn more before
                deciding.
              </p>
            ))}
          {variant === 'interest' && (
            <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
              {profile.firstName} expressed interest in connecting if the feeling is mutual.
            </p>
          )}
          {variant === 'mutual' && (
            <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
              {profile.firstName} and you have both expressed interest.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {variant === 'open_to_chat' && (
          <button
            type="button"
            onClick={() => acceptOpenToChat(profile.id, profile.firstName)}
            className="rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2540]"
          >
            Review Request
          </button>
        )}
        {variant === 'interest' && (
          <button
            type="button"
            onClick={() => expressMutualInterest(profile.id, profile.firstName)}
            className="rounded-2xl bg-[#D62828] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A61F1F]"
          >
            Interested Too
          </button>
        )}
        {variant === 'mutual' && !conversationReady && (
          <button
            type="button"
            onClick={() => startMutualConversation(profile.id, profile.firstName)}
            className="rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2540]"
          >
            Start Conversation
          </button>
        )}
        {conversationReady && (
          <span className="rounded-2xl border border-[#0B2D5C]/12 bg-[#E8EEF6] px-4 py-2.5 text-sm font-semibold text-[#0B2D5C]">
            Conversation Ready
          </span>
        )}
        <ViewProfileLink profileId={profile.id} />
        {variant === 'interest' && (
          <button
            type="button"
            onClick={() => declineInterest(profile.id, profile.firstName)}
            className="rounded-2xl border border-[#0B2D5C]/12 px-4 py-2.5 text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
          >
            Not for Me
          </button>
        )}
      </div>
    </article>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/75 px-8 py-14 text-center shadow-[0_12px_40px_rgba(11,45,92,0.05)]">
      <h2
        className="text-xl tracking-[-0.01em] text-[#0B2D5C]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#5A6575]">
        {description}
      </p>
    </section>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]">
      {children}
    </h2>
  );
}
