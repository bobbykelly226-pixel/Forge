import 'server-only';

import { getReportReasonLabel } from '@/lib/conversations/constants';
import { createServiceClient } from '@/lib/supabase/admin';

const REPORT_EVIDENCE_URL_TTL_SECONDS = 5 * 60;

export type OperatorReportCaseStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export type OperatorReportQueueItem = {
  reportId: string;
  status: OperatorReportCaseStatus;
  reason: string;
  reasonLabel: string;
  details: string | null;
  createdAt: string;
  updatedAt: string;
  escalatedAt: string | null;
  resolvedAt: string | null;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  conversationId: string | null;
  evidenceCount: number;
  alertStatus: string | null;
};

export type OperatorReportEvidence = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  signedUrl: string;
};

export type OperatorReportEvent = {
  id: string;
  action: string;
  reason: string;
  outcome: string;
  createdAt: string;
  operatorId: string;
};

export type OperatorReportEnforcement = {
  id: string;
  action: string;
  reason: string;
  notificationOutcome: string;
  createdAt: string;
};

export type OperatorReportAppeal = {
  id: string;
  details: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
};

export type OperatorReportReviewData = {
  cases: OperatorReportQueueItem[];
  selectedCase: OperatorReportQueueItem | null;
  evidence: OperatorReportEvidence[];
  events: OperatorReportEvent[];
  enforcements: OperatorReportEnforcement[];
  appeals: OperatorReportAppeal[];
};

export type OperatorReportReviewResult =
  | { success: true; data: OperatorReportReviewData }
  | { success: false; message: string };

