const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const reference = new RegExp(`^Reported video message: (${UUID})(?:\\r?\\n|$)`, 'i');
export function reportedVideoMessageId(details: string | null): string | null {
  return details?.match(reference)?.[1].toLowerCase() ?? null;
}
export function matchesReportedVideo(
  report: { conversationId: string; reportedUserId: string; messageId: string },
  attachment: { conversation_id: string; sender_id: string; message_id: string; storage_path: string; mime_type: string }
): boolean {
  return attachment.conversation_id === report.conversationId
    && attachment.sender_id === report.reportedUserId
    && attachment.message_id === report.messageId
    && ['video/mp4', 'video/webm'].includes(attachment.mime_type)
    && attachment.storage_path.startsWith(`${report.conversationId}/${report.reportedUserId}/`)
    && !attachment.storage_path.includes('..');
}

export function reportedVideoEvidencePath(reportId: string, attachmentId: string, mimeType: string): string {
  const extension = mimeType === 'video/webm' ? 'webm' : 'mp4';
  return `${reportId}/${attachmentId}.${extension}`;
}
