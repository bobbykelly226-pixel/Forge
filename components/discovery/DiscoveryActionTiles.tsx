'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';
import {
  Bookmark,
  Check,
  Heart,
  Info,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';

import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';

type DiscoveryActionTilesProps = {
  profileId: string;
  profileName: string;
  layout: 'feed-grid' | 'profile-stack';
};

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}

function ActionTile({
  onClick,
  label,
  description,
  icon,
  variant,
  disabled = false,
  active = false,
  ariaPressed,
  actionRef,
}: {
  onClick: () => void;
  label: string;
  description: string;
  icon: ReactNode;
  variant: 'primary' | 'outline' | 'secondary' | 'saved';
  disabled?: boolean;
  active?: boolean;
  ariaPressed?: boolean;
  actionRef?: React.Ref<HTMLButtonElement>;
}) {
  const base =
    'flex w-full flex-col items-start gap-1 rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 lg:gap-1.5 lg:px-5 lg:py-4';

  const variants = {
    primary: active
      ? 'bg-[#A61F1F] text-white shadow-[0_10px_28px_rgba(214,40,40,0.22)] focus-visible:outline-[#D62828]'
      : 'bg-[#D62828] text-white shadow-[0_10px_28px_rgba(214,40,40,0.18)] hover:bg-[#A61F1F] focus-visible:outline-[#D62828]',
    outline:
      'border border-[#0B2D5C]/25 bg-white text-[#0B2D5C] hover:border-[#0B2D5C]/45 hover:bg-[#FBF9F6] focus-visible:outline-[#0B2D5C]',
    secondary:
      'border border-[#0B2D5C]/12 bg-[#FBF9F6] text-[#0B2D5C] hover:border-[#0B2D5C]/25 hover:bg-white focus-visible:outline-[#0B2D5C]',
    saved:
      'border border-[#0B2D5C]/20 bg-[#E8EEF6] text-[#0B2D5C] hover:border-[#0B2D5C]/30 focus-visible:outline-[#0B2D5C]',
  } as const;

  return (
    <button
      ref={actionRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      className={`${base} ${variants[variant]}`}
    >
      <span className="inline-flex w-full items-center gap-2.5">
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
        <span className="text-[15px] font-semibold lg:text-base">{label}</span>
      </span>
      <span
        className={`pl-8 text-xs leading-snug lg:pl-9 lg:text-[13px] ${
          variant === 'primary' ? 'text-white/85' : 'text-[#6B7585]'
        } hidden sm:block`}
      >
        {description}
      </span>
    </button>
  );
}

export default function DiscoveryActionTiles({
  profileId,
  profileName,
  layout,
}: DiscoveryActionTilesProps) {
  const {
    getState,
    handleInterested,
    handleUndoInterested,
    handleInterestedInfo,
    handleOpenToChat,
    handleOpenToChatInfo,
    handleSaveForLater,
    handleNotForMe,
    registerOpenToChatTrigger,
  } = useDiscoveryActions();

  const openToChatRef = useRef<HTMLButtonElement>(null);
  const state = getState(profileId);

  const setOpenToChatRef = (node: HTMLButtonElement | null) => {
    openToChatRef.current = node;
    registerOpenToChatTrigger(profileId, node);
  };

  const interestedUndo = state.interested ? (
    <div
      className={
        layout === 'feed-grid'
          ? 'col-span-1 flex items-center justify-between gap-3 rounded-2xl border border-[#0B2D5C]/08 bg-[#F8F6F2] px-4 py-3 sm:col-span-2'
          : 'flex items-center justify-between gap-3 rounded-2xl border border-[#0B2D5C]/08 bg-[#F8F6F2] px-4 py-3'
      }
    >
      <p className="text-xs leading-relaxed text-[#5A6575] sm:text-sm">
        If {profileName} is also interested, Forge will let you both know.
      </p>
      <button
        type="button"
        onClick={() => handleUndoInterested(profileId, profileName)}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828]"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        Undo
      </button>
    </div>
  ) : null;

  const openToChatInfoButton = (
    <button
      type="button"
      onClick={(event) => {
        stopPropagation(event);
        handleOpenToChatInfo(profileId, profileName);
      }}
      aria-label="Learn about Open to Chat"
      aria-haspopup="dialog"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/15 bg-white/80 text-[#6B7585] transition hover:border-[#0B2D5C]/30 hover:text-[#0B2D5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
    >
      <Info className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );

  const interestedInfoButton = (
    <button
      type="button"
      onClick={(event) => {
        stopPropagation(event);
        handleInterestedInfo(profileName);
      }}
      aria-label="What Interested means"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <Info className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );

  const openToChatTile = (
    <div className="flex items-stretch gap-2">
      <div className="min-w-0 flex-1">
        <ActionTile
          variant="outline"
          label={state.openToChatSent ? 'Request Sent' : 'Open to Chat'}
          description="Send a low-pressure chat request"
          disabled={state.openToChatSent}
          onClick={() => handleOpenToChat(profileId, profileName)}
          icon={<Send className="h-5 w-5" strokeWidth={1.75} />}
          actionRef={setOpenToChatRef}
        />
      </div>
      {openToChatInfoButton}
    </div>
  );

  if (layout === 'profile-stack') {
    return (
      <div className="flex flex-col gap-3" onClick={stopPropagation}>
        <div className="flex items-stretch gap-2">
          <div className="min-w-0 flex-1">
            <ActionTile
              variant="primary"
              label="Interested"
              description={`Let ${profileName} know you're interested`}
              active={state.interested}
              ariaPressed={state.interested}
              onClick={() => {
                if (!state.interested) handleInterested(profileId, profileName);
              }}
              icon={
                state.interested ? (
                  <Check className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <Heart className="h-5 w-5" strokeWidth={1.75} />
                )
              }
            />
          </div>
          {!state.interested ? interestedInfoButton : null}
        </div>
        {interestedUndo}

        <div className="flex items-stretch gap-2.5">
          <div className="min-w-0 flex-1">
            <button
              ref={setOpenToChatRef}
              type="button"
              disabled={state.openToChatSent}
              onClick={() => handleOpenToChat(profileId, profileName)}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/25 bg-white/80 px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C]/45 hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state.openToChatSent ? 'Request Sent' : 'Open to Chat'}
            </button>
          </div>
          {openToChatInfoButton}
        </div>

        <div className="mt-3 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => handleSaveForLater(profileId, profileName)}
            aria-pressed={state.saved}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
          >
            <Bookmark
              className="h-4 w-4"
              strokeWidth={1.75}
              fill={state.saved ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            {state.saved ? 'Saved' : 'Save for Later'}
          </button>
          <button
            type="button"
            onClick={() => handleNotForMe(profileId, profileName)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Not for Me
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" onClick={stopPropagation}>
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <ActionTile
            variant="primary"
            label="Interested"
            description={`Let ${profileName} know you're interested`}
            active={state.interested}
            ariaPressed={state.interested}
            onClick={() => {
              if (!state.interested) handleInterested(profileId, profileName);
            }}
            icon={
              state.interested ? (
                <Check className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Heart className="h-5 w-5" strokeWidth={1.75} />
              )
            }
          />
        </div>
        {!state.interested ? interestedInfoButton : null}
      </div>

      {openToChatTile}

      {interestedUndo}

      <ActionTile
        variant={state.saved ? 'saved' : 'secondary'}
        label={state.saved ? 'Saved' : 'Save for Later'}
        description={
          state.saved ? 'Only you can see saved profiles' : `Keep ${profileName} in your discovery`
        }
        active={state.saved}
        ariaPressed={state.saved}
        onClick={() => handleSaveForLater(profileId, profileName)}
        icon={
          <Bookmark
            className="h-5 w-5"
            strokeWidth={1.75}
            fill={state.saved ? 'currentColor' : 'none'}
          />
        }
      />

      <ActionTile
        variant="secondary"
        label="Not for Me"
        description="Pass on this introduction"
        onClick={() => handleNotForMe(profileId, profileName)}
        icon={<X className="h-5 w-5" strokeWidth={1.75} />}
      />
    </div>
  );
}
