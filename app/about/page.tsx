'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-4xl mx-auto px-6">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] mb-8">About Forge</h1>
        
        <div className="prose text-lg text-[#444444] leading-relaxed space-y-8">
          <h2 className="text-3xl font-semibold text-[#0B2D5C]">Built for Meaningful Relationships</h2>
          <p>
            Forge is a dating platform for people who value faith, family, commitment, and genuine connection 
            over hookup culture and endless swiping.
          </p>
          <p>
            We believe the strongest relationships begin with shared values. While many dating apps prioritize 
            volume and superficial interactions, Forge is designed to help people connect through what matters most: 
            character, purpose, beliefs, and long-term compatibility.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C]">Who Forge Is For</h2>
          <p>
            Forge is for people seeking something more intentional. Whether you're a professional, first responder, 
            military member, healthcare worker, parent, entrepreneur, blue-collar worker, person of faith, or simply 
            someone who values commitment and authenticity, Forge was created with you in mind.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C]">Our Mission</h2>
          <p>
            Our mission is simple: <strong>Strong Values. Strong Connections.</strong><br />
            We believe meaningful relationships are forged through shared values, mutual respect, 
            and a genuine desire to build something lasting.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C]">The Meaning Behind Our Name</h2>
          <p>
            Forge is more than a name. It represents the belief that the strongest things in life are built with intention, guided by character, and created to last. We believe meaningful relationships grow the same way. They are built through shared values, mutual respect, trust, faith, commitment, and a genuine desire to build a life together.
          </p>
          <p>
            Forge is the platform where those connections begin. Forged In Life is the philosophy behind it. It reflects our belief that life's strongest relationships are not built on chance alone. They are shaped by the choices we make, the values we live by, and the lives we build together.
          </p>
          <p>
            Because meaningful relationships aren't simply found.
          </p>
          <p>
            They're Forged In Life.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C]">Why We Built Forge</h2>
          <p>
            Many people feel disconnected from modern dating culture. Endless swiping, casual interactions, 
            and surface-level matching often leave people frustrated and discouraged.
          </p>
          <p>
            Forge was created as an alternative, a place where values come first and meaningful relationships 
            can grow from a strong foundation.
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