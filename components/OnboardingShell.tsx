'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  finishOnboarding,
  saveOnboardingDateOfBirth,
  saveOnboardingMatchingPreferences,
  saveOnboardingStep,
  saveProfileAnswer,
} from '@/app/actions/onboarding';
import { trackLaunchEvent } from '@/lib/analytics/launch-events';
import {
  PROFILE_ANSWER_KEYS,
  CORE_VALUES_OPTIONS,
  type ProfileAnswersMap,
} from '@/lib/types/profile-answers';
import {
  RELATIONSHIP_GOAL_OPTIONS,
  type RelationshipGoalValue,
} from '@/lib/profile/structured-options';
import { mapLegacyRelationshipGoal } from '@/lib/profile/legacy-mapping';
import { latestEligibleAdultBirthDate } from '@/lib/age';
import {
  GENDER_IDENTITY_OPTIONS,
  INTERESTED_IN_OPTIONS,
  MAX_DISTANCE_MILES,
  MAX_MATCH_AGE,
  MIN_DISTANCE_MILES,
  MIN_MATCH_AGE,
  matchingPreferencesAreComplete,
} from '@/lib/profile/matching-preferences';
import type { Tables } from '@/lib/supabase/database.types';

const TOTAL_STEPS = 6;
const DESKTOP_MEDIA_QUERY = '(min-width: 640px)';

const primaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] disabled:opacity-60';

const secondaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]';

/** Shared with Profile Edit — one source of truth for relationship goals. */
const INTENTION_OPTIONS = RELATIONSHIP_GOAL_OPTIONS;

const VALUES_OPTIONS = CORE_VALUES_OPTIONS;

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

