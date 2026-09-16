'use server';

import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { matchesReportedVideo, reportedVideoMessageId } from '@/lib/operator/reported-video';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/conversations/constants';

export async function openReportedVideoAction(reportId: string): Promise<
  { success: true; videos: { id: string; url: string }[] } | { success: false; message: string }
> {
  const unavailable = { success: false as const, message: 'The referenced video is unavailable or could not be matched to this report.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isForgeOperatorUser(user)) return { success: false, message: 'Operator access is required.' };
  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') return { success: false, message: 'Verify your authenticator before opening reported videos.' };
  const admin = createServiceClient();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(reportId)) return unavailable;
  try {
    const { data: report, error } = await admin.from('user_reports')
      .select('id, conversation_id, reporter_id, reported_user_id, details').eq('id', reportId).maybeSingle();
    if (error || !report?.conversation_id) return unavailable;
    const messageId = reportedVideoMessageId(report.details);
    if (!messageId) return unavailable;
    const [{ data: participant, error: participantError }, { data: message, error: messageError }, { data: attachments, error: attachmentError }] = await Promise.all([
      admin.from('conversation_participants').select('user_id').eq('conversation_id', report.conversation_id).eq('user_id', report.reporter_id).maybeSingle(),
      admin.from('messages').select('id').eq('id', messageId).eq('conversation_id', report.conversation_id).eq('sender_id', report.reported_user_id).maybeSingle(),
      admin.from('message_attachments').select('id, conversation_id, sender_id, message_id, storage_path, mime_type').eq('message_id', messageId).eq('conversation_id', report.conversation_id).eq('sender_id', report.reported_user_id).in('mime_type', ['video/mp4', 'video/webm']),
    ]);
    if (participantError || messageError || attachmentError || !participant || !message || !attachments?.length) return unavailable;
    const scope = { conversationId: report.conversation_id, reportedUserId: report.reported_user_id, messageId };
    if (!attachments.every(a => matchesReportedVideo(scope, a))) return unavailable;
    const videos = await Promise.all(attachments.map(async a => {
      const { data, error } = await admin.storage.from(MESSAGE_ATTACHMENT_BUCKET).createSignedUrl(a.storage_path, 60);
      return !error && data?.signedUrl ? { id: a.id, url: data.signedUrl } : null;
    }));
    if (videos.some(v => v === null)) return unavailable;
    return { success: true, videos: videos.filter((v): v is { id: string; url: string } => v !== null) };
  } catch { return unavailable; }
}
