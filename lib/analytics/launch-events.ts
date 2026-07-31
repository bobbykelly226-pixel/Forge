'use client';

import { track } from '@vercel/analytics';

import { isProductionAnalyticsHost } from '@/lib/analytics/privacy';

type AnalyticsProperty = string | number | boolean | null;

export type LaunchEventPayloads = {
  'Account Signup Accepted': {
    flow: 'instant_session' | 'email_confirmation';
  };
  'Sign In Completed': undefined;
  'Onboarding Completed': undefined;
  'Compatibility Category Completed': {
    category: string;
  };
  'Compatibility Profile Completed': undefined;
  'Discovery Visibility Enabled': undefined;
  'Discovery Action Completed': {
    action: 'interested' | 'open_to_chat' | 'save_for_later' | 'not_for_me';
  };
  'Open To Chat Response Completed': {
    response: 'accepted' | 'saved_for_later' | 'declined';
  };
  'Connection Created': {
    method: 'mutual_interest' | 'open_to_chat';
  };
  'Conversation Started': undefined;
  'Message Sent': {
    attachment: 'none' | 'photo' | 'file';
  };
  'Beta Feedback Submitted': undefined;
};

export type LaunchEventName = keyof LaunchEventPayloads;

export const LAUNCH_EVENT_PROPERTY_ALLOWLIST: Record<
  LaunchEventName,
  readonly string[]
> = {
  'Account Signup Accepted': ['flow'],
  'Sign In Completed': [],
  'Onboarding Completed': [],
  'Compatibility Category Completed': ['category'],
  'Compatibility Profile Completed': [],
  'Discovery Visibility Enabled': [],
  'Discovery Action Completed': ['action'],
  'Open To Chat Response Completed': ['response'],
  'Connection Created': ['method'],
  'Conversation Started': [],
  'Message Sent': ['attachment'],
  'Beta Feedback Submitted': [],
};

function safeProperties(
  name: LaunchEventName,
  properties: unknown
): Record<string, AnalyticsProperty> | undefined {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return undefined;
  }

  const allowed = new Set(LAUNCH_EVENT_PROPERTY_ALLOWLIST[name]);
  const entries = Object.entries(properties).filter(
    ([key, value]) =>
      allowed.has(key) &&
      (value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
  ) as [string, AnalyticsProperty][];

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function trackLaunchEvent<Name extends LaunchEventName>(
  name: Name,
  ...args: LaunchEventPayloads[Name] extends undefined
    ? []
    : [properties: LaunchEventPayloads[Name]]
): void {
  if (
    typeof window === 'undefined' ||
    !isProductionAnalyticsHost(window.location.hostname)
  ) {
    return;
  }

  try {
    track(name, safeProperties(name, args[0]));
  } catch {
    // Analytics must never interrupt a member action.
  }
}
