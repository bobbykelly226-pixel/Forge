'use server';

import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import {
  preserveReportedVideoEvidence,
  REPORTED_VIDEO_EVIDENCE_BUCKET,
} from '@/lib/safety/reported-video-evidence';

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
    const evidence = await preserveReportedVideoEvidence(admin, reportId);
    if (!evidence.length) return unavailable;
    const videos = await Promise.all(evidence.map(async item => {
      const { data, error } = await admin.storage.from(REPORTED_VIDEO_EVIDENCE_BUCKET).createSignedUrl(item.storagePath, 60);
      return !error && data?.signedUrl ? { id: item.id, url: data.signedUrl } : null;
    }));
    if (videos.some(v => v === null)) return unavailable;
    return { success: true, videos: videos.filter((v): v is { id: string; url: string } => v !== null) };
  } catch { return unavailable; }
}