export async function loadOperatorReportReview(
  requestedReportId?: string | null
): Promise<OperatorReportReviewResult> {
  const admin = createServiceClient();
  if (!admin) {
    return { success: false, message: 'The operator review service is not configured.' };
  }

  const { data: caseRows, error: caseError } = await admin
    .from('operator_report_cases')
    .select('report_id, status, escalated_at, resolved_at, updated_at')
    .order('updated_at', { ascending: false });

  if (caseError) {
    console.error('Operator report cases could not be loaded.', {
      code: caseError.code,
      message: caseError.message,
    });
    return { success: false, message: 'Report cases could not be loaded right now.' };
  }

  if (!caseRows?.length) {
    return {
      success: true,
      data: { cases: [], selectedCase: null, evidence: [], events: [], enforcements: [], appeals: [] },
    };
  }

  const reportIds = caseRows.map((item) => item.report_id);
  const [{ data: reports, error: reportsError }, { data: evidenceCounts }, { data: alertRows }] =
    await Promise.all([
      admin
        .from('user_reports')
        .select('id, reporter_id, reported_user_id, conversation_id, reason, details, created_at')
        .in('id', reportIds),
      admin.from('report_evidence').select('report_id').in('report_id', reportIds),
      admin.from('safety_report_notifications').select('report_id, status').in('report_id', reportIds),
    ]);

  if (reportsError) {
    console.error('Operator report details could not be loaded.', {
      code: reportsError.code,
      message: reportsError.message,
    });
    return { success: false, message: 'Report details could not be loaded right now.' };
  }

  const memberIds = [
    ...new Set((reports ?? []).flatMap((report) => [report.reporter_id, report.reported_user_id])),
  ];
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', memberIds);

  if (profileError) {
    console.error('Report member names could not be loaded.', {
      code: profileError.code,
      message: profileError.message,
    });
  }

  const reportsById = new Map((reports ?? []).map((report) => [report.id, report] as const));
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile] as const));
  const evidenceCountByReport = new Map<string, number>();
  for (const evidence of evidenceCounts ?? []) {
    evidenceCountByReport.set(
      evidence.report_id,
      (evidenceCountByReport.get(evidence.report_id) ?? 0) + 1
    );
  }
  const alertsByReport = new Map((alertRows ?? []).map((alert) => [alert.report_id, alert.status]));

  const cases = caseRows.flatMap((caseRow): OperatorReportQueueItem[] => {
    const report = reportsById.get(caseRow.report_id);
    if (!report) return [];
    const reporter = profilesById.get(report.reporter_id);
    const reportedUser = profilesById.get(report.reported_user_id);
    return [
      {
        reportId: report.id,
        status: caseRow.status,
        reason: report.reason,
        reasonLabel: getReportReasonLabel(report.reason),
        details: report.details,
        createdAt: report.created_at,
        updatedAt: caseRow.updated_at,
        escalatedAt: caseRow.escalated_at,
        resolvedAt: caseRow.resolved_at,
        reporterId: report.reporter_id,
        reporterName: reporter?.full_name?.trim() || 'Forge member',
        reportedUserId: report.reported_user_id,
        reportedUserName: reportedUser?.full_name?.trim() || 'Forge member',
        conversationId: report.conversation_id,
        evidenceCount: evidenceCountByReport.get(report.id) ?? 0,
        alertStatus: alertsByReport.get(report.id) ?? null,
      },
    ];
  });

  const selectedCase =
    cases.find((item) => item.reportId === requestedReportId) ??
    cases.find((item) => item.status === 'pending') ??
    cases[0] ??
    null;

  if (!selectedCase) {
    return {
      success: true,
      data: { cases, selectedCase: null, evidence: [], events: [], enforcements: [], appeals: [] },
    };
  }

  const [evidenceResult, eventsResult, enforcementsResult, appealsResult] = await Promise.all([
    admin
      .from('report_evidence')
      .select('id, storage_path, file_name, mime_type, file_size, created_at')
      .eq('report_id', selectedCase.reportId)
      .order('created_at', { ascending: true }),
    admin
      .from('operator_report_events')
      .select('id, action, reason, outcome, created_at, operator_id')
      .eq('report_id', selectedCase.reportId)
      .order('created_at', { ascending: false }),
    admin
      .from('operator_member_enforcements')
      .select('id, action, reason, notification_outcome, created_at')
      .eq('report_id', selectedCase.reportId)
      .order('created_at', { ascending: false }),
    admin
      .from('safety_report_appeals')
      .select('id, details, status, created_at, reviewed_at')
      .eq('report_id', selectedCase.reportId)
      .order('created_at', { ascending: false }),
  ]);

  const evidence = await Promise.all(
    (evidenceResult.data ?? []).map(async (item): Promise<OperatorReportEvidence | null> => {
      const { data, error } = await admin.storage
        .from('report-evidence')
        .createSignedUrl(item.storage_path, REPORT_EVIDENCE_URL_TTL_SECONDS);
      if (error || !data?.signedUrl) {
        console.error('Private report evidence could not be signed.', {
          evidenceId: item.id,
          message: error?.message ?? 'No signed URL returned.',
        });
        return null;
      }
      return {
        id: item.id,
        fileName: item.file_name,
        mimeType: item.mime_type,
        fileSize: item.file_size,
        createdAt: item.created_at,
        signedUrl: data.signedUrl,
      };
    })
  );

  return {
    success: true,
    data: {
      cases,
      selectedCase,
      evidence: evidence.filter((item): item is OperatorReportEvidence => item !== null),
      events: (eventsResult.data ?? []).map((event) => ({
        id: event.id,
        action: event.action,
        reason: event.reason,
        outcome: event.outcome,
        createdAt: event.created_at,
        operatorId: event.operator_id,
      })),
      enforcements: (enforcementsResult.data ?? []).map((enforcement) => ({
        id: enforcement.id,
        action: enforcement.action,
        reason: enforcement.reason,
        notificationOutcome: enforcement.notification_outcome,
        createdAt: enforcement.created_at,
      })),
      appeals: (appealsResult.data ?? []).map((appeal) => ({
        id: appeal.id,
        details: appeal.details,
        status: appeal.status,
        createdAt: appeal.created_at,
        reviewedAt: appeal.reviewed_at,
      })),
    },
  };
}
