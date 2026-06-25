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