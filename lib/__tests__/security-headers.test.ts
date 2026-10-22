import assert from 'node:assert/strict';
import test from 'node:test';
import nextConfig, { securityHeaders } from '../../next.config';

function getHeader(name: string) {
  return securityHeaders.find(({ key }) => key === name)?.value;
}

test('applies the security headers to every application route', async () => {
  assert.ok(nextConfig.headers);

  const configuredRoutes = await nextConfig.headers();

  assert.deepEqual(configuredRoutes.slice(0, 1), [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ]);
});

test('prevents MIME sniffing and cross-origin framing', () => {
  assert.equal(getHeader('X-Content-Type-Options'), 'nosniff');
  assert.equal(getHeader('X-Frame-Options'), 'DENY');

  const policy = getHeader('Content-Security-Policy');
  assert.ok(policy);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /base-uri 'self'/);
  assert.match(policy, /form-action 'self'/);
});

test('uses privacy-preserving referrer and browser capability policies', () => {
  assert.equal(
    getHeader('Referrer-Policy'),
    'strict-origin-when-cross-origin'
  );
  assert.equal(
    getHeader('Permissions-Policy'),
    'camera=(), microphone=(self), geolocation=(self), browsing-topics=(), payment=(), usb=()'
  );
});

test('allows only the external browser resources Forge currently needs', () => {
  const policy = getHeader('Content-Security-Policy');
  assert.ok(policy);

  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /https:\/\/\*\.supabase\.co/);
  assert.match(policy, /wss:\/\/\*\.supabase\.co/);
  assert.match(policy, /https:\/\/va\.vercel-scripts\.com/);
  assert.match(
    policy,
    /script-src[^;]*https:\/\/challenges\.cloudflare\.com/
  );
  assert.match(
    policy,
    /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/
  );
});

test('microphone policy survives client navigation and camera recording stays disabled', async () => {
 const routes = await nextConfig.headers!();
 assert.equal(routes.length, 1);
 assert.match(routes[0].headers.find(header => header.key === 'Permissions-Policy')!.value, /camera=\(\), microphone=\(self\)/);
 assert.equal(nextConfig.env?.NEXT_PUBLIC_VIDEO_MESSAGES_ENABLED, 'false');
});
