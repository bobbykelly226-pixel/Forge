/**
 * Composer keyboard / outbound-text helpers for Conversation Experience V1.
 * Forge never rewrites message content beyond trim for empty checks.
 */

export type ComposerKeyDownLike = {
  key: string;
  shiftKey: boolean;
  /** React synthetic composition flag when available */
  isComposing?: boolean;
  nativeEvent?: {
    isComposing?: boolean;
    /** Legacy IME signal used by some browsers during composition */
    keyCode?: number;
  };
};

/**
 * Enter sends; Shift+Enter inserts a newline.
 * Predictive keyboards / IME composition must not submit incomplete text.
 */
export function shouldSubmitComposerOnKeyDown(event: ComposerKeyDownLike): boolean {
  if (event.key !== 'Enter' || event.shiftKey) return false;
  if (event.isComposing) return false;
  if (event.nativeEvent?.isComposing) return false;
  // keyCode 229 = IME processing (composition still active in some engines)
  if (event.nativeEvent?.keyCode === 229) return false;
  return true;
}

/**
 * Returns trimmed outbound body, or null when empty / whitespace-only.
 * Does not alter spelling or internal whitespace of non-empty messages
 * beyond trimming ends.
 */
export function normalizeComposerOutboundText(body: string): string | null {
  const trimmed = body.trim();
  return trimmed.length > 0 ? trimmed : null;
}
