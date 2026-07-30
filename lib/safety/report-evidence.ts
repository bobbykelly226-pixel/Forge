import {
  REPORT_EVIDENCE_MAX_BYTES,
  REPORT_EVIDENCE_MAX_FILES,
  REPORT_EVIDENCE_MIME_TYPES,
} from '@/lib/conversations/constants';

const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

export function sanitizeReportEvidenceName(fileName: string) {
  const normalized = fileName
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}._ -]+/gu, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return (normalized || 'screenshot').slice(0, 120);
}

export function getReportEvidenceMimeType(file: Pick<File, 'name' | 'type'>) {
  const declared = file.type.trim().toLowerCase();
  if ((REPORT_EVIDENCE_MIME_TYPES as readonly string[]).includes(declared)) {
    return declared;
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME_TYPES[extension] ?? null;
}

export function validateReportEvidenceFile(file: File) {
  if (!getReportEvidenceMimeType(file)) {
    return 'Choose a JPG, PNG, WebP, HEIC, or HEIF image.';
  }
  if (file.size < 1) {
    return 'That screenshot is empty.';
  }
  if (file.size > REPORT_EVIDENCE_MAX_BYTES) {
    return 'Each screenshot must be 5 MB or smaller.';
  }
  return null;
}

export function validateReportEvidenceFiles(files: File[]) {
  if (files.length > REPORT_EVIDENCE_MAX_FILES) {
    return `You can attach up to ${REPORT_EVIDENCE_MAX_FILES} screenshots.`;
  }
  for (const file of files) {
    const error = validateReportEvidenceFile(file);
    if (error) return error;
  }
  return null;
}

export function createReportEvidencePath(
  userId: string,
  submissionId: string,
  objectId: string,
  fileName: string
) {
  return `${userId}/${submissionId}/${objectId}-${sanitizeReportEvidenceName(fileName)}`;
}
