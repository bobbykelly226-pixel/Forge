'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Founder() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C]">Why I Built Forge</h1>
          <p className="text-xl text-[#444444] mt-4">Every meaningful journey begins with a story. Here's mine.</p>
        </div>

        <div className="prose prose-lg text-[#444444] leading-[1.75] max-w-3xl mx-auto space-y-8">
          <p>Several years ago, after my marriage ended, I found myself stepping back into the world of modern dating. Like many people, I downloaded the popular apps hoping to find a genuine connection.</p>
          <p>Along the way, I met some wonderful people, but I kept running into the same challenge. The things that mattered most to me weren't easy to find. I could quickly learn someone's favorite restaurant, their hobbies, or where they liked to travel. But it was much harder to discover the things that truly shape a relationship, faith, family, integrity, service, commitment, and the values that guide someone's life.</p>
          <p>I wasn't looking for everyone to think like me. I simply wanted a better way to find people who shared similar principles and were searching for something lasting.</p>
          <p className="text-2xl font-semibold text-[#0B2D5C] italic text-center my-12">Eventually, I found myself asking one simple question.<br />What if there was a better way?</p>
          <p>That question eventually became Forge.</p>
          <p>For more than twenty years, I've dedicated my career to serving others, as an EMT, a police officer, and now as a registered nurse. I'm also the proud father of two incredible daughters. Those experiences have continually reinforced something I've always believed: The strongest relationships aren't built on perfect compatibility. They're built on shared values, mutual respect, trust, and a commitment to something greater than ourselves.</p>
          <p>Those aren't just ideals. They're principles I've tried to live by. And they became the foundation for Forge.</p>
          <p>Forge isn't about telling people what they should believe. It's about creating a place where people can be honest about who they are, what they value, and the kind of future they hope to build with someone else.</p>
          <p>My hope is that Forge becomes more than another dating platform. I hope it becomes a community where people who value authenticity, commitment, faith, family, integrity, and meaningful connection finally feel at home.</p>
          <p>Thank you for taking the time to learn my story. Whether you're here because you're curious, because you share these values, or because you're simply looking for something real... Welcome.</p>
          <div className="my-16 text-center">
            <p className="text-3xl font-semibold text-[#D62828]">Because meaningful relationships aren't forged by chance.</p>
            <p className="text-3xl font-semibold text-[#D62828] mt-2">They're Forged In Life.</p>
          </div>
          <div className="max-w-3xl mx-auto text-left mt-8">
            <p className="text-[1.35rem] font-medium text-[#0B2D5C]">Bobby</p>
            <p className="text-lg text-[#666666]">Founder, Forged In Life</p>
          </div>
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