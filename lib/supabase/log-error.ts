/**
 * Safe Supabase/PostgREST error logging for preview and development.
 * Never logs API keys or full connection strings — only project ref host + error fields.
 */

type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function supabaseProjectRefFromEnv(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname; // e.g. abcd.supabase.co
    const ref = host.split('.')[0] || null;
    return ref && ref !== 'localhost' ? ref : null;
  } catch {
    return null;
  }
}

function shouldLogVerboseDbErrors(): boolean {
  return (
    process.env.VERCEL_ENV === 'preview' ||
    process.env.VERCEL_ENV === 'development' ||
    process.env.NODE_ENV === 'development'
  );
}

/**
 * Logs a structured Supabase error. Always logs message; in preview/dev also
 * logs code/details/hint, project ref, and optional context (no secrets).
 */
export function logSupabaseError(
  scope: string,
  error: SupabaseLikeError | null | undefined,
  context?: Record<string, unknown>
): void {
  const message = error?.message ?? 'Unknown Supabase error';
  const projectRef = supabaseProjectRefFromEnv();

  if (!shouldLogVerboseDbErrors()) {
    console.error(`${scope}:`, message);
    return;
  }

  console.error(`${scope}:`, {
    message,
    code: error?.code ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    supabaseProjectRef: projectRef,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    ...(context ?? {}),
  });
}
