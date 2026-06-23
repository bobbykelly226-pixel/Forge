'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Waitlist() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-md mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] mb-6">Join the Waitlist</h1>
        
        <p className="text-xl text-[#444444] mb-12">
          Be among the first to experience Forge when it launches.
        </p>

        <form className="space-y-6">
          <input 
            type="text" 
            placeholder="Your Full Name" 
            className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg"
          />
          <input 
            type="email" 
            placeholder="Your Email Address" 
            className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg"
          />
          <button 
            type="button"
            className="w-full bg-[#0B2D5C] hover:bg-[#0A2540] text-white font-semibold py-5 rounded-2xl text-lg transition"
          >
            Reserve My Spot
          </button>
        </form>

        <p className="text-sm text-[#666666] mt-10">
          No spam. No pressure. Just updates on our progress and opportunities to help shape the future of Forge.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B2D5C] text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <img src="/Logos/forgedinlife-header-light.png" alt="Forge" className="h-12 w-auto" />
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
            © 2026 Forged In Life. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}