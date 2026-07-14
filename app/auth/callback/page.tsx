'use client';

import {
  completeAuthFromExistingSession,
  completeAuthWithCode,
  completeAuthWithTokenHash,
} from '@/app/actions/auth-callback';
import { createClient } from '@/lib/supabase/client';
import type { EmailOtpType } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Confirming your account…');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const next = searchParams.get('next') ?? '/onboarding';
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as EmailOtpType | null;
      const errorDescription =
        searchParams.get('error_description') ?? searchParams.get('error');

      if (errorDescription) {
        router.replace(
          `/auth/error?reason=${encodeURIComponent(
            // Keep user-facing text calm; never forward raw provider payloads.
            errorDescription.toLowerCase().includes('expired')
              ? 'This confirmation link is invalid or has expired. Request a new confirmation email and try again.'
              : 'We could not confirm your email. Request a new confirmation email and try again.'
          )}`
        );
        return;
      }

      try {
        if (code) {
          const result = await completeAuthWithCode(code, next);
          if (!result.success) {
            router.replace(`/auth/error?reason=${encodeURIComponent(result.message)}`);
            return;
          }
          router.replace(result.redirectTo);
          router.refresh();
          return;
        }

        if (tokenHash && type) {
          const result = await completeAuthWithTokenHash(tokenHash, type, next);
          if (!result.success) {
            router.replace(`/auth/error?reason=${encodeURIComponent(result.message)}`);
            return;
          }
          router.replace(result.redirectTo);
          router.refresh();
          return;
        }

        // Default Supabase email verify redirects with tokens in the URL hash.
        const supabase = createClient();
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            router.replace(
              `/auth/error?reason=${encodeURIComponent(
                'This confirmation link is invalid or has expired.'
              )}`
            );
            return;
          }
        } else {
          // Allow detectSessionInUrl / existing cookie session to settle.
          await supabase.auth.getSession();
        }

        const result = await completeAuthFromExistingSession(next);
        if (!result.success) {
          router.replace(`/auth/error?reason=${encodeURIComponent(result.message)}`);
          return;
        }

        // Clear tokens from the address bar before navigating onward.
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        router.replace(result.redirectTo);
        router.refresh();
      } catch {
        setMessage('Something went wrong while confirming your account.');
        router.replace(
          `/auth/error?reason=${encodeURIComponent(
            'This confirmation link is invalid or has expired.'
          )}`
        );
      }
    };

    void run();
  }, [router, searchParams]);

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
