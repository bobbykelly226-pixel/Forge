import type { NextConfig } from 'next';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.vercel-insights.com",
  "media-src 'self' blob: https://*.supabase.co",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(self), browsing-topics=(), payment=(), usb=()',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

// Enable the approved video trial only on the designated Preview branches.
const videoPreviewEnabled = process.env.VERCEL_ENV === 'preview'
  && ['codex/video-messages', 'codex/fix008-discovery-persistent'].includes(process.env.VERCEL_GIT_COMMIT_REF ?? '')
  && process.env.NEXT_PUBLIC_VIDEO_MESSAGES_ENABLED !== 'false';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VIDEO_MESSAGES_ENABLED: videoPreviewEnabled ? 'true' : 'false',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/connections/c/:path*',
        headers: [{ key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), browsing-topics=(), payment=(), usb=()' }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'swiperightdating.com',
          },
        ],
        destination: 'https://forge.forgedinlife.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.swiperightdating.com',
          },
        ],
        destination: 'https://forge.forgedinlife.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
