/** Only these deliberately public database failures may be shown to members. */
export function contactErrorMessage(message: string): string | null {
  const messages: Record<string, string> = {
    FORGE_CONTACT_UNAVAILABLE: 'This contact is unavailable. Check your profile readiness or try another connection.',
    FORGE_INTEREST_RATE_LIMIT: 'You have sent a lot of interest recently. Please take a break and try again later.',
    FORGE_INTEREST_REPEAT_LIMIT: 'You can send interest to the same person once every 24 hours.',
    FORGE_MESSAGE_RATE_LIMIT: 'You are sending messages quickly. Please wait a minute before sending again.',
    FORGE_REPEATED_OUTREACH: 'Please make each conversation personal instead of sending the same message to many people.',
  };
  return messages[message] ?? null;
}
