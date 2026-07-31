/** Conversation Experience V1 constants */

export const MESSAGE_MAX_LENGTH = 2000;
export const MESSAGE_PAGE_SIZE = 40;
export const MESSAGE_ATTACHMENT_BUCKET = 'conversation-attachments';
export const MESSAGE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const REPORT_EVIDENCE_BUCKET = 'report-evidence';
export const REPORT_EVIDENCE_MAX_FILES = 3;
export const REPORT_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

export const REPORT_EVIDENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

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

export function getReportReasonLabel(value: ReportReasonValue) {
  return REPORT_REASON_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
