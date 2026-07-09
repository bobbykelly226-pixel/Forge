'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
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
      className="bg-[#0B2D5C] hover:bg-[#0A2540] disabled:bg-gray-400 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition"
    >
      {pending ? 'Signing out...' : 'Log out'}
    </button>
  );
}
