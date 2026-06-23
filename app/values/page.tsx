'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Values() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-6xl mx-auto px-6">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] text-center mb-12">Our Core Values</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {/* Faith */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-faith.png" alt="Faith" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Faith</h3>
            <p className="text-[#444444] leading-relaxed">
              We welcome people from every faith background who believe spiritual values play an important role in building meaningful relationships and living a purposeful life.
            </p>
          </div>

          {/* Family */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-family.png" alt="Family" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Family</h3>
            <p className="text-[#444444] leading-relaxed">
              Strong families strengthen communities. Whether you're hoping to start a family, grow one, or simply cherish the relationships you already have, family matters here.
            </p>
          </div>

          {/* Service */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-service.png" alt="Service" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Service</h3>
            <p className="text-[#444444] leading-relaxed">
              Many people drawn to Forge dedicate their lives to serving others, including first responders, members of the military, healthcare professionals, teachers, and community leaders.
            </p>
          </div>

          {/* Commitment */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-commitment.png" alt="Commitment" className="w-20 h-20 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Commitment</h3>
            <p className="text-[#444444] leading-relaxed">
              Meaningful relationships require consistency, commitment, and the willingness to grow together through every season of life.
            </p>
          </div>

          {/* Integrity */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-integrity.png" alt="Integrity" className="w-20 h-20 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Integrity</h3>
            <p className="text-[#444444] leading-relaxed">
              Honesty, authenticity, and trust are the foundation of every lasting relationship. We believe character matters just as much as compatibility.
            </p>
          </div>

          {/* Personal Responsibility */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-responsibility.png" alt="Responsibility" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Personal Responsibility</h3>
            <p className="text-[#444444] leading-relaxed">
              Healthy relationships begin with personal responsibility. Accountability, self-awareness, and continuous growth help create stronger partners and stronger relationships.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-3xl font-semibold text-[#0B2D5C]">
            Strong Values. Strong Connections.
          </p>
        </div>
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