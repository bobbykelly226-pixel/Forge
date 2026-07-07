'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Join() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-16 pb-20 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.2em] text-[#D62828] font-semibold mb-6">
            You found Forge early
          </p>

          <img
            src="/Logos/forgedinlife-full-dark.png"
            alt="Forge"
            className="max-w-[280px] w-full mx-auto mb-10"
          />

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-6 leading-tight">
            Become a Founding Member of Forge
          </h1>

          <p className="text-xl sm:text-2xl font-medium text-[#0B2D5C] leading-relaxed max-w-2xl mx-auto mb-6">
            You&apos;re not signing up for another dating app. You&apos;re helping build one.
          </p>

          <p className="text-lg sm:text-xl text-[#444444] leading-relaxed max-w-2xl mx-auto">
            Forge is being built for people who believe meaningful relationships start with
            shared values — character, commitment, and intentional connection over endless
            swiping.
          </p>
        </div>

        <div className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-8 sm:p-10 shadow-sm mb-12">
          <h2 className="text-2xl font-semibold text-[#0B2D5C] mb-4 text-center">
            Why Your Support Matters Now
          </h2>
          <div className="space-y-4 text-[#444444] text-lg leading-relaxed">
            <p>
              Forge has not launched yet. Early supporters are not just waiting for an app —
              they are helping shape what gets built, what gets prioritized, and who this
              platform is truly for.
            </p>
            <p>
              Your voice helps us understand what matters most: values, character, commitment,
              and relationships built with intention — not surface-level matches or hookup culture.
            </p>
            <p>
              If you believe there should be a dating platform built on something deeper, this
              is your chance to stand with Forge before the world sees it.
            </p>
          </div>
        </div>

        <div className="text-center space-y-6">
          <Link
            href="/wait"
            className="inline-block w-full sm:w-auto bg-[#D62828] hover:bg-[#A61F1F] text-white px-10 py-5 rounded-2xl font-semibold text-lg transition"
          >
            Support the Launch →
          </Link>

          <p className="text-sm text-[#666666] max-w-md mx-auto">
            Stand with Forge at the beginning. Share your support, help guide the mission, and
            be part of what we build next.
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
