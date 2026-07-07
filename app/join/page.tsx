'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Join() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-16 pb-20 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <img
            src="/Logos/forgedinlife-full-dark.png"
            alt="Forge"
            className="max-w-[280px] w-full mx-auto mb-10"
          />

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-6 leading-tight">
            Become a Founding Member of Forge
          </h1>

          <p className="text-lg sm:text-xl text-[#444444] leading-relaxed max-w-2xl mx-auto">
            Help us build a dating platform focused on values, character, and intentional
            relationships — where faith, family, commitment, and purpose come before endless
            swiping.
          </p>
        </div>

        <div className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-8 sm:p-10 shadow-sm mb-12">
          <h2 className="text-2xl font-semibold text-[#0B2D5C] mb-4 text-center">
            Why Early Members Matter
          </h2>
          <div className="space-y-4 text-[#444444] text-lg leading-relaxed">
            <p>
              Forge is still in its pre-launch stage. The people who join now are not just signing
              up for an app — they are helping shape what gets built next.
            </p>
            <p>
              Founding members help us measure real demand, understand what people care about most,
              and guide the platform toward meaningful connection instead of surface-level matches.
            </p>
            <p>
              Your early support tells us whether there is enough interest to keep building a
              values-first dating community — one designed for people who want something real.
            </p>
          </div>
        </div>

        <div className="text-center space-y-6">
          <Link
            href="/wait"
            className="inline-block w-full sm:w-auto bg-[#D62828] hover:bg-[#A61F1F] text-white px-10 py-5 rounded-2xl font-semibold text-lg transition"
          >
            Join the Founding Member Waitlist →
          </Link>

          <p className="text-sm text-[#666666]">
            Takes less than a minute. No spam — just occasional launch updates.
          </p>

          <Link
            href="/"
            className="inline-block text-[#0B2D5C] hover:text-[#D62828] font-medium transition"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>

      <footer className="bg-[#0B2D5C] text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <img src="/Logos/forgedinlife-header-light.png" alt="Forge" className="h-12 w-auto" />
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm">
              <Link href="/about" className="hover:text-white transition">About</Link>
              <Link href="/values" className="hover:text-white transition">Values</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
            </div>

            <div className="flex gap-8 text-2xl">
              <a
                href="https://www.facebook.com/profile.php?id=61591000607513"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-white transition"
              >
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.9h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/forgedconnections/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white transition"
              >
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2zm0 2A3.76 3.76 0 0 0 4 7.75v8.5A3.76 3.76 0 0 0 7.75 20h8.5A3.76 3.76 0 0 0 20 16.25v-8.5A3.76 3.76 0 0 0 16.25 4h-8.5zM12 7.35A4.65 4.65 0 1 1 12 16.65 4.65 4.65 0 0 1 12 7.35zm0 2A2.65 2.65 0 1 0 12 14.65 2.65 2.65 0 0 0 12 9.35zm5.1-2.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
                </svg>
              </a>
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
