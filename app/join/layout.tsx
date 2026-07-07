import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Forge Early | Forged In Life',
  description:
    'Help build a values-first dating platform focused on character, commitment, and intentional relationships.',
  alternates: {
    canonical: 'https://forgedinlife.com/join',
  },
  openGraph: {
    title: 'Join Forge Early | Forged In Life',
    description:
      'Help build a values-first dating platform focused on character, commitment, and intentional relationships.',
    url: 'https://forgedinlife.com/join',
  },
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
