'use client';

import Header from '../../components/Header';
import Link from 'next/link';
import { useState } from 'react';
import { joinWaitlist } from '../actions/waitlist';

export default function Waitlist() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);

    const result = await joinWaitlist(formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message || 'Successfully joined the waitlist!');
      setName('');
      setEmail('');
    } else {
      setStatus('error');
      setMessage(result.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-md mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] mb-6">Join the Waitlist</h1>
        
        <p className="text-xl text-[#444444] mb-12">
          Be among the first to experience a dating platform built around faith, family, commitment, and meaningful connection.
        </p>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12">
            <p className="text-2xl font-semibold text-green-800 mb-4">Thank you!</p>
            <p className="text-green-700">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name" 
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg"
              required
            />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email Address" 
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg"
              required
            />
            <button 
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[#0B2D5C] hover:bg-[#0A2540] disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-lg transition"
            >
              {status === 'loading' ? 'Submitting...' : 'Reserve My Spot'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-red-600 mt-4 text-sm">{message}</p>
        )}

        <p className="text-sm text-[#666666] mt-10">
          No spam. Just occasional updates, early access opportunities, and a chance to help shape the future of Forge.
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