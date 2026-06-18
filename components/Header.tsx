'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-90 transition flex-shrink-0">
          <img src="/forge-header.png" alt="Forge Logo" className="h-10 sm:h-14 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-8 sm:gap-12 text-sm sm:text-lg font-medium text-white">
          <Link href="/" className={`hover:text-[#D62828] transition ${pathname === '/' ? 'text-[#D62828] font-semibold' : ''}`}>Home</Link>
          <Link href="/about" className={`hover:text-[#D62828] transition ${pathname === '/about' ? 'text-[#D62828] font-semibold' : ''}`}>About</Link>
          <Link href="/values" className={`hover:text-[#D62828] transition ${pathname === '/values' ? 'text-[#D62828] font-semibold' : ''}`}>Values</Link>
          <Link href="/founder" className={`hover:text-[#D62828] transition ${pathname === '/founder' ? 'text-[#D62828] font-semibold' : ''}`}>Meet the Founder</Link>
          <Link href="/waitlist" className={`hover:text-[#D62828] transition ${pathname === '/waitlist' ? 'text-[#D62828] font-semibold' : ''}`}>Join Waitlist</Link>
        </div>

        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-3xl focus:outline-none"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0B2D5C] border-t border-white/20 py-4">
          <div className="flex flex-col text-center gap-4 text-lg font-medium text-white">
            <Link href="/" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Home</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">About</Link>
            <Link href="/values" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Values</Link>
            <Link href="/founder" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Meet the Founder</Link>
            <Link href="/waitlist" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Join Waitlist</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
