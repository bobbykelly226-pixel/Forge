'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, ImageIcon, LoaderCircle } from 'lucide-react';

import {
  formatAttachmentSize,
  isImageAttachment,
} from '@/lib/conversations/attachments';
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/conversations/constants';
import type { ConversationAttachment } from '@/lib/conversations/types';
import { createClient } from '@/lib/supabase/client';

type Props = {
  attachment: ConversationAttachment;
  isSent: boolean;
};

export default function MessageAttachment({ attachment, isSent }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const path = attachment.storagePath;

  useEffect(() => {
    let active = true;
    if (!path) return;

    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(MESSAGE_ATTACHMENT_BUCKET)
        .createSignedUrl(path, 60 * 10);
      if (!active) return;
      if (error || !data?.signedUrl) {
        setFailed(true);
        return;
      }
      setSignedUrl(data.signedUrl);
    };
    void load();
    return () => {
      active = false;
    };
  }, [path]);

  if (!path) return null;

  const name = attachment.fileName;
  const detail = formatAttachmentSize(attachment.fileSize);
  const image = isImageAttachment(attachment.mimeType);
  const foreground = isSent ? 'text-white' : 'text-[#0B2D5C]';
  const secondary = isSent ? 'text-white/70' : 'text-[#7A8494]';

  if (!signedUrl && !failed) {
    return (
      <div className={`flex min-w-48 items-center gap-2 py-1 ${secondary}`}>
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="text-sm">Preparing attachment…</span>
      </div>
    );
  }

  if (failed || !signedUrl) {
    return (
      <div className={`flex items-center gap-2 py-1 ${secondary}`}>
        <FileText className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm">Attachment unavailable</span>
      </div>
    );
  }

  if (image) {
    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-white/70"
        aria-label={`Open photo attachment ${name}`}
      >
        {/* Private, short-lived Supabase URL cannot be statically optimized by Next Image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signedUrl}
          alt={name}
          className="max-h-80 w-full min-w-48 max-w-sm object-contain"
        />
        <span className={`mt-2 flex items-center gap-1.5 text-xs ${secondary}`}>
          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{name}</span>
          {detail ? <span>· {detail}</span> : null}
        </span>
      </a>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noreferrer"
      download={name}
      className={`flex min-w-52 items-center gap-3 rounded-xl border p-3 ${
        isSent ? 'border-white/20 bg-white/10' : 'border-[#0B2D5C]/10 bg-[#F8F6F2]'
      }`}
    >
      <FileText className={`h-6 w-6 shrink-0 ${foreground}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${foreground}`}>{name}</span>
        {detail ? <span className={`block text-xs ${secondary}`}>{detail}</span> : null}
      </span>
      <Download className={`h-4 w-4 shrink-0 ${foreground}`} aria-hidden="true" />
    </a>
  );
}
