import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from './database.types';
import { getSupabaseEnv } from './env';

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient<Database>(url, anonKey);
}
