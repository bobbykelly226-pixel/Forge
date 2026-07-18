import type { Metadata } from 'next';

import UpdatePasswordForm from './UpdatePasswordForm';

export const metadata: Metadata = {
  title: 'Update password | Forge',
  description: 'Set a new password for your Forge account.',
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
