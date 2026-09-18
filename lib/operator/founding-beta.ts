import 'server-only';

import { createServiceClient } from '@/lib/supabase/admin';

export type FoundingBetaRequestStatus = 'pending' | 'approved' | 'invited' | 'declined';

export type FoundingBetaRequest = {
  id: string;
  firstName: string;
  email: string;
  location: string;
  gender: string;
  interestedIn: string[];
  relationshipGoal: string;
  heardAboutForge: string | null;
  status: FoundingBetaRequestStatus;
  submittedAt: string;
  reviewedAt: string | null;
  decisionNote: string | null;
  invitationSentAt: string | null;
  invitationDeliveryStatus: string;
  invitationDeliveryError: string | null;
};

export type FoundingBetaQueueResult =
  | { success: true; data: FoundingBetaRequest[] }
  | { success: false; message: string };

export async function loadFoundingBetaRequests(): Promise<FoundingBetaQueueResult> {
  const admin = createServiceClient();
  if (!admin) {
    return { success: false, message: 'The Founding Beta review service is not configured.' };
  }

  const { data, error } = await admin
    .from('founding_beta_requests')
    .select(
      'id, first_name, email, location, gender, interested_in, relationship_goal, heard_about_forge, status, submitted_at, reviewed_at, decision_note, invitation_sent_at, invitation_delivery_status, invitation_delivery_error'
    )
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Founding Beta requests could not be loaded.', {
      code: error.code,
      message: error.message,
    });
    return { success: false, message: 'Founding Beta requests could not be loaded right now.' };
  }

  return {
    success: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      firstName: row.first_name,
      email: row.email,
      location: row.location,
      gender: row.gender,
      interestedIn: row.interested_in,
      relationshipGoal: row.relationship_goal,
      heardAboutForge: row.heard_about_forge,
      status: row.status as FoundingBetaRequestStatus,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      decisionNote: row.decision_note,
      invitationSentAt: row.invitation_sent_at,
      invitationDeliveryStatus: row.invitation_delivery_status,
      invitationDeliveryError: row.invitation_delivery_error,
    })),
  };
}
