import { Fraunces, Manrope } from 'next/font/google';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import MyProfileHubPrototype from '@/components/profile/MyProfileHubPrototype';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-discovery-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-discovery-sans',
  display: 'swap',
});

export const metadata = {
  title: 'My Profile | Forge',
  description:
    'Your home inside Forge — manage how you show up across Discovery and Connections. Prototype only.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyProfileHubPage() {
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <MyProfileHubPrototype />
    </ForgeAppCanvas>
  );
}
