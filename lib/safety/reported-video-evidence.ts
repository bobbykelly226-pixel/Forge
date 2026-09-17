import 'server-only';

import type { createServiceClient } from '@/lib/supabase/admin';
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/conversations/constants';
import {
  matchesReportedVideo,
  reportedVideoEvidencePath,
  reportedVideoMessageId,
} from '@/lib/operator/reported-video';

export const REPORTED_VIDEO_EVIDENCE_BUCKET = 'reported-video-evidence';

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

type PreservedVideo = {
  id: string;
  storagePath: string;
};

export async function preserveReportedVideoEvidence(
  admin: ServiceClient,
  reportId: string,
  expectedReporterId?: string
): Promise<PreservedVideo[]> {
  const { data: report, error: reportError } = await admin
    .from('user_reports')
    .select('id, conversation_id, reporter_id, reported_user_id, details')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError || !report?.conversation_id || (expectedReporterId && report.reporter_id !== expectedReporterId)) {
    return [];
  }

  const messageId = reportedVideoMessageId(report.details);
  if (!messageId) return [];

  const [{ data: participant }, { data: message }, { data: attachments, error: attachmentError }] =
    await Promise.all([
      admin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', report.conversation_id)
        .eq('user_id', report.reporter_id)
        .maybeSingle(),
      admin
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .eq('conversation_id', report.conversation_id)
        .eq('sender_id', report.reported_user_id)
        .maybeSingle(),
      admin
        .from('message_attachments')
        .select('id, conversation_id, sender_id, message_id, storage_path, file_name, mime_type, file_size')
        .eq('message_id', messageId)
        .eq('conversation_id', report.conversation_id)
        .eq('sender_id', report.reported_user_id)
        .in('mime_type', ['video/mp4', 'video/webm']),
    ]);

  if (!participant || !message || attachmentError || !attachments?.length) return [];
  const scope = {
    conversationId: report.conversation_id,
    reportedUserId: report.reported_user_id,
    messageId,
  };
  if (!attachments.every((attachment) => matchesReportedVideo(scope, attachment))) return [];

  const preserved: PreservedVideo[] = [];
  for (const attachment of attachments) {
    const { data: existing, error: existingError } = await admin
      .from('reported_video_evidence')
      .select('id, storage_path')
      .eq('report_id', report.id)
      .eq('source_attachment_id', attachment.id)
      .maybeSingle();
    if (existingError) {
      console.error('Reported video evidence metadata could not be checked.', {
        reportId: report.id,
        attachmentId: attachment.id,
        message: existingError.message,
      });
      continue;
    }
    if (existing) {
      preserved.push({ id: existing.id, storagePath: existing.storage_path });
      continue;
    }

    const storagePath = reportedVideoEvidencePath(report.id, attachment.id, attachment.mime_type);
    const { error: copyError } = await admin.storage
      .from(MESSAGE_ATTACHMENT_BUCKET)
      .copy(attachment.storage_path, storagePath, {
        destinationBucket: REPORTED_VIDEO_EVIDENCE_BUCKET,
      });
    if (copyError && !/already exists|duplicate/i.test(copyError.message)) {
      console.error('Reported video evidence could not be copied.', {
        reportId: report.id,
        attachmentId: attachment.id,
        message: copyError.message,
      });
      continue;
    }

    const { data: inserted, error: insertError } = await admin
      .from('reported_video_evidence')
      .upsert(
        {
          report_id: report.id,
          source_attachment_id: attachment.id,
          source_message_id: messageId,
          source_conversation_id: report.conversation_id,
          source_sender_id: report.reported_user_id,
          source_storage_path: attachment.storage_path,
          storage_path: storagePath,
          file_name: attachment.file_name,
          mime_type: attachment.mime_type,
          file_size: attachment.file_size,
        },
        { onConflict: 'report_id,source_attachment_id', ignoreDuplicates: true }
      )
      .select('id, storage_path')
      .maybeSingle();

    if (insertError) {
      console.error('Reported video evidence metadata could not be saved.', {
        reportId: report.id,
        attachmentId: attachment.id,
        message: insertError.message,
      });
      continue;
    }
    if (inserted) {
      preserved.push({ id: inserted.id, storagePath: inserted.storage_path });
      continue;
    }

    const { data: concurrent } = await admin
      .from('reported_video_evidence')
      .select('id, storage_path')
      .eq('report_id', report.id)
      .eq('source_attachment_id', attachment.id)
      .maybeSingle();
    if (concurrent) preserved.push({ id: concurrent.id, storagePath: concurrent.storage_path });
  }

  return preserved;
}
