import 'server-only';

import { createServiceClient } from '@/lib/supabase/admin';

export type BetaEnrollmentSettings = {
  enrollmentOpen: boolean;
  memberLimit: number;
  acceptedCount: number;
  verifiedCount: number;
  pendingCount: number;
};

export type BetaSignupLinkSummary = {
  id: string;
  label: string;
  maxUses: number;
  useCount: number;
  createdAt: string;
  expiresAt: string | null;
  pausedAt: string | null;
  revokedAt: string | null;
  status: 'active' | 'inactive';
};

export type BetaEnrollmentDashboard = {
  settings: BetaEnrollmentSettings;
  links: BetaSignupLinkSummary[];
  waitlist: { email: string; name: string; created_at: string }[];
  waitlistCount: number;
};

export async function loadBetaEnrollmentDashboard(): Promise<
  { success: true; data: BetaEnrollmentDashboard } | { success: false; message: string }
> {
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Founding Beta administration is not configured.' };

  const now = new Date().toISOString();
  const [settingsResult, linksResult, countsResult, waitlistResult] = await Promise.all([
    admin.from('beta_enrollment_settings').select('enrollment_open, member_limit, accepted_count').eq('singleton', true).single(),
    admin.from('beta_signup_links').select('id, label, max_uses, use_count, created_at, expires_at, paused_at, revoked_at').order('created_at', { ascending: false }).limit(50),
    admin.rpc('beta_enrollment_counts'),
    admin.from('beta_enrollment_waitlist').select('email, name, created_at', { count: 'exact' }).order('created_at', { ascending: true }).limit(100),
  ]);

  if (settingsResult.error || linksResult.error || countsResult.error || !countsResult.data || waitlistResult.error) {
    console.error('Founding Beta operator dashboard could not be loaded.');
    return { success: false, message: 'Founding Beta enrollment data could not be loaded.' };
  }

  return {
    success: true,
    data: {
      waitlist: waitlistResult.data,
      waitlistCount: waitlistResult.count ?? 0,
      settings: {
        enrollmentOpen: settingsResult.data.enrollment_open,
        memberLimit: settingsResult.data.member_limit,
        acceptedCount: settingsResult.data.accepted_count,
        verifiedCount: Number((countsResult.data as { verified_count: number }).verified_count),
        pendingCount: Number((countsResult.data as { pending_count: number }).pending_count),
      },
      links: linksResult.data.map((link) => ({
        id: link.id,
        label: link.label,
        maxUses: link.max_uses,
        useCount: link.use_count,
        createdAt: link.created_at,
        expiresAt: link.expires_at,
        pausedAt: link.paused_at,
        revokedAt: link.revoked_at,
        status:
          link.revoked_at ||
          link.paused_at ||
          (link.expires_at && link.expires_at <= now) ||
          link.use_count >= link.max_uses
            ? 'inactive'
            : 'active',
      })),
    },
  };
}
