'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  CircleHelp,
  LifeBuoy,
  Lightbulb,
  MessageSquarePlus,
  ShieldCheck,
} from 'lucide-react';

import { submitBetaFeedbackAction } from '@/app/actions/feedback';
import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeAuthenticatedTwoColumnShell from '@/components/ForgeAuthenticatedTwoColumnShell';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import { INITIAL_BETA_FEEDBACK_STATE } from '@/lib/feedback/action-state';
import { trackLaunchEvent } from '@/lib/analytics/launch-events';
import {
  BETA_FEEDBACK_AREAS,
  BETA_FEEDBACK_CATEGORIES,
} from '@/lib/feedback/constants';
import { BETA_FEEDBACK_MESSAGE_MAX_LENGTH } from '@/lib/feedback/validation';

const CATEGORY_ICONS = {
  broken: Bug,
  confusing: CircleHelp,
  support: LifeBuoy,
  idea: Lightbulb,
} as const;

export default function BetaFeedbackWorkspace() {
  const [state, formAction, pending] = useActionState(
    submitBetaFeedbackAction,
    INITIAL_BETA_FEEDBACK_STATE
  );
  const trackedReference = useRef<string | null>(null);

  useEffect(() => {
    if (!state.success || !state.reference || trackedReference.current === state.reference) {
      return;
    }
    trackedReference.current = state.reference;
    trackLaunchEvent('Beta Feedback Submitted');
  }, [state.reference, state.success]);

  return (
    <>
      <ForgeAuthenticatedTwoColumnShell
        aside={
          <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_12px_32px_rgba(11,45,92,0.04)] backdrop-blur-sm xl:p-7">
            <Image
              src="/Logos/forgedinlife-header-dark.png"
              alt="Forge"
              width={200}
              height={48}
              className="h-12 w-auto"
            />
            <h1
              className="mt-8 text-[1.75rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Beta Feedback
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
              Tell us what worked, what did not, and what would make Forge clearer or more useful.
            </p>
            <ForgeDesktopAppNav active="feedback" />
          </div>
        }
      >
        <DiscoveryDesktopTopBar />

        <main className="mx-auto w-full max-w-3xl px-4 pb-[7.5rem] sm:px-6 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10">
          <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
            <Image
              src="/Logos/forgedinlife-header-dark.png"
              alt="Forge"
              width={200}
              height={56}
              className="h-12 w-auto sm:h-14"
            />
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0B2D5C]/12 bg-white/75 px-3 py-2 text-xs font-semibold text-[#0B2D5C]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Profile
            </Link>
          </div>

          <section className="overflow-hidden rounded-[1.9rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_18px_55px_rgba(11,45,92,0.07)]">
            <div className="border-b border-[#0B2D5C]/08 bg-[linear-gradient(135deg,rgba(11,45,92,0.06),rgba(214,40,40,0.035))] px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.2)]">
                  <MessageSquarePlus className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                    Founding beta
                  </p>
                  <h2
                    className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#0B2D5C] sm:text-4xl"
                    style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                  >
                    Help us improve Forge
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5A6575] sm:text-base">
                    Your feedback goes directly to the Forge team. Include enough detail for us to understand what you saw and what you expected.
                  </p>
                </div>
              </div>
            </div>

            {state.success ? (
              <div className="px-5 py-8 sm:px-8 sm:py-10" data-testid="beta-feedback-success">
                <CheckCircle2
                  className="h-12 w-12 text-[#2E7D5B]"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <h3 className="mt-5 text-2xl font-semibold text-[#0B2D5C]">Feedback received</h3>
                <p className="mt-3 text-base leading-relaxed text-[#4F5C6D]">{state.message}</p>
                <div className="mt-6 rounded-2xl border border-[#0B2D5C]/10 bg-[#F4F6F9] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6F7A89]">
                    Submission reference
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold tracking-[0.08em] text-[#0B2D5C]">
                    {state.reference}
                  </p>
                </div>
                {state.responseExpectation ? (
                  <p className="mt-5 text-sm leading-relaxed text-[#5A6575]">
                    {state.responseExpectation}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/discovery"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123E78]"
                  >
                    Return to Discovery
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-5 py-3.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#F4F6F9]"
                  >
                    Go to My Profile
                  </Link>
                </div>
              </div>
            ) : (
              <form action={formAction} className="space-y-8 px-5 py-7 sm:px-8 sm:py-9">
                <fieldset>
                  <legend className="text-base font-semibold text-[#0B2D5C]">
                    What would you like to share?
                  </legend>
                  <div
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                    role="radiogroup"
                    aria-invalid={Boolean(state.fieldErrors?.category)}
                    aria-describedby={
                      state.fieldErrors?.category ? 'feedback-category-error' : undefined
                    }
                  >
                    {BETA_FEEDBACK_CATEGORIES.map((category) => {
                      const Icon = CATEGORY_ICONS[category.value];
                      return (
                        <label
                          key={category.value}
                          className="group cursor-pointer rounded-2xl border border-[#0B2D5C]/10 bg-[#FCFBF9] p-4 transition hover:border-[#0B2D5C]/25 has-[:checked]:border-[#D62828]/55 has-[:checked]:bg-[#FFF7F6] has-[:checked]:shadow-[0_8px_24px_rgba(214,40,40,0.07)]"
                        >
                          <input
                            type="radio"
                            name="category"
                          value={category.value}
                          className="peer sr-only"
                          required
                        />
                          <span className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B2D5C]/07 text-[#0B2D5C] group-has-[:checked]:bg-[#D62828] group-has-[:checked]:text-white group-has-[:focus-visible]:outline group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-[#0B2D5C]">
                              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-[#0B2D5C]">
                                {category.label}
                              </span>
                              <span className="mt-1.5 block text-xs leading-relaxed text-[#687384]">
                                {category.description}
                              </span>
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {state.fieldErrors?.category ? (
                    <p
                      id="feedback-category-error"
                      className="mt-2 text-sm text-[#B42318]"
                      role="alert"
                    >
                      {state.fieldErrors.category}
                    </p>
                  ) : null}
                </fieldset>

                <div>
                  <label htmlFor="feedback-area" className="text-base font-semibold text-[#0B2D5C]">
                    Which part of Forge is this about?
                  </label>
                  <select
                    id="feedback-area"
                    name="area"
                    defaultValue=""
                    required
                    aria-invalid={Boolean(state.fieldErrors?.area)}
                    className="mt-3 w-full rounded-2xl border border-[#0B2D5C]/14 bg-white px-4 py-3.5 text-sm text-[#1A2332] outline-none transition focus:border-[#0B2D5C]/45 focus:ring-2 focus:ring-[#0B2D5C]/10"
                  >
                    <option value="" disabled>
                      Choose an area
                    </option>
                    {BETA_FEEDBACK_AREAS.map((area) => (
                      <option key={area.value} value={area.value}>
                        {area.label}
                      </option>
                    ))}
                  </select>
                  {state.fieldErrors?.area ? (
                    <p className="mt-2 text-sm text-[#B42318]" role="alert">
                      {state.fieldErrors.area}
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-end justify-between gap-4">
                    <label htmlFor="feedback-message" className="text-base font-semibold text-[#0B2D5C]">
                      Tell us more
                    </label>
                    <span className="text-xs text-[#7A8494]">Up to 2,000 characters</span>
                  </div>
                  <textarea
                    id="feedback-message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={BETA_FEEDBACK_MESSAGE_MAX_LENGTH}
                    rows={7}
                    placeholder="What happened? What did you expect? If it is confusing, tell us where you got stuck."
                    className="mt-3 w-full resize-y rounded-2xl border border-[#0B2D5C]/14 bg-white px-4 py-3.5 text-sm leading-relaxed text-[#1A2332] outline-none transition placeholder:text-[#98A0AC] focus:border-[#0B2D5C]/45 focus:ring-2 focus:ring-[#0B2D5C]/10"
                    aria-describedby="feedback-message-help"
                    aria-invalid={Boolean(state.fieldErrors?.message)}
                  />
                  <p id="feedback-message-help" className="mt-2 text-xs leading-relaxed text-[#7A8494]">
                    Please do not include passwords, payment information, or another member&apos;s private information.
                  </p>
                  {state.fieldErrors?.message ? (
                    <p className="mt-2 text-sm text-[#B42318]" role="alert">
                      {state.fieldErrors.message}
                    </p>
                  ) : null}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#0B2D5C]/09 bg-[#F7F8FA] p-4">
                  <input
                    type="checkbox"
                    name="contactRequested"
                    defaultChecked
                    className="mt-0.5 h-4 w-4 rounded border-[#0B2D5C]/25 accent-[#0B2D5C]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#0B2D5C]">
                      You may contact me about this
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[#687384]">
                      We will use the email already associated with your Forge account.
                    </span>
                  </span>
                </label>

                <div className="rounded-2xl border border-[#D9B45B]/35 bg-[#FFF9EA] p-4 text-sm leading-relaxed text-[#67531E]">
                  <span className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                    <span>
                      <strong className="font-semibold">Need to report a member or safety concern?</strong>{' '}
                      Use <strong className="font-semibold">Report</strong> from that member&apos;s profile or conversation. Safety reports follow a separate protected review process.
                    </span>
                  </span>
                </div>

                {state.message ? (
                  <p className="rounded-2xl border border-[#D62828]/20 bg-[#FFF5F4] px-4 py-3 text-sm text-[#9B1C1C]" role="alert">
                    {state.message}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(214,40,40,0.2)] transition hover:bg-[#B92020] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {pending ? 'Sending feedback…' : 'Send Beta Feedback'}
                </button>

                <p className="text-center text-xs leading-relaxed text-[#7A8494]">
                  Bugs and confusing experiences are reviewed within two business days during beta. Ideas are reviewed for product learning, though a direct reply is not guaranteed.
                </p>
              </form>
            )}
          </section>
        </main>
      </ForgeAuthenticatedTwoColumnShell>

      <ForgeAppBottomNav active={null} />
    </>
  );
}
