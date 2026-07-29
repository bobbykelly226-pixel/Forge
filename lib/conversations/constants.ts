/** Conversation Experience V1 constants */

export const MESSAGE_MAX_LENGTH = 2000;
export const MESSAGE_PAGE_SIZE = 40;
export const MESSAGE_ATTACHMENT_BUCKET = 'conversation-attachments';
export const MESSAGE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const MESSAGE_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MESSAGE_EMOJI_OPTIONS = [
  '😀',
  '😂',
  '😊',
  '😍',
  '🥰',
  '😉',
  '🤗',
  '🤔',
  '😅',
  '😢',
  '❤️',
  '💕',
  '👍',
  '🙏',
  '👏',
  '🎉',
  '🔥',
  '✨',
  '☕',
  '🌹',
] as const;

export const REPORT_REASON_OPTIONS = [
  { value: 'unwanted_behavior', label: 'Unwanted behavior' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake_profile', label: 'Fake or misleading profile' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
] as const;

export type ReportReasonValue = (typeof REPORT_REASON_OPTIONS)[number]['value'];
