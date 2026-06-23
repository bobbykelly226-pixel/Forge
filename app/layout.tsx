import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://forgedinlife.com'),
  title: 'Forge - Strong Values. Strong Connections.',
  description: 'A dating platform built for meaningful relationships rooted in faith, family, and commitment.',
  icons: {
    icon: '/Logos/forgedinlife-favicon.png',
  },
  openGraph: {
    title: 'Forge - Strong Values. Strong Connections.',
    description: 'A dating platform built for meaningful relationships rooted in faith, family, and commitment.',
    url: 'https://forgedinlife.com',
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
    canonical: 'https://forgedinlife.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}