'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-3xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] mb-10">Contact Us</h1>

        <div className="prose prose-lg max-w-2xl mx-auto text-[#444444] space-y-8">
          <p className="text-xl">
            We would love to hear from you.
          </p>

          <p>
            Forge is currently in its waitlist stage. Whether you have a question, want to share feedback, or are interested in what we are building, you can reach us directly by email.
          </p>

          <div className="pt-6 border-t border-[#0B2D5C]/10">
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">General Inquiries</h2>
            <p className="text-lg">
              For general questions, waitlist interest, feedback, or launch updates, contact:
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-[#0B2D5C] mt-6 break-words">
              <a href="mailto:hello@forgedinlife.com" className="hover:underline">hello@forgedinlife.com</a>
            </p>
          </div>

          <div className="pt-6 border-t border-[#0B2D5C]/10">
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Support and Policy Questions</h2>
            <p className="text-lg">
              For privacy, terms, support, or account-related questions, contact:
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-[#0B2D5C] mt-6 break-words">
              <a href="mailto:support@forgedinlife.com" className="hover:underline">support@forgedinlife.com</a>
            </p>
          </div>

          <p className="pt-8 text-lg">
            We are a small team building Forge with care. Your feedback and support mean a great deal as we prepare for what comes next.
          </p>
        </div>
      </div>

      {/* Footer - unchanged */}
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