'use server';

import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/conversations/constants';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type OpenResult = {
  ok?: boolean;
  storage_path?: unknown;
  viewed_at?: unknown;
  message?: unknown;
};

export async function openViewOnceVideoAction(attachmentId: string): Promise<
  | { success: true; url: string; viewedAt: string }
  | { success: false; message: string; consumed?: boolean }
> {
  const unavailable = { success: false as const, message: 'This video is unavailable.' };
  if (!UUID.test(attachmentId)) return unavailable;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Sign in again to open this video.' };

  const { data, error } = await supabase.rpc('open_view_once_video', {
    p_attachment_id: attachmentId,
  });
  const result = (data ?? {}) as OpenResult;
  if (error || !result.ok) {
    const consumed = result.message === 'Video has already been viewed.';
    return {
      success: false,
      message: consumed ? 'Video viewed' : 'This video is unavailable.',
      consumed,
    };
  }

  const path = typeof result.storage_path === 'string' ? result.storage_path : '';
  const viewedAt = typeof result.viewed_at === 'string' ? result.viewed_at : '';
  if (!path || path.length > 255 || path.includes('..') || !viewedAt) return unavailable;

  const admin = createServiceClient();
  if (!admin) return unavailable;
  const { data: signed, error: signingError } = await admin.storage
    .from(MESSAGE_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 45);
  if (signingError || !signed?.signedUrl) return unavailable;

  return { success: true, url: signed.signedUrl, viewedAt };
}
