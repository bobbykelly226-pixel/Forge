export const COMPATIBILITY_PROFILE_PAGE_DESCRIPTION =
  'Complete your Forge Compatibility Profile privately at your own pace.' as const;

export const DIRECTORY_COPY = {
  eyebrow: 'Compatibility Profile',
  title: 'Your Compatibility Profile',
  body: 'Complete the categories at your own pace. Your answers are saved privately and can be reviewed or changed whenever you choose.',
  supporting:
    'More completed categories give Forge more context to explain meaningful alignment. Completion is encouraged, never required.',
} as const;

export const PROFILE_CARD_COPY = {
  eyebrow: 'Compatibility Profile',
  heading: 'Build a deeper picture of what matters to you',
  body: 'Complete the categories at your own pace. Each answer gives Forge more context to explain meaningful alignment while leaving the decision and the conversation to you.',
  supporting: 'Your answers are private. You can leave and return at any time.',
  start: 'Start Compatibility Profile',
  continue: 'Continue Compatibility Profile',
  review: 'Review Compatibility Profile',
} as const;

export const SAVE_STATUS_COPY = {
  saving: 'Saving',
  saved: 'Saved',
  error: 'Could not save your answer. Try again.',
  progressError: 'Could not save your progress. Try again.',
  restartError: 'Could not complete the restart. Try again.',
  loadError: 'Could not load your Compatibility Profile.',
} as const;

/** Safe user-facing copy keyed by authoritative database codes. */
export const QUESTIONNAIRE_ERROR_COPY = {
  stale_revision: 'A newer answer is already saved.',
  stale_generation: 'Your Compatibility Profile was restarted. Reload and try again.',
  idempotency_conflict: 'That action could not be completed. Try again.',
  operation_id_required: 'Could not complete that action. Try again.',
} as const;

/**
 * Map structured questionnaire failures to dash-free user copy.
 * Never surface raw transport/network text.
 */
export function questionnaireErrorMessage(input: {
  code?: string;
  message?: string | null;
  transportError?: boolean;
  fallback: string;
}): string {
  if (input.code && input.code in QUESTIONNAIRE_ERROR_COPY) {
    return QUESTIONNAIRE_ERROR_COPY[input.code as keyof typeof QUESTIONNAIRE_ERROR_COPY];
  }
  if (input.transportError) {
    return input.fallback;
  }
  const candidate = typeof input.message === 'string' ? input.message.trim() : '';
  // Authoritative RPC messages are already user-facing; reject anything that looks internal.
  if (
    candidate &&
    !/^(error|failed|network|fetch|socket|ECONN|timeout|postgres|permission denied)/i.test(
      candidate
    ) &&
    !candidate.includes('\n') &&
    candidate.length < 180
  ) {
    return candidate;
  }
  return input.fallback;
}

export const CATEGORY_COMPLETE_COPY = {
  eyebrow: 'Category Complete',
  body: 'Your answers are saved. You can review this category anytime or continue when you are ready.',
  review: 'Review Answers',
  backToCategories: 'Back to Categories',
  backToProfile: 'Back to Profile',
} as const;

export const OVERALL_COMPLETE_COPY = {
  eyebrow: 'Compatibility Profile Complete',
  heading: 'You completed all ten categories',
  body: 'Your Compatibility Profile gives Forge deeper context for explaining meaningful alignment while leaving the decision and the conversation to you.',
  summarySaved: 'Your answers are saved privately',
  review: 'Review Categories',
  backToProfile: 'Back to Profile',
  restart: 'Restart Compatibility Profile',
} as const;

export const RESTART_CATEGORY_COPY = {
  heading: 'Restart this category?',
  body: 'This permanently clears every saved answer in this category. Answers in other categories will remain saved.',
  confirm: 'Restart Category',
  cancel: 'Keep Answers',
} as const;

export const RESTART_FULL_COPY = {
  heading: 'Restart your Compatibility Profile?',
  body: 'This permanently clears every saved response across all ten categories. Your Essential Profile and public profile will not be changed.',
  confirm: 'Restart Compatibility Profile',
  cancel: 'Keep Answers',
} as const;

export const CATEGORY_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
} as const;

export const CATEGORY_ACTION_LABELS = {
  start: 'Start',
  continue: 'Continue',
  review: 'Review',
} as const;
