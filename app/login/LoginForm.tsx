'use client';

import { requestPasswordReset, resendConfirmationEmail } from '@/app/actions/auth';
import Header from '@/components/Header';
import { AUTH_RESEND_COOLDOWN_MS, mapAuthErrorMessage } from '@/lib/auth/messages';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const RESEND_COOLDOWN_SECONDS = Math.ceil(AUTH_RESEND_COOLDOWN_MS / 1000);

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  useEffect(() => {
    if (resendCoolSeconds <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setResendCoolSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCoolSeconds]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(mapAuthErrorMessage(signInError.message));
        return;
      }

      router.push(redirectTo.startsWith('/') ? redirectTo : '/app');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCoolSeconds > 0) return;
    setError(null);
    setMessage(null);
    setIsResending(true);

    try {
      const result = await resendConfirmationEmail({
        email,
        origin: window.location.origin,
      });

      setResendCoolSeconds(RESEND_COOLDOWN_SECONDS);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
    } catch {
      setError('Could not resend the confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    setMessage(null);
    setIsResetting(true);
    try {
      const result = await requestPasswordReset({
        email,
        origin: window.location.origin,
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setMessage(result.message);
    } catch {
      setError('Could not start a password reset. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-16 pb-20 max-w-md mx-auto px-5 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-4">
            Welcome Back
          </h1>
          <p className="text-lg text-[#444444] leading-relaxed">
            Sign in to continue building meaningful connections with Forge.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 text-lg"
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 text-lg"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D62828] hover:bg-[#A61F1F] disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-lg transition"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-3 text-center">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={isResending || !email || resendCoolSeconds > 0}
            className="text-sm font-medium text-[#0B2D5C] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {isResending
              ? 'Sending confirmation email...'
              : resendCoolSeconds > 0
                ? `Resend available in ${resendCoolSeconds}s`
                : 'Resend confirmation email'}
          </button>
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isResetting || !email}
            className="text-sm font-medium text-[#5A6575] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {isResetting ? 'Sending reset link...' : 'Reset password'}
          </button>
        </div>

        <p className="text-center text-[#444444] mt-8">
          New to Forge?{' '}
          <Link href="/signup" className="text-[#0B2D5C] font-semibold hover:text-[#D62828] transition">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
