'use client';

import {
  completeAuthFromExistingSession,
  completeAuthWithCode,
  completeAuthWithTokenHash,
  ensureAuthFoundation,
} from '@/app/actions/auth-callback';
import {
  authResultPath,
  classifyConfirmationProviderError,
  type ConfirmationOutcome,
} from '@/lib/auth/confirmation';
import { createClient } from '@/lib/supabase/client';
import type { EmailOtpType } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function goToResult(outcome: ConfirmationOutcome) {
  window.location.replace(authResultPath(outcome));
}

function safeNextPath(next: string): string {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/onboarding';
}

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Confirming your account…');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const next = safeNextPath(searchParams.get('next') ?? '/onboarding');
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as EmailOtpType | null;
      const queryError =
        searchParams.get('error_description') ??
        searchParams.get('error_code') ??
        searchParams.get('error');

      if (queryError) {
        goToResult(classifyConfirmationProviderError(queryError));
        return;
      }

      try {
        if (code) {
          const result = await completeAuthWithCode(code, next);
          if (!result.success) {
            goToResult(result.outcome);
            return;
          }
          window.location.replace(result.redirectTo);
          return;
        }

        if (tokenHash && type) {
          const result = await completeAuthWithTokenHash(tokenHash, type, next);
          if (!result.success) {
            goToResult(result.outcome);
            return;
          }
          window.location.replace(result.redirectTo);
          return;
        }

        // Default Supabase email verify redirects with tokens (or errors) in the URL hash.
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const hashError =
          hashParams.get('error_description') ??
          hashParams.get('error_code') ??
          hashParams.get('error');

        if (hashError) {
          goToResult(classifyConfirmationProviderError(hashError));
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const supabase = createClient();
        let establishedClientSession = false;

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            // Tokens present but unusable — often an already-consumed confirm link.
            goToResult(classifyConfirmationProviderError(sessionError.message));
            return;
          }
          establishedClientSession = true;
        } else {
          // Allow detectSessionInUrl / existing cookie session to settle.
          await supabase.auth.getSession();
        }

        const {
          data: { user: clientUser },
        } = await supabase.auth.getUser();

        // Clear tokens from the address bar before navigating onward.
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );

        if (clientUser) {
          // Outcome A: a session is established in the browser.
          const result = await completeAuthFromExistingSession(next);
          if (result.success) {
            window.location.replace(result.redirectTo);
            return;
          }

          // Server action may not see cookies yet; still treat as confirmed session.
          await ensureAuthFoundation().catch(() => ({ ok: false }));
          window.location.replace(next);
          return;
        }

        // Confirmation tokens were accepted by setSession, but no usable user/session.
        if (establishedClientSession || (accessToken && refreshToken)) {
          goToResult('confirmed_needs_signin');
          return;
        }

        // No code, no token_hash, no hash tokens, no session → genuine failure.
        goToResult('invalid_or_expired');
      } catch {
        setMessage('Something went wrong while confirming your account.');
        goToResult('invalid_or_expired');
      }
    };

    void run();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-6">
      <p className="text-sm font-medium text-[#5A6575]">{message}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-6">
          <p className="text-sm font-medium text-[#5A6575]">Confirming your account…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
