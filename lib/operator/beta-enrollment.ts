import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import type { BetaCapacity } from '@/lib/auth/beta-enrollment';

export type BetaMember = { id: string; email: string; created_at: string; confirmed_at: string | null; last_sign_in_at: string | null };
export type BetaOverview = BetaCapacity & { members: BetaMember[]; waitlist: { email: string; joined_at: string }[] };

export async function loadBetaOverview(): Promise<BetaOverview | null> {
  const admin = createServiceClient();
  if (!admin) return null;
  const { data, error } = await admin.rpc('get_beta_enrollment_overview');
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return null;
  const result = data as unknown as { account_limit: number; account_count: number; members: BetaMember[]; waitlist: BetaOverview['waitlist'] };
  return { accountLimit: result.account_limit, accountCount: result.account_count, members: result.members, waitlist: result.waitlist };
}

export async function loadBetaCapacity(): Promise<BetaCapacity | null> {
  const admin = createServiceClient();
  if (!admin) return null;
  const { data, error } = await admin.rpc('get_beta_enrollment_capacity');
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return null;
  const result = data as { account_limit: number; account_count: number };
  return { accountLimit: result.account_limit, accountCount: result.account_count };
}
