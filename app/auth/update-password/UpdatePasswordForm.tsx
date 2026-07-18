'use client';

import PasswordInput from '@/components/auth/PasswordInput';
import Header from '@/components/Header';
import { mapAuthErrorMessage } from '@/lib/auth/messages';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Set a new password after a recovery-link session (or while signed in).
 * Requires an authenticated Supabase session established by the reset callback.
 */
export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Your reset session expired. Request a new password reset link and try again.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(mapAuthErrorMessage(updateError.message));
        return;
      }

      setMessage('Your password was updated. Continuing to Forge…');
      window.setTimeout(() => {
        router.push('/app');
        router.refresh();
      }, 700);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="mx-auto max-w-md px-5 pb-20 pt-16 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#0B2D5C] sm:text-5xl">
            Set a new password
          </h1>
          <p className="text-lg leading-relaxed text-[#444444]">
            Choose a new password for your Forge account. Use at least 8 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput
            id="new-password"
            name="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isSubmitting}
            label="New password"
          />

          <PasswordInput
            id="confirm-new-password"
            name="confirm-new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isSubmitting}
            label="Confirm new password"
          />

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {message ? (
            <p
              className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              role="status"
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#D62828] py-5 text-lg font-semibold text-white transition hover:bg-[#A61F1F] disabled:bg-gray-400"
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="mt-8 text-center text-[#444444]">
          Remembered your password?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#0B2D5C] transition hover:text-[#D62828]"
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
