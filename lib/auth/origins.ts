const PRODUCTION_AUTH_ORIGIN = 'https://forge.forgedinlife.com';
const DEVELOPMENT_AUTH_ORIGIN = 'http://localhost:3000';

/**
 * Exact origins Forge may place in authentication emails or server redirects.
 * Keep this list server-owned: browser payloads and request Host/Origin headers
 * must never expand it.
 */
export const AUTH_ORIGIN_ALLOWLIST = Object.freeze([
  PRODUCTION_AUTH_ORIGIN,
  DEVELOPMENT_AUTH_ORIGIN,
  'http://127.0.0.1:3000',
]);

type AuthOriginEnvironment = {
  NODE_ENV?: string;
  FORGE_AUTH_ORIGIN?: string;
};

function normalizeOrigin(candidate: string | undefined): string | null {
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Select Forge's authentication origin exclusively from server configuration.
 * An invalid or unapproved configuration fails closed to the canonical origin.
 */
export function getCanonicalAuthOrigin(
  environment: AuthOriginEnvironment = process.env
): string {
  const configured = normalizeOrigin(environment.FORGE_AUTH_ORIGIN);
  if (configured && AUTH_ORIGIN_ALLOWLIST.includes(configured)) {
    return configured;
  }

  if (environment.NODE_ENV === 'development' || environment.NODE_ENV === 'test') {
    return DEVELOPMENT_AUTH_ORIGIN;
  }

  return PRODUCTION_AUTH_ORIGIN;
}

export function buildCanonicalAuthUrl(
  internalPath: string,
  environment: AuthOriginEnvironment = process.env
): string {
  if (
    !internalPath.startsWith('/') ||
    internalPath.startsWith('//') ||
    internalPath.includes('\\')
  ) {
    throw new Error('Authentication redirect paths must be internal paths.');
  }

  const canonicalOrigin = getCanonicalAuthOrigin(environment);
  const destination = new URL(internalPath, canonicalOrigin);

  if (destination.origin !== canonicalOrigin) {
    throw new Error('Authentication redirect paths must stay on the canonical origin.');
  }

  return destination.toString();
}
