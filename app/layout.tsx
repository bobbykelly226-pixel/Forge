import type { Metadata, Viewport } from 'next';
import ForgeObservability from '@/components/analytics/ForgeObservability';
import './globals.css';
import './profile-theme.css';
import './marketing-theme.css';
import ForwardNavigationScroll from '@/components/ForwardNavigationScroll';

export const metadata: Metadata = {
  metadataBase: new URL('https://forge.forgedinlife.com'),
  title: 'Forge - Strong Values. Strong Connections.',
  description: 'A dating platform built for meaningful relationships rooted in faith, family, and commitment.',
  applicationName: 'Forge Dating',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Forge Dating',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/Logos/forgedinlife-favicon.png',
    shortcut: '/Logos/app-icon-centered-192.png',
    apple: {
      url: '/Logos/apple-touch-icon-centered.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
  openGraph: {
    title: 'Forge - Strong Values. Strong Connections.',
    description: 'A dating platform built for meaningful relationships rooted in faith, family, and commitment.',
    url: 'https://forge.forgedinlife.com',
    siteName: 'Forged In Life',
    images: [
      {
        url: '/Logos/forgedinlife-full-dark.png',
        width: 1200,
        height: 630,
        alt: 'Forge - Strong Values. Strong Connections.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forge - Strong Values. Strong Connections.',
    description: 'A dating platform built for meaningful relationships rooted in faith, family, and commitment.',
    images: ['/Logos/forgedinlife-full-dark.png'],
  },
  alternates: {
    canonical: 'https://forge.forgedinlife.com',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#101d35',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ForwardNavigationScroll />
        {children}
        <ForgeObservability />
      </body>
    </html>
  );
}
