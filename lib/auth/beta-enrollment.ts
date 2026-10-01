export const BETA_FULL_MESSAGE = 'The Founding Beta is currently full. Join the waitlist and we’ll let you know when more places open.';

export type BetaCapacity = { accountLimit: number; accountCount: number };

export function isBetaFull(capacity: BetaCapacity): boolean {
  return capacity.accountCount >= capacity.accountLimit;
}

export function betaAccountStatus(member?: { confirmed_at: string | null }) {
  return !member ? 'No account yet' : member.confirmed_at ? 'Email confirmed' : 'Needs email confirmation';
}
