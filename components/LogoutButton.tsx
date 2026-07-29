'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function LogoutButton({
  className = '',
}: {
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setPending(false);
        return;
      }

      // Hard navigation clears client state (including the mobile menu) and
      // avoids stale RSC/session payloads that soft redirects can leave on mobile.
      window.location.assign('/');
    } catch {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={`rounded-2xl bg-[#0B2D5C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] disabled:bg-gray-400 ${className}`}
    >
      {pending ? 'Signing out...' : 'Log out'}
    </button>
  );
}
