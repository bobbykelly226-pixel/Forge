'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Values() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      {/* Navigation */}
      <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <img src="/forge-header.png" alt="Forge Logo" className="h-14 sm:h-16 w-auto" />
          </a>
          
          <div className="flex items-center gap-6 sm:gap-10 text-sm sm:text-lg font-medium text-white">
            <Link href="/" className={`hover:text-[#D62828] transition ${pathname === '/' ? 'text-[#D62828] font-semibold' : ''}`}>Home</Link>
            <Link href="/about" className={`hover:text-[#D62828] transition ${pathname === '/about' ? 'text-[#D62828] font-semibold' : ''}`}>About</Link>
            <Link href="/values" className={`hover:text-[#D62828] transition ${pathname === '/values' ? 'text-[#D62828] font-semibold' : ''}`}>Values</Link>
            <Link href="/waitlist" className={`hover:text-[#D62828] transition ${pathname === '/waitlist' ? 'text-[#D62828] font-semibold' : ''}`}>Join Waitlist</Link>
          </div>
        </div>
      </nav>

      {/* Background Logo Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
        <img src="/logo-outline.png" alt="" className="w-[820px] scale-[1.13] mt-48" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-semibold text-[#0B2D5C] mb-4 text-center">Our Values</h1>
        <p className="text-xl text-[#444444] text-center mb-16">
          The strongest relationships begin with a shared foundation.
        </p>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
          {/* Responsibility */}
          <div>
            <img src="/icon-responsibility.png" alt="Responsibility" className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-3">Personal Responsibility</h3>
            <p className="text-[#444444]">We believe character matters. Accountability, self-improvement, respect for others, and taking ownership of our actions.</p>
          </div>

          {/* Integrity */}
          <div>
            <img src="/icon-integrity.png" alt="Integrity" className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-3">Integrity</h3>
            <p className="text-[#444444]">Honesty and authenticity are essential. Be honest about who you are, respect others, communicate openly, and follow through.</p>
          </div>

          {/* Commitment */}
          <div>
            <img src="/icon-commitment.png" alt="Commitment" className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-3">Commitment</h3>
            <p className="text-[#444444]">Meaningful relationships require effort and dedication. Intentional dating, long-term thinking, reliability, and trust.</p>
          </div>

          {/* Service */}
          <div>
            <img src="/icon-service.png" alt="Service" className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-3">Service</h3>
            <p className="text-[#444444]">We value those who put others first — first responders, military, healthcare workers, and community leaders who live with purpose and sacrifice.</p>
          </div>

          {/* Family */}
          <div>
            <img src="/icon-family.png" alt="Family" className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-3">Family</h3>
            <p className="text-[#444444]">Strong families create strong communities. We honor those who prioritize family, commitment, and building a lasting legacy.</p>
          </div>

          {/* Faith */}
          <div>
            <img src="/icon-faith.png" alt="Faith" className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-3">Faith</h3>
            <p className="text-[#444444]">We welcome people of faith who believe spiritual values strengthen relationships and provide purpose and commitment.</p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-2xl font-semibold text-[#0B2D5C]">Strong Values. Strong Connections.</p>
        </div>
      </div>
    </div>
  );
}