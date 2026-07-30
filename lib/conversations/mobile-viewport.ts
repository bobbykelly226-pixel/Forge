const MOBILE_KEYBOARD_HEIGHT_THRESHOLD = 120;
type ConversationViewportInput = {
  visualViewportHeight: number;
  visualViewportOffsetTop: number;
  threadTop: number;
};

export function isLikelyMobileKeyboardOpen(
  layoutViewportHeight: number,
  visualViewportHeight: number
): boolean {
  return layoutViewportHeight - visualViewportHeight > MOBILE_KEYBOARD_HEIGHT_THRESHOLD;
}

export function calculateVisibleConversationHeight({
  visualViewportHeight,
  visualViewportOffsetTop,
  threadTop,
}: ConversationViewportInput): number {
  const visualViewportBottom = visualViewportOffsetTop + visualViewportHeight;
  const visibleThreadTop = Math.max(threadTop, visualViewportOffsetTop);

  return Math.max(0, Math.floor(visualViewportBottom - visibleThreadTop));
}
