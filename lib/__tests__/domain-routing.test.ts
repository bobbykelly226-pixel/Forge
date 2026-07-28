import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import nextConfig from '../../next.config';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Forge domain routing', () => {
  it('uses the Forge subdomain for root and join metadata', () => {
    const rootLayout = read('app/layout.tsx');
    const joinLayout = read('app/join/layout.tsx');

    assert.equal(
      rootLayout.includes("metadataBase: new URL('https://forge.forgedinlife.com')"),
      true
    );
    assert.equal(
      rootLayout.includes("canonical: 'https://forge.forgedinlife.com'"),
      true
    );
    assert.equal(
      rootLayout.includes("url: 'https://forge.forgedinlife.com'"),
      true
    );
    assert.equal(
      joinLayout.includes("canonical: 'https://forge.forgedinlife.com/join'"),
      true
    );
    assert.equal(
      joinLayout.includes("url: 'https://forge.forgedinlife.com/join'"),
      true
    );
  });

  it('permanently redirects both legacy dating hosts while preserving paths', async () => {
    assert.ok(nextConfig.redirects);
    const redirects = await nextConfig.redirects();

    assert.deepEqual(
      redirects.map((redirect) => ({
        source: redirect.source,
        host: redirect.has?.[0]?.value,
        destination: redirect.destination,
        permanent: redirect.permanent,
      })),
      [
        {
          source: '/:path*',
          host: 'swiperightdating.com',
          destination: 'https://forge.forgedinlife.com/:path*',
          permanent: true,
        },
        {
          source: '/:path*',
          host: 'www.swiperightdating.com',
          destination: 'https://forge.forgedinlife.com/:path*',
          permanent: true,
        },
      ]
    );
  });
});
