/**
 * In-memory Open to Chat session flags for the UI/UX prototype.
 * Refresh resets. No persistence or backend.
 */

let openToChatEducationCompleted = false;

export function hasCompletedOpenToChatEducation(): boolean {
  return openToChatEducationCompleted;
}

export function markOpenToChatEducationComplete(): void {
  openToChatEducationCompleted = true;
}
