const PRODUCTION_ANALYTICS_HOSTS = new Set([
  'forge.forgedinlife.com',
  'forgedinlife.com',
  'www.forgedinlife.com',
]);

const UUID_PATH_SEGMENT =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi;

export function isProductionAnalyticsHost(hostname: string): boolean {
  return PRODUCTION_ANALYTICS_HOSTS.has(hostname.toLowerCase());
}

export function normalizeAnalyticsPath(pathname: string): string {
  const withoutProfileId = pathname.replace(
    /^\/discovery\/profile\/[^/]+\/?$/,
    '/discovery/profile/[profileId]'
  );
  const withoutConversationId = withoutProfileId.replace(
    /^\/connections\/c\/[^/]+\/?$/,
    '/connections/c/[conversationId]'
  );

  return withoutConversationId.replace(UUID_PATH_SEGMENT, '/[id]');
}

/**
 * Keep launch analytics aggregate-only: no query strings, hashes, auth tokens,
 * profile identifiers, conversation identifiers, or Preview traffic.
 */
export function sanitizeAnalyticsUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (!isProductionAnalyticsHost(url.hostname)) return null;

    url.pathname = normalizeAnalyticsPath(url.pathname);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeAnalyticsEvent<T extends { url: string }>(event: T): T | null {
  const url = sanitizeAnalyticsUrl(event.url);
  if (!url) return null;
  return { ...event, url };
}
