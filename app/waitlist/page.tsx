'use client';

import Header from '../../components/Header';

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
    </div>
  );
}