import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
