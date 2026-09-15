/** FIX-011: approved Open to Chat allowance and anti-spam contract. */
export const OPEN_TO_CHAT_DAILY_LIMIT = 3;
export const OPEN_TO_CHAT_PREMIUM_DAILY_LIMIT = 5;
export const OPEN_TO_CHAT_ROLLING_WINDOW_HOURS = 24;
export const OPEN_TO_CHAT_RECIPIENT_COOLDOWN_DAYS = 7;
export const OPEN_TO_CHAT_SEND_COOLDOWN_SECONDS = 60;

export const OPEN_TO_CHAT_DAILY_LIMIT_STATUS =
  'Three successful requests per rolling 24 hours; no carryover or add-on requests.' as const;

/** Neutral Discovery alignment label when more profile context is still needed. */
export const DISCOVERY_NEUTRAL_ALIGNMENT_LABEL = 'More to Discover';

/**
 * Placeholder for legacy feed/hub card field.
 * Not a Confidence metric — never display High/Medium/Low confidence.
 */
export const DISCOVERY_NEUTRAL_CONFIDENCE = '—';

export const DISCOVERY_SURFACED_REASON =
  'This profile is active and available in your current Forge Discovery experience.';
