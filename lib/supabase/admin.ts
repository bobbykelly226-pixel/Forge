import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';
import { getSupabaseEnv } from '@/lib/supabase/env';

/**
 * Service-role client for trusted server-only operations (never import in client components).
 * Returns null when the key is not configured.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return null;
  }

  const { url } = getSupabaseEnv();
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
