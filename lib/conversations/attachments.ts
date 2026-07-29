import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  MESSAGE_ATTACHMENT_MIME_TYPES,
} from './constants';

export type MessageAttachmentDraft = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
};

export function isSupportedMessageAttachmentType(mimeType: string): boolean {
  return (MESSAGE_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateMessageAttachment(file: Pick<File, 'name' | 'size' | 'type'>): string | null {
  if (!isSupportedMessageAttachmentType(file.type)) {
    return 'Choose a JPG, PNG, WebP, PDF, TXT, or DOCX file.';
  }
  if (file.size < 1) return 'That file is empty.';
  if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
    return 'Attachments can be up to 10 MB.';
  }
  return null;
}

export function sanitizeAttachmentName(name: string): string {
  const trimmed = name.trim().replace(/[/\\]/g, '-');
  const safe = trimmed.replace(/[^\p{L}\p{N}._ ()-]+/gu, '-').replace(/\s+/g, ' ');
  return (safe || 'attachment').slice(0, 120);
}

export function createAttachmentPath(
  conversationId: string,
  userId: string,
  fileName: string,
  objectId: string
): string {
  return `${conversationId}/${userId}/${objectId}-${sanitizeAttachmentName(fileName)}`;
}

export function isImageAttachment(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith('image/'));
}

export function formatAttachmentSize(bytes: number | null | undefined): string {
  if (!bytes || bytes < 1) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function readImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return null;
  const url = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Could not inspect image.'));
      image.src = url;
    });
    if (
      dimensions.width < 1 ||
      dimensions.height < 1 ||
      dimensions.width > 12000 ||
      dimensions.height > 12000
    ) {
      return null;
    }
    return dimensions;
  } finally {
    URL.revokeObjectURL(url);
  }
}
