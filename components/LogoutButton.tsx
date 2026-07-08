'use client';

import { useFormStatus } from 'react-dom';

import { logout } from '@/app/actions/auth';

function LogoutButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#0B2D5C] hover:bg-[#0A2540] disabled:bg-gray-400 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition"
    >
      {pending ? 'Signing out...' : 'Log out'}
    </button>
  );
}

export default function LogoutButton() {
  return (
    <form action={logout}>
      <LogoutButtonInner />
    </form>
  );
}
