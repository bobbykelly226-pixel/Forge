'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

export type OperatorMfaScreenState =
  | 'not-enrolled'
  | 'enrolling'
  | 'challenge'
  | 'verified'
  | 'unavailable';

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

function safeRedirectTo(value: string) {
  return value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/internal/photo-moderation';
}

export default function OperatorMfaWorkspace({
  email,
  redirectTo,
  initialScreen,
  initialError,
}: {
  email: string;
  redirectTo: string;
  initialScreen: OperatorMfaScreenState;
  initialError?: string | null;
}) {
  const destination = safeRedirectTo(redirectTo);
  const [screen, setScreen] = useState<OperatorMfaScreenState>(initialScreen);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, setPending] = useState(false);

  const beginEnrollment = async () => {
    setPending(true);
    setError(null);
    setCode('');

    try {
      const supabase = createClient();
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const staleFactors = factors.data.all.filter(
        (factor) => factor.factor_type === 'totp' && factor.status === 'unverified'
      );
      for (const factor of staleFactors) {
        const result = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (result.error) throw result.error;
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Forge Founder Authenticator',
      });
      if (enrollError) throw enrollError;

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setScreen('enrolling');
    } catch {
      setError('The authenticator setup could not start. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const verifyFactor = async (factorId: string) => {
    const normalizedCode = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('Enter the six-digit code from your authenticator app.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verification = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: normalizedCode,
      });
      if (verification.error) throw verification.error;

      setEnrollment(null);
      setCode('');
      setScreen('verified');
    } catch {
      setError('That code could not be verified. Wait for a new code and try again.');
    } finally {
      setPending(false);
    }
  };

  const verifyExistingFactor = async () => {
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;
      const factor = factors.data.totp[0];
      if (!factor) throw new Error('No verified authenticator factor is available.');
      setPending(false);
      await verifyFactor(factor.id);
    } catch {
      setPending(false);
      setError('Forge could not start the authenticator check. Reload and try again.');
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B2D5C]">
        <ShieldCheck className="h-4 w-4 text-[#D62828]" aria-hidden="true" />
        Operator only
      </div>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-[#0B2D5C] sm:text-5xl">
        Founder account security
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[#5A6575]">
        Protect <span className="font-semibold text-[#0B2D5C]">{email}</span> with a
        six-digit code from an authenticator app before using administrator tools.
      </p>

      <section className="mt-8 rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-6 shadow-[0_16px_45px_rgba(11,45,92,0.07)] sm:p-8">
        {screen === 'not-enrolled' ? (
          <div>
            <KeyRound className="h-10 w-10 text-[#D62828]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">
              Set up an authenticator
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
              Use Google Authenticator, Microsoft Authenticator, 1Password, Authy, or another
              authenticator app. Forge will never ask you to share the setup secret.
            </p>
            <button
              type="button"
              onClick={() => void beginEnrollment()}
              disabled={pending}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123E78] disabled:opacity-55"
            >
              {pending ? 'Starting setup…' : 'Set up authenticator'}
            </button>
          </div>
        ) : null}

        {screen === 'enrolling' && enrollment ? (
          <div>
            <h2 className="text-2xl font-semibold text-[#0B2D5C]">Scan this QR code</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#5A6575]">
              <li>Open your authenticator app and add a new account.</li>
              <li>Scan the QR code below, or enter the setup key manually.</li>
              <li>Enter the six-digit code the app gives you.</li>
            </ol>
            <div className="mt-6 flex justify-center rounded-2xl border border-[#0B2D5C]/10 bg-white p-4">
              <Image
                src={enrollment.qrCode}
                alt="QR code for the Forge founder authenticator"
                width={240}
                height={240}
                unoptimized
              />
            </div>
            <div className="mt-4 rounded-2xl bg-[#F5F7FA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#687384]">
                Manual setup key
              </p>
              <p className="mt-2 break-all font-mono text-sm text-[#0B2D5C]">
                {enrollment.secret}
              </p>
            </div>
            <CodeForm
              code={code}
              setCode={setCode}
              pending={pending}
              buttonLabel="Verify and enable"
              onSubmit={() => void verifyFactor(enrollment.factorId)}
            />
          </div>
        ) : null}

        {screen === 'challenge' ? (
          <div>
            <KeyRound className="h-10 w-10 text-[#D62828]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">
              Enter your authenticator code
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
              Open the authenticator app connected to Forge and enter its current six-digit code.
            </p>
            <CodeForm
              code={code}
              setCode={setCode}
              pending={pending}
              buttonLabel="Verify and continue"
              onSubmit={() => void verifyExistingFactor()}
            />
          </div>
        ) : null}

        {screen === 'verified' ? (
          <div>
            <CheckCircle2 className="h-12 w-12 text-[#2E7D5B]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">
              Authenticator verified
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
              This session is cleared for operator work. Future sign-ins will require a fresh
              authenticator code before administrator access.
            </p>
            <Link
              href={destination}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123E78]"
            >
              Continue securely
            </Link>
          </div>
        ) : null}

        {screen === 'unavailable' ? (
          <div>
            <KeyRound className="h-10 w-10 text-[#D62828]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold text-[#0B2D5C]">
              Security status unavailable
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
              Forge has paused operator access because it could not safely confirm this session.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123E78]"
            >
              <LoaderCircle className="h-4 w-4" aria-hidden="true" />
              Reload security check
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-2xl border border-[#B42318]/20 bg-[#FFF5F4] px-4 py-3 text-sm text-[#9B1C1C]" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function CodeForm({
  code,
  setCode,
  pending,
  buttonLabel,
  onSubmit,
}: {
  code: string;
  setCode: (value: string) => void;
  pending: boolean;
  buttonLabel: string;
  onSubmit: () => void;
}) {
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="mfa-code" className="block text-sm font-semibold text-[#0B2D5C]">
        Six-digit code
      </label>
      <input
        id="mfa-code"
        name="mfa-code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        disabled={pending}
        className="w-full rounded-2xl border border-[#0B2D5C]/20 px-5 py-4 font-mono text-xl tracking-[0.35em] text-[#0B2D5C] outline-none focus:border-[#0B2D5C]/50 focus:ring-2 focus:ring-[#0B2D5C]/10 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123E78] disabled:opacity-55"
      >
        {pending ? 'Verifying…' : buttonLabel}
      </button>
    </form>
  );
}
