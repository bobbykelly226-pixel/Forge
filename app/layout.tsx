import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forge - Strong Values. Strong Connections.',
  description: 'A dating platform built for meaningful relationships rooted in faith, family, and commitment.',
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