import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { MESSAGE_ATTACHMENT_BUCKET, MESSAGE_ATTACHMENT_MAX_BYTES } from '@/lib/conversations/constants';
import { inspectVideo } from '@/lib/conversations/inspect-video';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  const deny = (status: number) => Response.json({ error: 'Video could not be verified. Record a clip under 15 seconds and try again.' }, { status });
  if (process.env.NEXT_PUBLIC_VIDEO_MESSAGES_ENABLED !== 'true') return deny(404);
  if (request.headers.get('origin') !== new URL(request.url).origin) return deny(403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return deny(401);
  try {
    const input = await request.json();
    if (typeof input.conversationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.conversationId)
      || typeof input.path !== 'string' || input.path.length > 255 || input.path.includes('..')
      || !input.path.startsWith(`${input.conversationId}/${user.id}/`)
      || !['video/mp4', 'video/webm'].includes(input.mimeType)) return deny(400);
    // Returns an immutable upload identity, only for the authenticated sender in an active conversation.
    const db = supabase as unknown as SupabaseClient;
    const { data: upload, error: accessError } = await db.rpc('get_video_upload_for_validation', { p_conversation_id: input.conversationId, p_path: input.path });
    if (accessError || !upload?.object_id || upload.mime_type !== input.mimeType || upload.file_size < 1 || upload.file_size > MESSAGE_ATTACHMENT_MAX_BYTES) return deny(403);
    const { data: blob, error } = await supabase.storage.from(MESSAGE_ATTACHMENT_BUCKET).download(input.path);
    if (error || !blob || blob.size !== upload.file_size || blob.size > MESSAGE_ATTACHMENT_MAX_BYTES) return deny(400);
    const duration = await inspectVideo(blob, input.mimeType);
    if (duration === null) return deny(400);
    const admin = createServiceClient() as unknown as SupabaseClient | null;
    if (!admin) return deny(503);
    const { error: saveError } = await admin.from('conversation_video_checks').upsert({
      object_id: upload.object_id, storage_path: input.path, sender_id: user.id,
      file_size: upload.file_size, mime_type: input.mimeType, duration_seconds: duration,
    }, { onConflict: 'object_id' });
    if (saveError) return deny(503);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return deny(400); }
}
