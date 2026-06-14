'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img 
            src="/forge-header.png" 
            alt="Forge Logo" 
            className="h-14 sm:h-16 w-auto"
          />
        </a>
        
        <div className="flex items-center gap-6 sm:gap-10 text-sm sm:text-lg font-medium text-white">
          <Link href="/" className={`hover:text-[#D62828] transition ${pathname === '/' ? 'text-[#D62828] font-semibold' : ''}`}>Home</Link>
          <Link href="/about" className={`hover:text-[#D62828] transition ${pathname === '/about' ? 'text-[#D62828] font-semibold' : ''}`}>About</Link>
          <Link href="/values" className={`hover:text-[#D62828] transition ${pathname === '/values' ? 'text-[#D62828] font-semibold' : ''}`}>Values</Link>
          <Link href="/waitlist" className={`hover:text-[#D62828] transition ${pathname === '/waitlist' ? 'text-[#D62828] font-semibold' : ''}`}>Join Waitlist</Link>
        </div>
      </div>
    </nav>
  );
}