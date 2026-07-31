'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { SpeedInsightsProps } from '@vercel/speed-insights';

import {
  normalizeAnalyticsPath,
  sanitizeAnalyticsEvent,
} from '@/lib/analytics/privacy';

type SpeedInsightsEvent = Parameters<
  NonNullable<SpeedInsightsProps['beforeSend']>
>[0];

function sanitizeWebAnalyticsEvent(event: BeforeSendEvent) {
  return sanitizeAnalyticsEvent(event);
}

function sanitizeSpeedInsightsEvent(event: SpeedInsightsEvent) {
  const sanitized = sanitizeAnalyticsEvent(event);
  if (!sanitized) return null;
  return {
    ...sanitized,
    route: sanitized.route
      ? normalizeAnalyticsPath(sanitized.route)
      : sanitized.route,
  };
}

export default function ForgeObservability() {
  return (
    <>
      <Analytics
        mode="production"
        debug={false}
        beforeSend={sanitizeWebAnalyticsEvent}
      />
      <SpeedInsights debug={false} beforeSend={sanitizeSpeedInsightsEvent} />
    </>
  );
}
