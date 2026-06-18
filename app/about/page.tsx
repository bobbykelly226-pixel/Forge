'use client';

import Header from '../../components/Header';

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

          <h2 className="text-3xl font-semibold text-[#0B2D5C]">Why We Built Forge</h2>
          <p>
            Many people feel disconnected from modern dating culture. Endless swiping, casual interactions, 
            and surface-level matching often leave people frustrated and discouraged.
          </p>
          <p>
            Forge was created as an alternative — a place where values come first and meaningful relationships 
            can grow from a strong foundation.
          </p>
        </div>
      </div>
    </div>
  );
}