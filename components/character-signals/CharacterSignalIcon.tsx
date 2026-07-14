'use client';

import {
  CheckCircle2,
  Compass,
  HeartHandshake,
  MessageCircle,
  MessagesSquare,
  Scale,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { CharacterSignalId } from '@/lib/character-signals-mock';

const SIGNAL_ICONS: Record<CharacterSignalId, LucideIcon> = {
  respectful_communicator: MessageCircle,
  great_listener: MessagesSquare,
  clear_intentions: Compass,
  kind_conversation: HeartHandshake,
  genuine_and_present: Sparkles,
  consistent_follow_through: CheckCircle2,
  respectful_in_person: Users,
  handled_mismatch_respectfully: Scale,
};

type CharacterSignalIconProps = {
  signalId: CharacterSignalId;
  className?: string;
};

export default function CharacterSignalIcon({
  signalId,
  className = 'h-5 w-5',
}: CharacterSignalIconProps) {
  const Icon = SIGNAL_ICONS[signalId];
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