function readRelationshipIntention(
  answers: ProfileAnswersMap
): RelationshipGoalValue | null {
  const raw = readStringAnswer(answers, PROFILE_ANSWER_KEYS.relationshipIntention);
  if (!raw) return null;
  const mapped = mapLegacyRelationshipGoal(raw);
  return mapped.mapped;
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
  initialDateOfBirth = null,
  initialPreferences = null,
  initialStep = 1,
}: {
  initialAnswers?: ProfileAnswersMap;
  initialDateOfBirth?: string | null;
  initialPreferences?: Tables<'profile_preferences'> | null;
  initialStep?: number;
}) {
  const [step, setStep] = useState(() =>
    Math.min(TOTAL_STEPS, Math.max(1, initialStep))
  );
  const [intention, setIntention] = useState<RelationshipGoalValue | null>(() =>
    readRelationshipIntention(initialAnswers)
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    readStringArrayAnswer(initialAnswers, PROFILE_ANSWER_KEYS.coreValues)
  );
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth ?? '');
  const [dateOfBirthSaved, setDateOfBirthSaved] = useState(Boolean(initialDateOfBirth));
  const [genderIdentity, setGenderIdentity] = useState(initialPreferences?.gender_identity ?? '');
  const [interestedIn, setInterestedIn] = useState<string[]>(initialPreferences?.interested_in ?? []);
  const [preferredAgeMin, setPreferredAgeMin] = useState(initialPreferences?.preferred_age_min ?? 25);
  const [preferredAgeMax, setPreferredAgeMax] = useState(initialPreferences?.preferred_age_max ?? 55);
  const [maxDistanceMiles, setMaxDistanceMiles] = useState(initialPreferences?.max_distance_miles ?? 50);
  const [preferencesSaved, setPreferencesSaved] = useState(
    matchingPreferencesAreComplete(initialPreferences)
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

  const selectIntention = (option: RelationshipGoalValue) => {
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
    if (step === 2 && !dateOfBirthSaved) {
      setSaveError('Save a valid date of birth to continue.');
      return;
    }
    if (step === 3 && !preferencesSaved) {
      setSaveError('Save your matching preferences to continue.');
      return;
    }
    if (step === 4 && !intention) {
      setSaveError('Select a relationship intention to continue.');
      return;
    }
    if (step === 5 && selectedValues.length === 0) {
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

  const saveMatchingPreferences = async () => {
    if (isPending || isFinishing) return;
    setSaveError(null);
    setSaveMessage(null);
    setPreferencesSaved(false);
    const result = await saveOnboardingMatchingPreferences({
      genderIdentity,
      interestedIn,
      preferredAgeMin,
      preferredAgeMax,
      maxDistanceMiles,
    });
    if (!result.success) {
      setSaveError(result.message);
      return;
    }
    setPreferencesSaved(true);
    setSaveMessage(result.message);
  };

  const saveDateOfBirth = async () => {
    if (isPending || isFinishing) return;
    setSaveError(null);
    setSaveMessage(null);
    setDateOfBirthSaved(false);
    const result = await saveOnboardingDateOfBirth(dateOfBirth);
    if (!result.success) {
      setSaveError(result.message);
      return;
    }
    setDateOfBirthSaved(true);
    setSaveMessage(result.message);
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

    trackLaunchEvent('Onboarding Completed');
    window.location.href = href;
  };

  const statusMessage =
    saveError ??
    saveMessage ??
    (step === 2
      ? dateOfBirthSaved
        ? 'Your date of birth is stored privately. Only your age is public.'
        : 'Enter and save your full date of birth to continue.'
      : step === 3
        ? preferencesSaved
          ? 'Your matching preferences are stored privately.'
          : 'Complete and save these fields to continue.'
      : step === 4
      ? intention
        ? 'Your intention is saved to your account.'
        : 'Select an option to save your answer.'
      : step === 5
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
              Adult eligibility
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
              Confirm your date of birth
            </h1>
            <p className="mb-6 text-base leading-relaxed text-[#555555]">
              Forge is for adults 18 and older. Your full date of birth stays private; other
              members only see your current age.
            </p>
            <label className="block text-sm font-semibold text-[#0B2D5C]">
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                max={latestEligibleAdultBirthDate()}
                required
                onChange={(event) => {
                  setDateOfBirth(event.target.value);
                  setDateOfBirthSaved(false);
                  setSaveMessage(null);
                  setSaveError(null);
                }}
                className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/20 bg-white px-5 py-4 text-base text-[#0B2D5C] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20"
              />
            </label>
            <button
              type="button"
              onClick={() => void saveDateOfBirth()}
              disabled={!dateOfBirth || isPending || isFinishing}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3 font-semibold text-[#0B2D5C] disabled:opacity-60"
            >
              {dateOfBirthSaved ? 'Saved' : 'Save date of birth'}
            </button>
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
              Matching
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
              Who you would like to meet
            </h1>
            <p className="mb-6 text-base leading-relaxed text-[#555555]">
              These settings stay private. Forge uses them in both directions so members only
              appear when each person fits the other&apos;s preferences.
            </p>

            <fieldset>
              <legend className="text-sm font-semibold text-[#0B2D5C]">I identify as</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GENDER_IDENTITY_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    label={option.label}
                    selected={genderIdentity === option.value}
                    onClick={() => {
                      setGenderIdentity(option.value);
                      setPreferencesSaved(false);
                    }}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-[#0B2D5C]">I am interested in</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {INTERESTED_IN_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    label={option.label}
                    selected={interestedIn.includes(option.value)}
                    onClick={() => {
                      setInterestedIn((current) => {
                        if (option.value === 'everyone') {
                          return current.includes('everyone') ? [] : ['everyone'];
                        }
                        const withoutEveryone = current.filter((value) => value !== 'everyone');
                        return withoutEveryone.includes(option.value)
                          ? withoutEveryone.filter((value) => value !== option.value)
                          : [...withoutEveryone, option.value];
                      });
                      setPreferencesSaved(false);
                    }}
                  />
                ))}
              </div>
            </fieldset>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-[#0B2D5C]">
                Minimum age
                <input
                  type="number"
                  min={MIN_MATCH_AGE}
                  max={MAX_MATCH_AGE}
                  value={preferredAgeMin}
                  onChange={(event) => {
                    setPreferredAgeMin(Number(event.target.value));
                    setPreferencesSaved(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/20 px-4 py-3"
                />
              </label>
              <label className="text-sm font-semibold text-[#0B2D5C]">
                Maximum age
                <input
                  type="number"
                  min={MIN_MATCH_AGE}
                  max={MAX_MATCH_AGE}
                  value={preferredAgeMax}
                  onChange={(event) => {
                    setPreferredAgeMax(Number(event.target.value));
                    setPreferencesSaved(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/20 px-4 py-3"
                />
              </label>
            </div>

            <label className="mt-5 block text-sm font-semibold text-[#0B2D5C]">
              Maximum distance: {maxDistanceMiles} miles
              <input
                type="range"
                min={MIN_DISTANCE_MILES}
                max={MAX_DISTANCE_MILES}
                step="5"
                value={maxDistanceMiles}
                onChange={(event) => {
                  setMaxDistanceMiles(Number(event.target.value));
                  setPreferencesSaved(false);
                }}
                className="mt-3 w-full accent-[#D62828]"
              />
            </label>

            <button
              type="button"
              onClick={() => void saveMatchingPreferences()}
              disabled={isPending || isFinishing}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3 font-semibold text-[#0B2D5C] disabled:opacity-60"
            >
              {preferencesSaved ? 'Saved' : 'Save matching preferences'}
            </button>
            <p className={`mt-5 text-sm ${saveError ? 'text-[#D62828]' : 'text-[#777777]'}`}>
              {statusMessage}
            </p>
          </section>
        )}

        {step === 4 && (
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
                  key={option.value}
                  label={option.label}
                  selected={intention === option.value}
                  disabled={isFinishing}
                  onClick={() => selectIntention(option.value)}
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

        {step === 5 && (
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

        {step === 6 && (
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
                onClick={() => void handleFinish('/profile')}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] disabled:opacity-60"
              >
                {isFinishing ? 'Saving...' : 'Manage My Profile'}
              </button>
              <button
                type="button"
                disabled={isFinishing}
                onClick={() => void handleFinish('/profile/preview')}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540] disabled:opacity-60"
              >
                {isFinishing ? 'Saving...' : 'View My Profile'}
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
