'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Join() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-12 sm:pt-16 pb-24 sm:pb-28 max-w-3xl mx-auto px-5 sm:px-6">
        <section
          aria-labelledby="join-hero-heading"
          className="text-center mb-16 sm:mb-20"
        >
          <p className="text-sm sm:text-base tracking-wide text-[#D62828] font-semibold mb-8 sm:mb-10 text-balance">
            Welcome. You Found Forge Early.
          </p>

          <img
            src="/Logos/forgedinlife-full-dark.png"
            alt="Forge by Forged In Life"
            className="max-w-[220px] sm:max-w-[280px] w-full mx-auto mb-10 sm:mb-12"
          />

          <h1
            id="join-hero-heading"
            className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-4 sm:mb-5 leading-tight px-2 text-balance"
          >
            Help Build Something Different
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-[#0B2D5C] mb-8 sm:mb-10 leading-snug px-2 text-balance">
            Become a Founding Member of Forge
          </p>

          <p className="text-lg sm:text-2xl font-medium text-[#0B2D5C] leading-relaxed max-w-2xl mx-auto mb-10 sm:mb-12 px-1 text-balance">
            You&apos;re not signing up for another dating app. You&apos;re helping build one.
          </p>

          <div className="space-y-5 sm:space-y-6 text-base sm:text-lg text-[#444444] leading-relaxed max-w-2xl mx-auto text-center px-1">
            <p>
              Forge is being built for people who believe meaningful relationships begin with
              shared values, strong character, commitment, and intention.
            </p>
            <p>
              As one of our earliest supporters, you&apos;ll help shape what Forge becomes before
              launch. Your feedback, ideas, and encouragement will influence the platform from
              the very beginning.
            </p>
            <p>
              If you believe dating should be built on something deeper, we&apos;d love to build it
              with you.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="join-support-heading"
          className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-7 sm:p-10 shadow-sm mb-16 sm:mb-20"
        >
          <h2
            id="join-support-heading"
            className="text-xl sm:text-2xl font-semibold text-[#0B2D5C] mb-6 sm:mb-8 text-center text-balance"
          >
            Why Early Support Matters
          </h2>
          <ul className="space-y-4 sm:space-y-5 text-[#444444] text-base sm:text-lg leading-relaxed max-w-xl mx-auto list-disc marker:text-[#D62828] pl-5 sm:pl-6">
            <li>Your voice helps shape the platform before launch.</li>
            <li>Early supporters influence the features and priorities we build first.</li>
            <li>
              Together we&apos;re creating a community focused on character, compatibility, and
              lasting relationships.
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="join-cta-heading"
          className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-7 sm:p-10 shadow-sm text-center"
        >
          <h2 id="join-cta-heading" className="sr-only">
            Support the Forge launch
          </h2>

          <div className="space-y-7 sm:space-y-8">
            <Link
              href="/wait"
              className="inline-block w-full sm:w-auto min-h-[56px] bg-[#D62828] hover:bg-[#A61F1F] hover:-translate-y-0.5 hover:shadow-lg text-white px-10 py-5 rounded-2xl font-semibold text-lg transition motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] focus-visible:ring-offset-2"
            >
              Support the Launch
            </Link>

            <p className="text-sm sm:text-base text-[#666666] max-w-md mx-auto leading-relaxed px-2 text-balance">
              We&apos;ll send occasional updates as Forge grows. No spam. No pressure. Just progress.
            </p>

            <Link
              href="/"
              className="inline-block text-sm text-[#0B2D5C]/80 hover:text-[#D62828] font-medium transition py-2"
            >
              ← Back to Homepage
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#0B2D5C] text-white/80 py-8 mt-8 sm:mt-12">
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
