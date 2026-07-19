import type { ReportReasonValue } from './constants';

export type ConversationListItem = {
  conversationId: string;
  connectionId: string;
  status: 'active' | 'ended';
  createdAt: string;
  lastMessageAt: string | null;
  peerUserId: string;
  peerFirstName: string;
  peerAge: number | null;
  peerPhotoUrl: string | null;
  latestMessageBody: string | null;
  latestMessageAt: string | null;
  latestMessageSenderId: string | null;
  unread: boolean;
  /** True for client-only seed fixtures */
  isSeed?: boolean;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  clientMessageId: string | null;
  createdAt: string;
  /** Optimistic UI only */
  localStatus?: 'pending' | 'failed' | 'sent';
};

export type ConversationThreadMeta = {
  conversationId: string;
  connectionId: string;
  status: 'active' | 'ended';
  createdAt: string;
  lastMessageAt: string | null;
  peerUserId: string;
  peerFirstName: string;
  peerFullName: string | null;
  peerAge: number | null;
  peerPhotoUrl: string | null;
  isBlocked: boolean;
  isSeed?: boolean;
};

export type ConversationAlignmentContext = {
  alignmentLabel: string;
  whyIntroduced: string[];
  sharedStrengths: Array<{ title: string; copy: string }>;
  importantFactors: Array<{
    title: string;
    explanation: string;
    viewerAnswer?: string;
    partnerAnswer?: string;
  }>;
  incompleteAssessmentCopy?: string;
};

export type ConversationStarter = {
  id: string;
  text: string;
};

export type ReportPayload = {
  reportedUserId: string;
  reason: ReportReasonValue;
  details?: string;
  conversationId?: string;
};
