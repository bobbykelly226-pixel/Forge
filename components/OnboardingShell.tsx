'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  finishOnboarding,
  saveOnboardingStep,
  saveProfileAnswer,
} from '@/app/actions/onboarding';
import {
  PROFILE_ANSWER_KEYS,
  type ProfileAnswersMap,
} from '@/lib/types/profile-answers';

const TOTAL_STEPS = 4;
const DESKTOP_MEDIA_QUERY = '(min-width: 640px)';

const primaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] disabled:opacity-60';

const secondaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]';

const INTENTION_OPTIONS = [
  'Long-term relationship',
  'Marriage-minded',
  'Open to serious dating',
  'Not sure yet, but intentional',
] as const;

const VALUES_OPTIONS = [
  'Faith',
  'Family',
  'Communication',
  'Emotional maturity',
  'Loyalty',
  'Shared goals',
  'Service',
  'Growth',
] as const;

function ProgressBar({ step }: { step: number }) {
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#D62828]">
          Step {step} of {TOTAL_STEPS}
        </p>
        <p className="text-sm text-[#666666]">{Math.round(progress)}% complete</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#0B2D5C]/10">
        <div
          className="h-full rounded-full bg-[#0B2D5C] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-medium transition disabled:opacity-60 ${
        selected
          ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white'
          : 'border-[#0B2D5C]/15 bg-white text-[#0B2D5C] hover:border-[#0B2D5C]/35'
      }`}
    >
      {label}
    </button>
  );
}

function readStringAnswer(
  answers: ProfileAnswersMap,
  key: (typeof PROFILE_ANSWER_KEYS)[keyof typeof PROFILE_ANSWER_KEYS]
): string | null {
  const value = answers[key];
  return typeof value === 'string' ? value : null;
}

function readStringArrayAnswer(
  answers: ProfileAnswersMap,
  key: (typeof PROFILE_ANSWER_KEYS)[keyof typeof PROFILE_ANSWER_KEYS]
): string[] {
  const value = answers[key];
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

export default function OnboardingShell({
  initialAnswers = {},
  initialStep = 1,
}: {
  initialAnswers?: ProfileAnswersMap;
  initialStep?: number;
}) {
  const [step, setStep] = useState(() =>
    Math.min(TOTAL_STEPS, Math.max(1, initialStep))
  );
  const [intention, setIntention] = useState<string | null>(() =>
    readStringAnswer(initialAnswers, PROFILE_ANSWER_KEYS.relationshipIntention)
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    readStringArrayAnswer(initialAnswers, PROFILE_ANSWER_KEYS.coreValues)
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFinishing, setIsFinishing] = useState(false);

  const saveGenerationRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const syncViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  const persistStep = (nextStep: number) => {
    startTransition(() => {
      void saveOnboardingStep(nextStep);
    });
  };

  const persistAnswer = (
    questionKey: string,
    answerValue: string | string[],
    successMessage: string
  ) => {
    const generation = (saveGenerationRef.current[questionKey] ?? 0) + 1;
    saveGenerationRef.current[questionKey] = generation;

    void (async () => {
      try {
        const result = await saveProfileAnswer(questionKey, answerValue);

        if (saveGenerationRef.current[questionKey] !== generation) {
          return;
        }

        if (result.success) {
          setSaveError(null);
          setSaveMessage(successMessage);
        } else {
          setSaveMessage(null);
          setSaveError(result.message);
        }
      } catch {
        if (saveGenerationRef.current[questionKey] !== generation) {
          return;
        }

        setSaveMessage(null);
        setSaveError('Could not save your answer. Please try again.');
      }
    })();
  };

  const selectIntention = (option: string) => {
    if (isPending || isFinishing) return;
    setIntention(option);
    setSaveError(null);
    persistAnswer(
      PROFILE_ANSWER_KEYS.relationshipIntention,
      option,
      'Intention saved.'
    );
  };

  const toggleValue = (value: string) => {
    if (isPending || isFinishing) return;
    const next = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];

    setSelectedValues(next);
    setSaveError(null);
    persistAnswer(
      PROFILE_ANSWER_KEYS.coreValues,
      next,
      next.length > 0 ? 'Values saved.' : 'Values cleared.'
    );
  };

  const goBack = () => {
    setSaveMessage(null);
    setSaveError(null);
    setStep((current) => {
      const next = Math.max(1, current - 1);
      persistStep(next);
      return next;
    });
  };

  const goNext = () => {
    if (step === 2 && !intention) {
      setSaveError('Select a relationship intention to continue.');
      return;
    }
    if (step === 3 && selectedValues.length === 0) {
      setSaveError('Select at least one value to continue.');
      return;
    }

    setSaveMessage(null);
    setSaveError(null);
    setStep((current) => {
      const next = Math.min(TOTAL_STEPS, current + 1);
      persistStep(next);
      return next;
    });
  };

  const handleFinish = async (href: string) => {
    if (isFinishing) return;
    setIsFinishing(true);
    setSaveError(null);

    const result = await finishOnboarding();
    if (!result.success) {
      setSaveError(result.message);
      setIsFinishing(false);
      return;
    }

    window.location.href = href;
  };

  const statusMessage =
    saveError ??
    saveMessage ??
    (step === 2
      ? intention
        ? 'Your intention is saved to your account.'
        : 'Select an option to save your answer.'
      : step === 3
        ? selectedValues.length > 0
          ? 'Your values are saved to your account.'
          : 'Select one or more values to save your answer.'
        : null);

  const backControl =
    step > 1 ? (
      <button type="button" onClick={goBack} className={secondaryButtonClassName}>
        Back
      </button>
    ) : (
      <Link href="/app" className={secondaryButtonClassName}>
        Back to App
      </Link>
    );

  const continueControl = (
    <button
      type="button"
      onClick={goNext}
      disabled={isPending || isFinishing}
      className={primaryButtonClassName}
    >
      Continue
    </button>
  );

  return (
    <div className="mx-auto max-w-lg px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
      <Link
        href="/app"
        className="mb-6 inline-flex items-center text-sm font-medium text-[#0B2D5C] transition hover:text-[#D62828]"
      >
        ← Back to App
      </Link>

      <ProgressBar step={step} />

      <div className="rounded-[2rem] border border-[#0B2D5C]/10 bg-white p-7 shadow-[0_18px_50px_rgba(11,45,92,0.06)] sm:p-9">
        {step === 1 && (
          <section>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              Welcome
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
              Welcome to Forge
            </h1>
            <p className="text-base leading-relaxed text-[#555555] sm:text-lg">
              Forge is built for people who want something real. We&apos;ll start by learning what
              matters most so future compatibility can be based on more than photos and
              surface-level attraction.
            </p>
            <p className="mt-5 text-base leading-relaxed text-[#555555]">
              This first pass is simple on purpose. Your answers are saved to your account so you
              can leave and come back anytime.
            </p>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              Intention
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
              What you&apos;re looking for
            </h1>
            <p className="mb-6 text-base leading-relaxed text-[#555555]">
              Choose the option that best reflects your relationship intention right now. You can
              refine this later.
            </p>
            <div className="space-y-3">
              {INTENTION_OPTIONS.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={intention === option}
                  disabled={isFinishing}
                  onClick={() => selectIntention(option)}
                />
              ))}
            </div>
            <p
              className={`mt-5 text-sm ${saveError ? 'text-[#D62828]' : 'text-[#777777]'}`}
              role={saveError ? 'alert' : undefined}
            >
              {statusMessage}
            </p>
          </section>
        )}

        {step === 3 && (
          <section>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              Values
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
              What matters most
            </h1>
            <p className="mb-6 text-base leading-relaxed text-[#555555]">
              Select the values that feel most important in a relationship. Choose as many as
              resonate.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VALUES_OPTIONS.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={selectedValues.includes(option)}
                  disabled={isFinishing}
                  onClick={() => toggleValue(option)}
                />
              ))}
            </div>
            <p
              className={`mt-5 text-sm ${saveError ? 'text-[#D62828]' : 'text-[#777777]'}`}
              role={saveError ? 'alert' : undefined}
            >
              {statusMessage}
            </p>
          </section>
        )}

        {step === 4 && (
          <section>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              Readiness
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
              Your profile is next
            </h1>
            <p className="mb-5 text-base leading-relaxed text-[#555555] sm:text-lg">
              Your Forge profile is where compatibility starts to become visible. The more honest
              and complete it is, the better Forge can help surface meaningful alignment.
            </p>
            <p className="mb-8 text-base leading-relaxed text-[#555555]">
              Take a moment to strengthen your profile, then preview how others may see you.
            </p>
            {saveError && (
              <p className="mb-4 text-sm text-[#D62828]" role="alert">
                {saveError}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={isFinishing}
                onClick={() => void handleFinish('/profile/edit')}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] disabled:opacity-60"
              >
                {isFinishing ? 'Saving...' : 'Edit Profile'}
              </button>
              <button
                type="button"
                disabled={isFinishing}
                onClick={() => void handleFinish('/profile/preview')}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540] disabled:opacity-60"
              >
                {isFinishing ? 'Saving...' : 'Preview Profile'}
              </button>
              <button
                type="button"
                disabled={isFinishing}
                onClick={() => void handleFinish('/profile')}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2] disabled:opacity-60"
              >
                {isFinishing ? 'Saving...' : 'Go to My Profile'}
              </button>
            </div>
          </section>
        )}
      </div>

      {step < TOTAL_STEPS && (
        <div className="mt-6" data-onboarding-nav={isDesktop ? 'desktop' : 'mobile'}>
          {isDesktop ? (
            <div className="grid grid-cols-2 gap-3">
              {backControl}
              {continueControl}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {continueControl}
              {backControl}
            </div>
          )}
        </div>
      )}

      {step === TOTAL_STEPS && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={goBack}
            className="text-sm font-medium text-[#666666] transition hover:text-[#0B2D5C]"
          >
            ← Previous step
          </button>
        </div>
      )}
    </div>
  );
}
