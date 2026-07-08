import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

import { getSupabaseEnv } from './env';

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey);
}
