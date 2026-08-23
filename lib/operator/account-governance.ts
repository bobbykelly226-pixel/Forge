import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceClient } from '@/lib/supabase/admin';

export type AccountGovernanceRecord = {
  userId: string;
  email: string;
  name: string;
  profileStatus: string;
  deletionStatus: string;
  legalHoldActive: boolean;
  legalHoldReason: string | null;
  retentionClass: string;
  retainUntil: string | null;
  events: Array<{ id: string; action: string; reason: string | null; created_at: string }>;
};

export async function loadAccountGovernanceByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { success: true as const, data: null };
  const admin = createServiceClient();
  if (!admin) return { success: false as const, message: 'Account governance service is not configured.' };
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const member = users.users.find((user) => user.email?.trim().toLowerCase() === normalized);
  if (usersError || !member?.email) return { success: false as const, message: 'No member matched that exact email address.' };
  const db = admin as unknown as SupabaseClient;
  const [profile, lifecycle, events] = await Promise.all([
    db.from('profiles').select('full_name,status').eq('id', member.id).maybeSingle(),
    db.from('account_lifecycle_state').select('*').eq('user_id', member.id).maybeSingle(),
    db.from('account_lifecycle_events').select('id,action,reason,created_at').eq('user_id', member.id).order('created_at', { ascending: false }).limit(25),
  ]);
  return {
    success: true as const,
    data: {
      userId: member.id,
      email: member.email,
      name: String(profile.data?.full_name ?? 'Member'),
      profileStatus: String(profile.data?.status ?? 'draft'),
      deletionStatus: String(lifecycle.data?.deletion_status ?? 'none'),
      legalHoldActive: Boolean(lifecycle.data?.legal_hold_active),
      legalHoldReason: lifecycle.data?.legal_hold_reason ? String(lifecycle.data.legal_hold_reason) : null,
      retentionClass: String(lifecycle.data?.retention_class ?? 'standard'),
      retainUntil: lifecycle.data?.retain_until ? String(lifecycle.data.retain_until) : null,
      events: (events.data ?? []) as AccountGovernanceRecord['events'],
    } satisfies AccountGovernanceRecord,
  };
}
