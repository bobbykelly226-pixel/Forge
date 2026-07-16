'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3 hover:opacity-90 transition flex-shrink-0 pl-2">
          <img 
            src="/Logos/forgedinlife-header-light.png" 
            alt="Forge" 
            className="h-16 sm:h-24 w-auto" 
          />
        </Link>

        <div className="hidden md:flex items-center gap-6 lg:gap-10 text-sm sm:text-lg font-semibold text-white">
          <Link href="/" className={`hover:text-[#D62828] transition ${pathname === '/' ? 'text-[#D62828]' : ''}`}>Home</Link>
          <Link href="/about" className={`hover:text-[#D62828] transition ${pathname === '/about' ? 'text-[#D62828]' : ''}`}>About</Link>
          <Link href="/values" className={`hover:text-[#D62828] transition ${pathname === '/values' ? 'text-[#D62828]' : ''}`}>Values</Link>
          <Link href="/founder" className={`hover:text-[#D62828] transition ${pathname === '/founder' ? 'text-[#D62828]' : ''}`}>Meet the Founder</Link>
          <div className="flex items-center gap-3 lg:gap-4 ml-2">
            <Link
              href="/login"
              className={`px-3 py-2 text-white/90 hover:text-white transition ${pathname === '/login' ? 'text-white' : ''}`}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-[#D62828] hover:bg-[#A61F1F] text-white px-5 py-2.5 rounded-xl font-semibold transition"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-3xl focus:outline-none"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0B2D5C] border-t border-white/20 py-4">
          <div className="flex flex-col text-center gap-3 text-lg font-semibold text-white px-6">
            <Link href="/" onClick={closeMenu} className="py-3 hover:text-[#D62828]">Home</Link>
            <Link href="/about" onClick={closeMenu} className="py-3 hover:text-[#D62828]">About</Link>
            <Link href="/values" onClick={closeMenu} className="py-3 hover:text-[#D62828]">Values</Link>
            <Link href="/founder" onClick={closeMenu} className="py-3 hover:text-[#D62828]">Meet the Founder</Link>
            <div className="border-t border-white/20 pt-4 mt-1 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="py-3 text-white/90 hover:text-white"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={closeMenu}
                className="bg-[#D62828] hover:bg-[#A61F1F] text-white py-3.5 rounded-xl font-semibold transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
