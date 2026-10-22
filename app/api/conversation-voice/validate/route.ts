import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { MESSAGE_ATTACHMENT_BUCKET, MESSAGE_ATTACHMENT_MAX_BYTES } from '@/lib/conversations/constants';
import { inspectVoice } from '@/lib/conversations/inspect-voice';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  const deny = (status: number) => Response.json({ error: 'Voice message could not be verified. Record a message under 60 seconds and try again.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.headers.get('origin') !== new URL(request.url).origin) return deny(403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return deny(401);
  try {
    const input = await request.json();
    if (typeof input.conversationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.conversationId)
      || typeof input.path !== 'string' || input.path.length > 255 || input.path.includes('..')
      || !input.path.startsWith(`${input.conversationId}/${user.id}/`)
      || !['audio/mp4', 'audio/webm'].includes(input.mimeType)) return deny(400);
    // Returns an immutable upload identity, only for the authenticated sender in an active conversation.
    const db = supabase as unknown as SupabaseClient;
    const { data: upload, error: accessError } = await db.rpc('get_voice_upload_for_validation', { p_conversation_id: input.conversationId, p_path: input.path });
    if (accessError || !upload?.object_id || upload.mime_type !== input.mimeType || upload.file_size < 1 || upload.file_size > MESSAGE_ATTACHMENT_MAX_BYTES) return deny(403);
    const admin = createServiceClient() as unknown as SupabaseClient | null;
    if (!admin) return deny(503);
    const { data: blob, error } = await admin.storage.from(MESSAGE_ATTACHMENT_BUCKET).download(input.path);
    if (error || !blob || blob.size !== upload.file_size || blob.size > MESSAGE_ATTACHMENT_MAX_BYTES) return deny(400);
    const duration = await inspectVoice(blob, input.mimeType);
    if (duration === null) return deny(400);
    const { error: saveError } = await admin.from('conversation_voice_checks').upsert({
      object_id: upload.object_id, storage_path: input.path, sender_id: user.id,
      file_size: upload.file_size, mime_type: input.mimeType, duration_seconds: duration,
    }, { onConflict: 'object_id' });
    if (saveError) return deny(503);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return deny(400); }
}
