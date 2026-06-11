'use client';

import { useState } from 'react';
import { joinWaitlist } from '../actions/waitlist';

export default function Waitlist() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setStatus('loading');
    const result = await joinWaitlist(formData);
    
    setStatus(result.success ? 'success' : 'error');
    setMessage(result.message);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      {/* Navigation Bar */}
      <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-outline.png" alt="Forge Logo" className="h-16 w-auto" />
            <span className="text-2xl font-semibold tracking-tight text-[#F8F6F2]">Forge</span>
          </div>
          <a href="/" className="text-[#F8F6F2] hover:text-white text-lg">← Back to Home</a>
        </div>
      </nav>

      {/* Waitlist Content */}
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-semibold text-[#0B2D5C] mb-6">Join the Waitlist</h1>
        
        <p className="text-xl text-[#444444] mb-12">
          Be among the first to help shape a dating platform where strong values lead to strong connections.
        </p>

        {status === 'success' && (
          <p className="text-green-600 font-medium mb-8 text-lg">{message}</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 font-medium mb-8">{message}</p>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="text" 
              name="name"
              placeholder="Your Full Name" 
              required
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg" 
            />
          </div>

          <div>
            <input 
              type="email" 
              name="email"
              placeholder="Your Email Address" 
              required
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg" 
            />
          </div>

          <p className="text-base text-[#666666] text-left pl-1">
            No spam. No pressure. Just updates on our progress and opportunities to help shape the future of Forge.
          </p>

          <button 
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#C62828] hover:bg-[#A61F1F] disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-lg transition mt-6"
          >
            {status === 'loading' ? 'Joining...' : 'Join Forge'}
          </button>
        </form>
      </div>
    </div>
  );
}