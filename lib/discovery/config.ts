/**
 * Open to Chat product configuration.
 *
 * No numeric daily send limit has been formally established in product docs.
 * Server-side counting exists via `count_open_to_chat_sent_today`.
 * Keep this null until Bobby / product sets an explicit number.
 */
export const OPEN_TO_CHAT_DAILY_LIMIT: number | null = null;

export const OPEN_TO_CHAT_DAILY_LIMIT_STATUS =
  'Product decision pending — reusable daily-count infrastructure is ready; no numeric limit is enforced.' as const;

/** Neutral Discovery alignment placeholder until matching scores exist. */
export const DISCOVERY_NEUTRAL_ALIGNMENT_LABEL = 'More to Discover';

export const DISCOVERY_NEUTRAL_CONFIDENCE = '—';

export const DISCOVERY_SURFACED_REASON =
  'This profile is active and available in your current Forge Discovery experience.';
