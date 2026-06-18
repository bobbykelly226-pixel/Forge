'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Founder() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      {/* Hero */}
      <div className="pt-20 pb-16 bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#D62828] uppercase tracking-widest text-sm font-medium mb-3">MEET THE FOUNDER</p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#0B2D5C] leading-none mb-6">
            Why I Built Forge
          </h1>
          <p className="text-xl text-[#444444] max-w-2xl mx-auto">
            Every meaningful journey begins with a story. Here's mine.
          </p>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-3xl mx-auto px-6 py-20 prose prose-lg text-[#444444]">
        <p className="text-xl leading-relaxed">
          Forge began with a simple question:
        </p>
        <p className="text-2xl font-semibold text-[#0B2D5C] italic text-center my-12">
          Where are the people who still value faith, family, commitment, integrity, and personal responsibility?
        </p>

        <p>
          After my divorce nearly seven years ago, I stepped back into the world of modern dating. 
          Like many people, I tried the popular apps hoping to find a real connection.
        </p>

        <p>
          I met some wonderful people along the way, but I kept running into the same challenge: 
          the values that mattered most to me were hard to find and even harder to express.
        </p>

        <p>
          The apps made it easy to list hobbies and interests, but there were very few ways to signal 
          the deeper things I cared about: faith, family, service, and a desire for meaningful commitment. 
          I wasn't looking for everyone to think like me. I simply wanted a better way to connect with people 
          who shared similar principles and were looking for something lasting.
        </p>

        <p className="text-2xl font-semibold text-[#0B2D5C] italic text-center my-12">
          What if there was a better way?
        </p>

        <p>
          For more than twenty years, I've dedicated my career to serving others — first as an EMT, 
          then as a police officer, and now as a registered nurse. I'm also the proud father of two incredible daughters. 
          Those experiences have reinforced something I've always believed: the strongest relationships aren't built on perfect compatibility. 
          They're built on shared values, mutual respect, trust, and a commitment to something greater than ourselves.
        </p>

        <p>
          That belief became the foundation for Forge.
        </p>

        <p>
          Forge isn't about politics. It isn't about excluding people. It's about creating a place where values matter. 
          A place where people can be honest about who they are and what they believe.
        </p>

        <p>
          My hope is that Forge becomes more than just another dating platform. 
          I hope it becomes a community where people who value commitment, authenticity, and genuine connection finally feel at home.
        </p>

        <div className="my-16 text-center border-t border-b border-[#0B2D5C]/20 py-12">
          <p className="text-3xl font-semibold text-[#0B2D5C]">
            Because meaningful relationships aren't forged by chance.
          </p>
          <p className="text-3xl font-semibold text-[#D62828] mt-2">
            They're Forged by Design.
          </p>
        </div>

        <p className="text-center text-xl font-medium text-[#0B2D5C]">
          — Bobby Kelly<br />
          Founder, Forged by Design
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white py-20 border-t">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-[#0B2D5C] mb-6">
            Help Shape the Future of Forge
          </h2>
          <p className="text-lg text-[#444444] mb-10">
            Your feedback is helping build something meaningful from the very beginning.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/"
              className="inline-block bg-[#D62828] hover:bg-[#A61F1F] text-white px-10 py-4 rounded-2xl font-semibold text-lg transition"
            >
              Take Our Poll →
            </a>
            <a 
              href="/waitlist"
              className="inline-block border border-[#0B2D5C] hover:bg-[#F8F6F2] text-[#0B2D5C] px-10 py-4 rounded-2xl font-semibold text-lg transition"
            >
              Join the Waitlist
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}