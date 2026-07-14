'use client';

import { signUpWithEmail } from '@/app/actions/auth';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signUpWithEmail({
        email,
        password,
        origin: window.location.origin,
      });

      if (result.status === 'session') {
        router.push('/onboarding');
        router.refresh();
        return;
      }

      if (result.status === 'error' || !result.success) {
        setError(result.message);
        return;
      }

      // confirmation_sent or already_registered — calm guidance, never a false delivery claim for errors
      setMessage(result.message);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-16 pb-20 max-w-md mx-auto px-5 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-4">
            Join Forge
          </h1>
          <p className="text-lg text-[#444444] leading-relaxed">
            Create your account and help build a dating platform rooted in values,
            character, and intentional relationships.
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
              autoComplete="new-password"
              minLength={8}
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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-[#444444] mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0B2D5C] font-semibold hover:text-[#D62828] transition">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
