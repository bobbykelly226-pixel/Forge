'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      {/* Navigation */}
      <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition flex-shrink-0">
            <img src="/forge-header.png" alt="Forge Logo" className="h-10 sm:h-14 w-auto" />
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 sm:gap-12 text-sm sm:text-lg font-medium text-white">
            <Link href="/" className={`hover:text-[#D62828] transition ${pathname === '/' ? 'text-[#D62828] font-semibold' : ''}`}>Home</Link>
            <Link href="/about" className={`hover:text-[#D62828] transition ${pathname === '/about' ? 'text-[#D62828] font-semibold' : ''}`}>About</Link>
            <Link href="/values" className={`hover:text-[#D62828] transition ${pathname === '/values' ? 'text-[#D62828] font-semibold' : ''}`}>Values</Link>
            <Link href="#" className={`hover:text-[#D62828] transition ${pathname === '/founder' ? 'text-[#D62828] font-semibold' : ''}`}>Meet the Founder</Link>
            <Link href="/waitlist" className={`hover:text-[#D62828] transition ${pathname === '/waitlist' ? 'text-[#D62828] font-semibold' : ''}`}>Join Waitlist</Link>
          </div>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white text-3xl focus:outline-none"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0B2D5C] border-t border-white/20 py-4">
            <div className="flex flex-col text-center gap-4 text-lg font-medium text-white">
              <Link href="/" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Home</Link>
              <Link href="/about" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">About</Link>
              <Link href="/values" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Values</Link>
              <Link href="#" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Meet the Founder</Link>
              <Link href="/waitlist" onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#D62828]">Join Waitlist</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Background Watermark - Desktop Only */}
      <div className="hidden md:block fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
        <img src="/logo-outline.png" alt="" className="w-[820px] scale-[1.13] mt-48" />
      </div>

      {/* Hero Section - Improved Mobile Version */}
      <div 
        className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] flex items-center bg-cover bg-center md:bg-[center_25%]"
        style={{ backgroundImage: "url('/hero-couple.png')" }}
      >
        {/* Stronger gradient on mobile to improve text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F6F2] via-[#F8F6F2]/95 to-transparent md:via-[#F8F6F2]/90" 
             style={{ width: '82%' }}></div>

        <div className="relative z-10 max-w-4xl px-6 md:pl-16 text-left">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.02em] leading-none text-[#0B2D5C] mb-6">
            Strong Values.<br />
            <span className="text-[#D62828]">Strong Connections.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#444444] max-w-lg mb-8">
            A place where shared values come first, helping faith-driven and traditional-minded singles build meaningful, lasting relationships.
          </p>
          <a href="/waitlist" className="bg-[#D62828] hover:bg-[#A61F1F] text-white px-8 py-4 rounded-xl font-semibold text-lg transition inline-block">
            Join the Waitlist
          </a>
        </div>
      </div>

      {/* Horizontal Values Section */}
      <div className="bg-[#F4F4F4] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold tracking-tight text-[#0B2D5C] text-center mb-12">Our Core Values</h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-6">
            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-faith.png" alt="Faith" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">FAITH</h3>
              <p className="text-sm text-[#444444] text-center">Build a relationship with a foundation that matters.</p>
            </div>

            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-family.png" alt="Family" className="w-24 h-24 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">FAMILY</h3>
              <p className="text-sm text-[#444444] text-center">Find someone who values family as much as you do.</p>
            </div>

            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-service.png" alt="Service" className="w-24 h-24 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">SERVICE</h3>
              <p className="text-sm text-[#444444] text-center">Connect with people who lead with purpose and give with heart.</p>
            </div>

            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-commitment.png" alt="Commitment" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">COMMITMENT</h3>
              <p className="text-sm text-[#444444] text-center">Look for relationships built on loyalty, trust, and lasting commitment.</p>
            </div>

            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-integrity.png" alt="Integrity" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">INTEGRITY</h3>
              <p className="text-sm text-[#444444] text-center">Find someone whose actions match their values and words.</p>
            </div>

            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-responsibility.png" alt="Responsibility" className="w-24 h-24 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">RESPONSIBILITY</h3>
              <p className="text-sm text-[#444444] text-center">Connect with people who take ownership of their lives and future.</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Forge Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#D62828] uppercase tracking-widest text-sm font-medium mb-3">ABOUT FORGE</p>
            <h2 className="text-4xl sm:text-5xl leading-tight font-bold tracking-tight text-[#0B2D5C] mb-8">
              Meaningful relationships don’t happen by chance.<br />
              <span className="text-[#D62828]">They’re forged by design.</span>
            </h2>
            <p className="text-lg text-[#444444] leading-relaxed mb-8">
              Forge is a values-first dating platform for people who are tired of surface-level connections and ready for something real. 
              We believe the strongest relationships are built on shared values, mutual respect, and a commitment to something greater than ourselves.
            </p>
            <a href="/about" className="inline-flex items-center gap-3 bg-[#0B2D5C] hover:bg-[#0A2540] text-white px-8 py-4 rounded-xl font-semibold transition">
              Learn More About Forge →
            </a>
          </div>

          <div className="flex justify-center md:justify-end">
            <img src="/forge-full.png" alt="Forge Logo" className="max-w-[380px] w-full" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B2D5C] text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <img src="/forge-header.png" alt="Forge" className="h-9 w-auto" />
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm">
              <Link href="/about" className="hover:text-white transition">About</Link>
              <Link href="/values" className="hover:text-white transition">Values</Link>
              <Link href="#" className="hover:text-white transition">Mission</Link>
              <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition">Contact</Link>
            </div>

            <div className="flex gap-8 text-2xl">
              <a href="#" className="hover:text-white transition">📘</a>
              <a href="#" className="hover:text-white transition">📷</a>
              <a href="#" className="hover:text-white transition">𝕏</a>
            </div>
          </div>

          <div className="text-center text-xs text-white/60 mt-6">
            © 2026 Forged by Design. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}